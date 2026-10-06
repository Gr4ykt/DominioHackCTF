import { createHash, randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { Env } from '../config/env.validation.js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { GoogleProfile, JwtPayload } from './types/auth-user.js';

const BCRYPT_ROUNDS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: User['role'];
  avatar_url: string | null;
  total_points: number;
  created_at: Date;
}

/** Resultado interno: el refresh token nunca sale en el cuerpo de la respuesta. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.toLowerCase();
    await this.assertAvailable(email, dto.username);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.createUser({
      username: dto.username,
      email,
      passwordHash,
      provider: 'local',
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    // Las cuentas creadas con Google no tienen contraseña local.
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.isActive) throw new ForbiddenException('Cuenta desactivada');

    return this.issueTokens(user);
  }

  /** Rota el refresh token: el recibido queda revocado y se emite un par nuevo. */
  async refresh(refreshToken: string): Promise<AuthSession> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Refresh token inválido');

    if (stored.revoked) {
      // Un token ya rotado que vuelve a aparecer indica posible robo:
      // se cierran todas las sesiones del usuario.
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expirado');
    }
    if (!stored.user.isActive) {
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // updateMany con revoked=false evita que dos peticiones simultáneas
    // roten el mismo token.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revoked: false },
      data: { revoked: true },
    });
    if (count === 0) throw new UnauthorizedException('Refresh token inválido');

    return this.issueTokens(stored.user);
  }

  /** Revoca el refresh token indicado. Poseerlo es prueba suficiente de la sesión. */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken) },
      data: { revoked: true },
    });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.toPublicUser(user);
  }

  /** Login o alta mediante Google. Devuelve tokens propios, igual que el login local. */
  async loginWithGoogle(profile: GoogleProfile): Promise<AuthSession> {
    if (!profile.email || !profile.emailVerified) {
      throw new UnauthorizedException(
        'La cuenta de Google no tiene un correo verificado',
      );
    }
    const email = profile.email.toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Mismo correo ya registrado: se vincula la cuenta de Google.
        user = await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: existing.avatarUrl ?? profile.avatarUrl,
          },
        });
      } else {
        user = await this.createUser({
          username: await this.generateUsername(email),
          email,
          passwordHash: null,
          provider: 'google',
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
        });
      }
    }

    if (!user.isActive) throw new ForbiddenException('Cuenta desactivada');
    return this.issueTokens(user);
  }

  private async assertAvailable(email: string, username: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: { equals: username, mode: 'insensitive' } },
        ],
      },
      select: { email: true },
    });
    if (!existing) return;
    throw new ConflictException(
      existing.email === email
        ? 'El correo ya está registrado'
        : 'El nombre de usuario ya está en uso',
    );
  }

  /** El primer usuario del sistema recibe el rol superuser. */
  private createUser(data: {
    username: string;
    email: string;
    passwordHash: string | null;
    provider: User['provider'];
    googleId?: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const isFirstUser = (await tx.user.count()) === 0;
      return tx.user.create({
        data: { ...data, role: isFirstUser ? 'superuser' : 'user' },
      });
    });
  }

  private async generateUsername(email: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 14) || 'user';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate =
        attempt === 0 && base.length >= 3
          ? base
          : `${base}_${randomBytes(2).toString('hex')}`;
      const taken = await this.prisma.user.findFirst({
        where: { username: { equals: candidate, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!taken) return candidate;
    }
    return `user_${randomBytes(6).toString('hex')}`;
  }

  private async issueTokens(user: User): Promise<AuthSession> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    // Token opaco de alta entropía; en BD solo queda su SHA-256.
    const refreshToken = randomBytes(48).toString('base64url');
    const days = this.config.get('REFRESH_TOKEN_DAYS', { infer: true });
    const refreshExpiresAt = new Date(Date.now() + days * DAY_MS);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt,
      user: this.toPublicUser(user),
    };
  }

  private revokeAllForUser(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar_url: user.avatarUrl,
      total_points: user.totalPoints,
      created_at: user.createdAt,
    };
  }
}
