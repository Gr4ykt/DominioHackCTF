import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventsService } from '../events/events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateFlagSalt, hashFlag, verifyFlag } from './flag-hash.js';
import type { FlagType } from '../generated/prisma/enums.js';

export interface FlagResult {
  correct: boolean;
  type?: 'user' | 'root';
  points_awarded?: number;
  already_owned?: boolean;
  machine_complete?: boolean;
}

@Injectable()
export class FlagsService {
  private readonly logger = new Logger(FlagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  /** Valida una flag contra la máquina del laboratorio activo del usuario. */
  async submit(
    userId: string,
    flagValue: string,
    ip?: string,
  ): Promise<FlagResult> {
    const session = await this.prisma.labSession.findFirst({
      where: { userId, status: { in: ['starting', 'active'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) {
      throw new BadRequestException(
        'Debes tener un laboratorio activo para enviar flags',
      );
    }

    const value = flagValue.trim();
    const flags = await this.prisma.flag.findMany({
      where: { machineId: session.machineId },
    });
    const matched = flags.find((f) => verifyFlag(value, f.salt, f.value));

    // Todo intento queda registrado (KPI flags correctas / total intentos).
    this.events.logLabEvent(session.id, 'FLAG_ATTEMPT', {
      user_id: userId,
      correct: !!matched,
      type: matched?.type ?? null,
    });

    if (!matched) {
      return { correct: false };
    }

    const already = await this.prisma.userFlag.findUnique({
      where: { userId_flagId: { userId, flagId: matched.id } },
    });
    if (already) {
      return { correct: true, type: matched.type, already_owned: true };
    }

    const complete = await this.award(userId, session.machineId, matched);

    this.events.logActivity(
      userId,
      'FLAG_SUBMITTED',
      {
        machine_id: session.machineId,
        type: matched.type,
        points: matched.points,
      },
      ip,
    );

    return {
      correct: true,
      type: matched.type,
      points_awarded: matched.points,
      machine_complete: complete,
    };
  }

  /** Admin: metadatos de las flags de una máquina (sin el valor en texto plano). */
  async listForMachine(machineId: string) {
    await this.assertMachine(machineId);
    const flags = await this.prisma.flag.findMany({ where: { machineId } });
    return flags.map((f) => ({
      type: f.type,
      points: f.points,
      updated_at: f.updatedAt,
    }));
  }

  /** Admin: fija/actualiza las flags de una máquina (hash + salt). */
  async setFlags(
    machineId: string,
    inputs: { type: FlagType; value: string; points: number }[],
  ) {
    await this.assertMachine(machineId);
    for (const f of inputs) {
      const salt = generateFlagSalt();
      const value = hashFlag(f.value, salt);
      await this.prisma.flag.upsert({
        where: { machineId_type: { machineId, type: f.type } },
        create: { machineId, type: f.type, salt, value, points: f.points },
        update: { salt, value, points: f.points },
      });
    }
    return this.listForMachine(machineId);
  }

  private async assertMachine(machineId: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });
    if (!machine) throw new NotFoundException('Máquina no encontrada');
  }

  /** Registra la flag, actualiza el progreso y suma puntos (atómico). */
  private award(
    userId: string,
    machineId: string,
    flag: { id: string; type: 'user' | 'root'; points: number },
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      await tx.userFlag.create({
        data: {
          userId,
          machineId,
          flagId: flag.id,
          type: flag.type,
          pointsAwarded: flag.points,
        },
      });

      const existing = await tx.userMachine.findUnique({
        where: { userId_machineId: { userId, machineId } },
      });
      const userFlag =
        flag.type === 'user' ? true : (existing?.userFlagObtained ?? false);
      const rootFlag =
        flag.type === 'root' ? true : (existing?.rootFlagObtained ?? false);
      const isComplete = userFlag && rootFlag;

      await tx.userMachine.upsert({
        where: { userId_machineId: { userId, machineId } },
        create: {
          userId,
          machineId,
          userFlagObtained: userFlag,
          rootFlagObtained: rootFlag,
          isComplete,
          writeupUnlocked: isComplete,
          completedAt: isComplete ? new Date() : null,
        },
        update: {
          userFlagObtained: userFlag,
          rootFlagObtained: rootFlag,
          isComplete,
          writeupUnlocked: isComplete,
          completedAt: isComplete ? new Date() : existing?.completedAt,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { totalPoints: { increment: flag.points } },
      });

      return isComplete;
    });
  }
}
