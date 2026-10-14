import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import type { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

interface Requester {
  id: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ranking global por puntos (público). */
  async leaderboard(page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { isActive: true },
        orderBy: [{ totalPoints: 'desc' }, { createdAt: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          totalPoints: true,
        },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    return {
      page,
      limit: take,
      total,
      items: rows.map((r, i) => ({
        rank: skip + i + 1,
        id: r.id,
        username: r.username,
        avatar_url: r.avatarUrl,
        total_points: r.totalPoints,
      })),
    };
  }

  /** Perfil público de un usuario. */
  async publicProfile(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const solved = await this.prisma.userMachine.count({
      where: { userId: id, isComplete: true },
    });
    return {
      id: user.id,
      username: user.username,
      avatar_url: user.avatarUrl,
      role: user.role,
      total_points: user.totalPoints,
      machines_solved: solved,
      created_at: user.createdAt,
    };
  }

  /** Editar perfil: solo el propio (o un admin). */
  async updateProfile(id: string, dto: UpdateUserDto, requester: Requester) {
    this.assertSelfOrAdmin(id, requester);
    if (dto.username) {
      const taken = await this.prisma.user.findFirst({
        where: {
          username: { equals: dto.username, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (taken)
        throw new ConflictException('El nombre de usuario ya está en uso');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: { username: dto.username, avatarUrl: dto.avatar_url },
    });
    return this.publicProfile(user.id);
  }

  /** Progreso: máquinas y módulos del usuario. */
  async progress(id: string, requester: Requester) {
    this.assertSelfOrAdmin(id, requester);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const [machines, modules, machinesTotal, modulesTotal] = await Promise.all([
      this.prisma.userMachine.findMany({
        where: { userId: id },
        include: {
          machine: { select: { slug: true, name: true, points: true } },
        },
      }),
      this.prisma.userModuleProgress.findMany({
        where: { userId: id },
        include: { module: { select: { category: true, titleEs: true } } },
      }),
      // Totales del catálogo disponible (denominador de "X/Y").
      this.prisma.machine.count({ where: { isActive: true } }),
      this.prisma.learningModule.count({ where: { isActive: true } }),
    ]);
    return {
      total_points: user.totalPoints,
      machines_total: machinesTotal,
      modules_total: modulesTotal,
      machines: machines.map((m) => ({
        slug: m.machine.slug,
        name: m.machine.name,
        user_flag: m.userFlagObtained,
        root_flag: m.rootFlagObtained,
        is_complete: m.isComplete,
        completed_at: m.completedAt,
      })),
      modules: modules.map((p) => ({
        category: p.module.category,
        title: p.module.titleEs,
        is_complete: p.isComplete,
        score: p.score,
      })),
    };
  }

  /** Flags conseguidas por el usuario. */
  async flags(id: string, requester: Requester) {
    this.assertSelfOrAdmin(id, requester);
    const flags = await this.prisma.userFlag.findMany({
      where: { userId: id },
      orderBy: { achievedAt: 'desc' },
      include: { machine: { select: { slug: true, name: true } } },
    });
    return flags.map((f) => ({
      machine_slug: f.machine.slug,
      machine_name: f.machine.name,
      type: f.type,
      points_awarded: f.pointsAwarded,
      achieved_at: f.achievedAt,
    }));
  }

  // ---- Administración ----

  async listAll(page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.user.count(),
    ]);
    return {
      page,
      limit: take,
      total,
      items: rows.map((u) => this.toAdmin(u)),
    };
  }

  // Solo el superusuario delega roles (controller: @Roles('superuser')).
  // No se puede asignar 'superuser' (único, el primer registrado) ni tocar al superuser.
  async changeRole(id: string, role: Role, _requester: Requester) {
    if (role === 'superuser') {
      throw new BadRequestException('No se puede asignar el rol superusuario');
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.role === 'superuser') {
      throw new ForbiddenException(
        'No se puede cambiar el rol del superusuario',
      );
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return this.toAdmin(user);
  }

  /**
   * Activa o desactiva una cuenta. Al desactivar, revoca los refresh tokens
   * (cierra sus sesiones); el guard ya rechaza su JWT en el siguiente request.
   */
  async setActive(id: string, isActive: boolean, requester: Requester) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.role === 'superuser') {
      throw new ForbiddenException('No se puede desactivar al superusuario');
    }
    if (target.id === requester.id) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }
    // Un admin no puede desactivar a otro admin; solo el superusuario.
    if (target.role === 'admin' && requester.role !== 'superuser') {
      throw new ForbiddenException(
        'Solo el superusuario puede desactivar a un administrador',
      );
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
    if (!isActive) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      });
    }
    return this.toAdmin(user);
  }

  async remove(id: string, requester: Requester) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.role === 'superuser') {
      throw new ForbiddenException('No se puede eliminar al superusuario');
    }
    if (target.id === requester.id) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }
    await this.prisma.user.delete({ where: { id } });
  }

  private assertSelfOrAdmin(id: string, requester: Requester) {
    const isAdmin =
      requester.role === 'admin' || requester.role === 'superuser';
    if (requester.id !== id && !isAdmin) {
      throw new ForbiddenException('No tienes permiso sobre este usuario');
    }
  }

  private toAdmin(u: User) {
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      is_active: u.isActive,
      total_points: u.totalPoints,
      provider: u.provider,
      created_at: u.createdAt,
    };
  }
}
