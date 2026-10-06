import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

interface UserRow {
  id: string;
  username: string;
  email: string;
  passwordHash: string | null;
  provider: string;
  googleId: string | null;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
  totalPoints: number;
  createdAt: Date;
}

interface TokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
}

/** Doble en memoria de las operaciones de Prisma que usa AuthService. */
function createPrismaFake() {
  const users: UserRow[] = [];
  const tokens: TokenRow[] = [];

  const user = {
    count: async () => users.length,
    create: async ({ data }: { data: Partial<UserRow> }) => {
      const row: UserRow = {
        id: randomUUID(),
        username: data.username!,
        email: data.email!,
        passwordHash: data.passwordHash ?? null,
        provider: data.provider ?? 'local',
        googleId: data.googleId ?? null,
        role: data.role ?? 'user',
        isActive: true,
        avatarUrl: data.avatarUrl ?? null,
        totalPoints: 0,
        createdAt: new Date(),
      };
      users.push(row);
      return row;
    },
    findUnique: async ({ where }: { where: Partial<UserRow> }) =>
      users.find(
        (u) =>
          (where.id !== undefined && u.id === where.id) ||
          (where.email !== undefined && u.email === where.email) ||
          (where.googleId !== undefined && u.googleId === where.googleId),
      ) ?? null,
    findFirst: async ({ where }: { where: any }) => {
      const conditions: any[] = where.OR ?? [where];
      return (
        users.find((u) =>
          conditions.some(
            (c) =>
              (c.email !== undefined && u.email === c.email) ||
              (c.username !== undefined &&
                u.username.toLowerCase() === c.username.equals.toLowerCase()),
          ),
        ) ?? null
      );
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<UserRow>;
    }) =>
      Object.assign(
        users.find((u) => u.id === where.id)!,
        data,
      ),
  };

  const refreshToken = {
    create: async ({ data }: { data: Omit<TokenRow, 'id' | 'revoked'> }) => {
      const row = { id: randomUUID(), revoked: false, ...data };
      tokens.push(row);
      return row;
    },
    findUnique: async ({ where }: { where: { tokenHash: string } }) => {
      const row = tokens.find((t) => t.tokenHash === where.tokenHash);
      if (!row) return null;
      return { ...row, user: users.find((u) => u.id === row.userId)! };
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: Partial<TokenRow>;
      data: Partial<TokenRow>;
    }) => {
      const matched = tokens.filter((t) =>
        Object.entries(where).every(
          ([key, value]) => t[key as keyof TokenRow] === value,
        ),
      );
      matched.forEach((t) => Object.assign(t, data));
      return { count: matched.length };
    },
  };

  const prisma = {
    user,
    refreshToken,
    $transaction: async (fn: (tx: unknown) => unknown) => fn({ user }),
  };
  return { prisma: prisma as unknown as PrismaService, users, tokens };
}

function createService() {
  const fake = createPrismaFake();
  const jwt = new JwtService({
    secret: 'test-secret-test-secret-test-secret-1234',
    signOptions: { expiresIn: '15m' },
  });
  const config = {
    get: (key: string) => (key === 'REFRESH_TOKEN_DAYS' ? 7 : undefined),
  } as unknown as ConfigService<any, true>;
  return { service: new AuthService(fake.prisma, jwt, config), jwt, ...fake };
}

const alice = {
  username: 'alice',
  email: 'Alice@Example.com',
  password: 'Password1',
};
const bob = {
  username: 'bob',
  email: 'bob@example.com',
  password: 'Password1',
};

