import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation.js';
import type { LabSession } from '../generated/prisma/client.js';
import { EventsService } from '../events/events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { VpnService } from '../vpn/vpn.service.js';
import { DockerPort } from './ports/docker.port.js';
import { FirewallPort } from './ports/firewall.port.js';

// Caps mínimas para una máquina web Debian (Apache :80 + MariaDB), sobre un
// cap-drop ALL. Validado con VulneraWeb bajo runsc.
const WEB_CAP_PROFILE = [
  'CHOWN',
  'DAC_OVERRIDE',
  'SETGID',
  'SETUID',
  'NET_BIND_SERVICE',
  'FOWNER',
  'SETFCAP',
];

// Estados activos de una sesión (ocupan subred y cupo).
const LIVE = ['starting', 'active'] as const;
const EXPIRING_WINDOW_MS = 10 * 60 * 1000;

export interface LabStatusResponse {
  status: string; // starting | active | expiring | none
  machine_slug: string | null;
  lab_ip: string | null;
  internal_port: number | null;
  expires_at: string | null;
  seconds_left: number | null;
  extensions_used: number;
}

@Injectable()
export class LabsService implements OnModuleInit {
  private readonly logger = new Logger(LabsService.name);
  private readonly prefix: string;
  private readonly durationMin: number;
  private readonly extensionMin: number;
  private readonly maxDurationMin: number;
  private readonly maxConcurrent: number;
  private readonly memoryMb: number;
  private readonly nanoCpus: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly docker: DockerPort,
    private readonly firewall: FirewallPort,
    private readonly vpn: VpnService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.prefix = config.get('LAB_SUBNET_PREFIX', { infer: true });
    this.durationMin = config.get('LAB_DURATION_MIN', { infer: true });
    this.extensionMin = config.get('LAB_EXTENSION_MIN', { infer: true });
    this.maxDurationMin = config.get('LAB_MAX_DURATION_MIN', { infer: true });
    this.maxConcurrent = config.get('LAB_MAX_CONCURRENT', { infer: true });
    this.memoryMb = config.get('LAB_MEMORY_MB', { infer: true });
    this.nanoCpus = Math.round(config.get('LAB_CPUS', { infer: true }) * 1e9);
  }

  async onModuleInit() {
    try {
      await this.firewall.ensureBaseChains();
      await this.cleanupOrphans();
    } catch (error) {
      this.logger.error(
        `Inicialización del motor de labs: ${(error as Error).message}`,
      );
    }
  }

  /** Inicia un laboratorio para el usuario (uno activo por usuario). */
  async start(userId: string, machineId: string): Promise<LabStatusResponse> {
    const existing = await this.prisma.labSession.findFirst({
      where: { userId, status: { in: [...LIVE] } },
    });
    if (existing) {
      throw new ConflictException('Ya tienes un laboratorio activo');
    }

    const machine = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });
    if (!machine || !machine.isActive) {
      throw new NotFoundException('Máquina no disponible');
    }

    const live = await this.prisma.labSession.count({
      where: { status: { in: [...LIVE] } },
    });
    if (live >= this.maxConcurrent) {
      throw new ServiceUnavailableException(
        'No hay cupos disponibles en este momento. Intenta más tarde.',
      );
    }

    const userIp = await this.vpn.ensureAssignment(userId);
    const subnetIndex = await this.allocateSubnetIndex();
    const subnet = `${this.prefix}.${subnetIndex}.0/24`;
    const gateway = `${this.prefix}.${subnetIndex}.1`;
    const labIp = `${this.prefix}.${subnetIndex}.2`;

    const session = await this.prisma.labSession.create({
      data: {
        userId,
        machineId,
        status: 'starting',
        subnetIndex,
        assignedIp: labIp,
        wireguardIp: userIp,
      },
    });

    const short = session.id.slice(0, 8);
    const networkName = `dhctf-net-${short}`;
    const containerName = `dhctf-lab-${short}`;

    let containerId: string | undefined;
    try {
      await this.docker.createNetwork({ name: networkName, subnet, gateway });
      containerId = await this.docker.runContainer({
        image: machine.dockerImage,
        name: containerName,
        sessionId: session.id,
        networkName,
        ip: labIp,
        capAdd: WEB_CAP_PROFILE,
        memoryMb: this.memoryMb,
        nanoCpus: this.nanoCpus,
      });

      await this.firewall.allowUserToLab(userIp, subnet);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.durationMin * 60000);
      const updated = await this.prisma.labSession.update({
        where: { id: session.id },
        data: {
          status: 'active',
          containerId,
          containerName,
          networkName,
          startedAt: now,
          expiresAt,
        },
      });
      this.events.logActivity(userId, 'LAB_STARTED', {
        machine_id: machine.id,
        session_id: session.id,
      });
      this.events.logLabEvent(session.id, 'CONTAINER_STARTED', {
        machine: machine.slug,
        ip: labIp,
      });
      this.logger.log(`Lab iniciado: ${containerName} (${machine.slug})`);
      return this.toStatus(updated, machine.slug, machine.dockerInternalPort);
    } catch (error) {
      this.logger.error(`Fallo al iniciar lab: ${(error as Error).message}`);
      await this.teardown({ ...session, networkName, containerId });
      await this.prisma.labSession.update({
        where: { id: session.id },
        data: { status: 'error', networkName, containerName },
      });
      throw new InternalServerErrorException(
        'No se pudo iniciar el laboratorio. Inténtalo de nuevo.',
      );
    }
  }

  /** Detiene el laboratorio activo del usuario. */
  async stop(userId: string): Promise<{ stopped: boolean }> {
    const session = await this.prisma.labSession.findFirst({
      where: { userId, status: { in: [...LIVE] } },
    });
    if (!session) return { stopped: false };

    await this.teardown(session);
    await this.prisma.labSession.update({
      where: { id: session.id },
      data: { status: 'stopped', stoppedAt: new Date() },
    });
    this.events.logActivity(session.userId, 'LAB_STOPPED', {
      session_id: session.id,
    });
    this.events.logLabEvent(session.id, 'CONTAINER_DESTROYED', {
      reason: 'stopped',
    });
    this.logger.log(`Lab detenido por el usuario: ${session.containerName}`);
    return { stopped: true };
  }

  /** Estado del lab del usuario (expiring se calcula, no se guarda). */
  async status(userId: string): Promise<LabStatusResponse> {
    const session = await this.prisma.labSession.findFirst({
      where: { userId, status: { in: [...LIVE] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) {
      return {
        status: 'none',
        machine_slug: null,
        lab_ip: null,
        internal_port: null,
        expires_at: null,
        seconds_left: null,
        extensions_used: 0,
      };
    }
    const machine = await this.prisma.machine.findUnique({
      where: { id: session.machineId },
    });
    return this.toStatus(
      session,
      machine?.slug ?? null,
      machine?.dockerInternalPort ?? null,
    );
  }

  /** Extiende el lab +N min (solo en ventana de expiración, hasta el tope). */
  async extend(userId: string): Promise<LabStatusResponse> {
    const session = await this.prisma.labSession.findFirst({
      where: { userId, status: { in: [...LIVE] } },
    });
    if (!session || !session.startedAt || !session.expiresAt) {
      throw new NotFoundException('No tienes un laboratorio activo');
    }
    const maxEnd = session.startedAt.getTime() + this.maxDurationMin * 60000;
    const newEnd = Math.min(
      session.expiresAt.getTime() + this.extensionMin * 60000,
      maxEnd,
    );
    if (newEnd <= session.expiresAt.getTime()) {
      throw new ConflictException(
        'El laboratorio ya alcanzó su duración máxima',
      );
    }
    const updated = await this.prisma.labSession.update({
      where: { id: session.id },
      data: { expiresAt: new Date(newEnd), extensions: { increment: 1 } },
    });
    const machine = await this.prisma.machine.findUnique({
      where: { id: session.machineId },
    });
    return this.toStatus(
      updated,
      machine?.slug ?? null,
      machine?.dockerInternalPort ?? null,
    );
  }

  /** Expira las sesiones cuyo tiempo venció (lo invoca el job programado). */
  async expireDueSessions(): Promise<number> {
    const due = await this.prisma.labSession.findMany({
      where: { status: { in: [...LIVE] }, expiresAt: { lte: new Date() } },
    });
    for (const session of due) {
      await this.teardown(session);
      await this.prisma.labSession.update({
        where: { id: session.id },
        data: { status: 'expired', stoppedAt: new Date() },
      });
      this.events.logActivity(session.userId, 'LAB_EXPIRED', {
        session_id: session.id,
      });
      this.events.logLabEvent(session.id, 'CONTAINER_DESTROYED', {
        reason: 'expired',
      });
      this.logger.log(`Lab expirado: ${session.containerName}`);
    }
    return due.length;
  }

  // ---- internos ----

  private async allocateSubnetIndex(): Promise<number> {
    const live = await this.prisma.labSession.findMany({
      where: { status: { in: [...LIVE] } },
      select: { subnetIndex: true },
    });
    const used = new Set(live.map((s) => s.subnetIndex));
    for (let i = 1; i <= 254; i++) {
      if (!used.has(i)) return i;
    }
    throw new ServiceUnavailableException('No hay subredes disponibles.');
  }

  private async teardown(session: {
    networkName: string | null;
    containerId?: string | null;
    wireguardIp?: string | null;
    subnetIndex?: number | null;
  }) {
    try {
      if (session.containerId) await this.docker.destroy(session.containerId);
    } catch (error) {
      this.logger.warn(`destroy contenedor: ${(error as Error).message}`);
    }
    try {
      if (session.wireguardIp && session.subnetIndex != null) {
        const subnet = `${this.prefix}.${session.subnetIndex}.0/24`;
        await this.firewall.denyUserToLab(session.wireguardIp, subnet);
      }
    } catch (error) {
      this.logger.warn(`deny firewall: ${(error as Error).message}`);
    }
    try {
      if (session.networkName)
        await this.docker.removeNetwork(session.networkName);
    } catch (error) {
      this.logger.warn(`remove red: ${(error as Error).message}`);
    }
  }

  /** Al arrancar: sesiones vivas cuyo contenedor ya no existe → expired. */
  private async cleanupOrphans() {
    const live = await this.prisma.labSession.findMany({
      where: { status: { in: [...LIVE] } },
    });
    for (const session of live) {
      const state = session.containerId
        ? await this.docker.inspect(session.containerId)
        : { exists: false, running: false, status: 'not-found' };
      if (!state.running) {
        await this.teardown(session);
        await this.prisma.labSession.update({
          where: { id: session.id },
          data: { status: 'expired', stoppedAt: new Date() },
        });
        this.logger.warn(`Sesión huérfana marcada expirada: ${session.id}`);
      }
    }
  }

  private toStatus(
    session: LabSession,
    machineSlug: string | null,
    internalPort: number | null,
  ): LabStatusResponse {
    const now = Date.now();
    const expiresMs = session.expiresAt?.getTime() ?? null;
    const secondsLeft =
      expiresMs != null
        ? Math.max(0, Math.floor((expiresMs - now) / 1000))
        : null;
    let status: string = session.status;
    if (
      session.status === 'active' &&
      expiresMs != null &&
      expiresMs - now <= EXPIRING_WINDOW_MS
    ) {
      status = 'expiring';
    }
    return {
      status,
      machine_slug: machineSlug,
      lab_ip: session.assignedIp,
      internal_port: internalPort,
      expires_at: session.expiresAt?.toISOString() ?? null,
      seconds_left: secondsLeft,
      extensions_used: session.extensions,
    };
  }
}
