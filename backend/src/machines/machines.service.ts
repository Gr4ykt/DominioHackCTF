import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Machine, UserMachine } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMachineDto } from './dto/create-machine.dto.js';
import type { UpdateMachineDto } from './dto/update-machine.dto.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface MachineProgress {
  user_flag_obtained: boolean;
  root_flag_obtained: boolean;
  is_complete: boolean;
  writeup_unlocked: boolean;
}

@Injectable()
export class MachinesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listado de máquinas activas con el progreso del usuario. */
  async listForUser(userId: string) {
    const [machines, progress] = await Promise.all([
      this.prisma.machine.findMany({
        where: { isActive: true },
        orderBy: [{ difficulty: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.userMachine.findMany({ where: { userId } }),
    ]);
    const byMachine = new Map(progress.map((p) => [p.machineId, p]));
    return machines.map((m) => this.toPublic(m, byMachine.get(m.id) ?? null));
  }

  /** Detalle de una máquina (por id o slug) con el progreso del usuario. */
  async findOneForUser(idOrSlug: string, userId: string) {
    const machine = await this.resolve(idOrSlug);
    if (!machine.isActive) {
      throw new NotFoundException('Máquina no disponible');
    }
    const progress = await this.prisma.userMachine.findUnique({
      where: { userId_machineId: { userId, machineId: machine.id } },
    });
    return this.toPublic(machine, progress, true);
  }

  /** Writeup en el idioma pedido, solo si el usuario completó la máquina. */
  async getWriteup(idOrSlug: string, userId: string, lang: 'es' | 'en') {
    const machine = await this.resolve(idOrSlug);
    const progress = await this.prisma.userMachine.findUnique({
      where: { userId_machineId: { userId, machineId: machine.id } },
    });
    if (!progress?.isComplete || !progress.writeupUnlocked) {
      throw new ForbiddenException(
        'Debes completar la máquina para ver el writeup',
      );
    }
    const content = lang === 'en' ? machine.writeupEn : machine.writeupEs;
    return { slug: machine.slug, lang, content: content ?? '' };
  }

  // ---- Administración ----

  create(dto: CreateMachineDto) {
    return this.prisma.machine.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        difficulty: dto.difficulty,
        os: dto.os,
        points: dto.points,
        dockerImage: dto.docker_image,
        dockerInternalPort: dto.docker_internal_port,
        category: dto.category,
        writeupEs: dto.writeup_es,
        writeupEn: dto.writeup_en,
      },
    });
  }

  async update(idOrSlug: string, dto: UpdateMachineDto) {
    const machine = await this.resolve(idOrSlug);
    return this.prisma.machine.update({
      where: { id: machine.id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        difficulty: dto.difficulty,
        os: dto.os,
        points: dto.points,
        dockerImage: dto.docker_image,
        dockerInternalPort: dto.docker_internal_port,
        category: dto.category,
        writeupEs: dto.writeup_es,
        writeupEn: dto.writeup_en,
      },
    });
  }

  async remove(idOrSlug: string) {
    const machine = await this.resolve(idOrSlug);
    await this.prisma.machine.delete({ where: { id: machine.id } });
  }

  async toggle(idOrSlug: string) {
    const machine = await this.resolve(idOrSlug);
    return this.prisma.machine.update({
      where: { id: machine.id },
      data: { isActive: !machine.isActive },
    });
  }

  /** Usado por el motor de labs: datos de ejecución de la máquina. */
  async getRuntimeInfo(machineId: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });
    if (!machine) throw new NotFoundException('Máquina no encontrada');
    return machine;
  }

  private async resolve(idOrSlug: string): Promise<Machine> {
    const where = UUID_RE.test(idOrSlug)
      ? { id: idOrSlug }
      : { slug: idOrSlug };
    const machine = await this.prisma.machine.findUnique({ where });
    if (!machine) throw new NotFoundException('Máquina no encontrada');
    return machine;
  }

  private toPublic(m: Machine, progress: UserMachine | null, detail = false) {
    return {
      id: m.id,
      slug: m.slug,
      name: m.name,
      description: m.description,
      difficulty: m.difficulty,
      os: m.os,
      points: m.points,
      category: m.category,
      docker_internal_port: m.dockerInternalPort,
      ...(detail ? { is_active: m.isActive } : {}),
      progress: this.toProgress(progress),
    };
  }

  private toProgress(p: UserMachine | null): MachineProgress {
    return {
      user_flag_obtained: p?.userFlagObtained ?? false,
      root_flag_obtained: p?.rootFlagObtained ?? false,
      is_complete: p?.isComplete ?? false,
      writeup_unlocked: p?.writeupUnlocked ?? false,
    };
  }
}