describe('AuthService', () => {
  describe('register', () => {
    it('asigna superuser al primer usuario y user a los siguientes', async () => {
      const { service } = createService();

      const first = await service.register(alice);
      const second = await service.register(bob);

      expect(first.user.role).toBe('superuser');
      expect(second.user.role).toBe('user');
    });

    it('guarda la contraseña hasheada y el correo en minúsculas', async () => {
      const { service, users } = createService();

      const result = await service.register(alice);

      expect(result.user.email).toBe('alice@example.com');
      expect(users[0].passwordHash).not.toBe(alice.password);
      expect(users[0].passwordHash).toMatch(/^\$2[aby]\$/);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rechaza correo o username ya registrados', async () => {
      const { service } = createService();
      await service.register(alice);

      await expect(
        service.register({ ...bob, email: 'alice@example.com' }),
      ).rejects.toThrow('El correo ya está registrado');
      await expect(
        service.register({ ...bob, username: 'ALICE' }),
      ).rejects.toThrow('El nombre de usuario ya está en uso');
    });

    it('emite un access token con sub y role, y guarda solo el hash del refresh', async () => {
      const { service, jwt, tokens } = createService();

      const result = await service.register(alice);
      const payload = await jwt.verifyAsync(result.accessToken);

      expect(payload.sub).toBe(result.user.id);
      expect(payload.role).toBe('superuser');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].tokenHash).not.toBe(result.refreshToken);
    });
  });

  describe('login', () => {
    it('acepta credenciales correctas', async () => {
      const { service } = createService();
      await service.register(alice);

      const result = await service.login({
        email: 'ALICE@example.com',
        password: alice.password,
      });

      expect(result.user.username).toBe('alice');
    });

    it('rechaza contraseña incorrecta y correo inexistente con el mismo mensaje', async () => {
      const { service } = createService();
      await service.register(alice);

      await expect(
        service.login({ email: 'alice@example.com', password: 'Incorrecta1' }),
      ).rejects.toThrow('Credenciales inválidas');
      await expect(
        service.login({ email: 'nadie@example.com', password: 'Password1' }),
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('rechaza a un usuario desactivado', async () => {
      const { service, users } = createService();
      await service.register(alice);
      users[0].isActive = false;

      await expect(
        service.login({ email: 'alice@example.com', password: alice.password }),
      ).rejects.toThrow('Cuenta desactivada');
    });
  });

  describe('refresh', () => {
    it('rota el token: entrega uno nuevo y revoca el anterior', async () => {
      const { service, tokens } = createService();
      const session = await service.register(alice);

      const rotated = await service.refresh(session.refreshToken);

      expect(rotated.refreshToken).not.toBe(session.refreshToken);
      expect(tokens.map((t) => t.revoked)).toEqual([true, false]);
    });

    it('ante la reutilización de un token rotado revoca todas las sesiones', async () => {
      const { service, tokens } = createService();
      const session = await service.register(alice);
      const rotated = await service.refresh(session.refreshToken);

      await expect(service.refresh(session.refreshToken)).rejects.toThrow(
        'Refresh token inválido',
      );
      expect(tokens.every((t) => t.revoked)).toBe(true);
      await expect(service.refresh(rotated.refreshToken)).rejects.toThrow(
        'Refresh token inválido',
      );
    });

    it('rechaza tokens desconocidos, expirados o de usuarios desactivados', async () => {
      const { service, tokens, users } = createService();
      const session = await service.register(alice);

      await expect(service.refresh('no-existe')).rejects.toThrow(
        'Refresh token inválido',
      );

      tokens[0].expiresAt = new Date(Date.now() - 1000);
      await expect(service.refresh(session.refreshToken)).rejects.toThrow(
        'Refresh token expirado',
      );

      tokens[0].expiresAt = new Date(Date.now() + 60_000);
      users[0].isActive = false;
      await expect(service.refresh(session.refreshToken)).rejects.toThrow(
        'Cuenta desactivada',
      );
    });
  });

  describe('logout', () => {
    it('revoca el refresh token indicado y deja intactas las demás sesiones', async () => {
      const { service, tokens } = createService();
      const aliceSession = await service.register(alice);
      await service.register(bob);

      await service.logout('token-desconocido');
      expect(tokens.map((t) => t.revoked)).toEqual([false, false]);

      await service.logout(aliceSession.refreshToken);
      expect(tokens.map((t) => t.revoked)).toEqual([true, false]);
    });
  });

  describe('loginWithGoogle', () => {
    const profile = {
      googleId: 'g-123',
      email: 'Carol@gmail.com',
      emailVerified: true,
      displayName: 'Carol',
      avatarUrl: 'https://example.com/a.png',
    };

    it('crea una cuenta sin contraseña en el primer ingreso y la reutiliza después', async () => {
      const { service, users } = createService();

      const first = await service.loginWithGoogle(profile);
      const second = await service.loginWithGoogle(profile);

      expect(users).toHaveLength(1);
      expect(users[0].provider).toBe('google');
      expect(users[0].passwordHash).toBeNull();
      expect(first.user.username).toBe('carol');
      expect(second.user.id).toBe(first.user.id);
    });

    it('vincula Google a una cuenta local existente con el mismo correo', async () => {
      const { service, users } = createService();
      const local = await service.register(alice);

      const result = await service.loginWithGoogle({
        ...profile,
        email: 'alice@example.com',
      });

      expect(result.user.id).toBe(local.user.id);
      expect(users).toHaveLength(1);
      expect(users[0].googleId).toBe('g-123');
    });

    it('rechaza correos no verificados y cuentas desactivadas', async () => {
      const { service, users } = createService();

      await expect(
        service.loginWithGoogle({ ...profile, emailVerified: false }),
      ).rejects.toThrow('correo verificado');

      await service.loginWithGoogle(profile);
      users[0].isActive = false;
      await expect(service.loginWithGoogle(profile)).rejects.toThrow(
        'Cuenta desactivada',
      );
    });
  });
});
