import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WireguardPort } from './wireguard.port.js';

// Un handshake más reciente que esto se considera "conectado".
const HANDSHAKE_FRESH_SECONDS = 180;

export interface VpnStatus {
  has_config: boolean;
  assigned_ip: string | null;
  connected: boolean;
  last_handshake: string | null;
}

@Injectable()
export class VpnService {
  private readonly logger = new Logger(VpnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wg: WireguardPort,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Entrega un .conf nuevo para el usuario: genera un par de llaves fresco,
   * reemplaza su peer en la interfaz y devuelve la config con la clave privada.
   * La IP del usuario es fija; solo rota el par de llaves. La privada NO se guarda.
   */
  async issueConfig(userId: string): Promise<string> {
    const keypair = await this.wg.generateKeypair();

    // Asigna IP (si es la primera vez) y rota la clave pública almacenada,
    // devolviendo la clave anterior para retirar ese peer de la interfaz.
    const { assignedIp, previousPublicKey } = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.wireguardConfig.findUnique({
          where: { userId },
        });

        if (!existing) {
          const ip = await this.allocateIp(tx);
          await tx.wireguardConfig.create({
            data: { userId, publicKey: keypair.publicKey, assignedIp: ip },
          });
          return { assignedIp: ip, previousPublicKey: null as string | null };
        }

        await tx.wireguardConfig.update({
          where: { userId },
          data: { publicKey: keypair.publicKey, lastUsedAt: new Date() },
        });
        return {
          assignedIp: existing.assignedIp,
          previousPublicKey: existing.publicKey,
        };
      },
    );

    try {
      if (previousPublicKey && previousPublicKey !== keypair.publicKey) {
        await this.wg.removePeer(previousPublicKey);
      }
      await this.wg.setPeer(keypair.publicKey, assignedIp);
    } catch (error) {
      this.logger.error(
        `No se pudo registrar el peer WireGuard: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo configurar la VPN. Inténtalo de nuevo.',
      );
    }

    return this.buildClientConfig(keypair.privateKey, assignedIp);
  }

  async getStatus(userId: string): Promise<VpnStatus> {
    const config = await this.prisma.wireguardConfig.findUnique({
      where: { userId },
    });
    if (!config) {
      return {
        has_config: false,
        assigned_ip: null,
        connected: false,
        last_handshake: null,
      };
    }

    let epoch: number | null = null;
    try {
      epoch = await this.wg.latestHandshake(config.publicKey);
    } catch (error) {
      this.logger.warn(
        `No se pudo consultar el handshake: ${(error as Error).message}`,
      );
    }

    const connected =
      epoch !== null && Date.now() / 1000 - epoch < HANDSHAKE_FRESH_SECONDS;
    return {
      has_config: true,
      assigned_ip: config.assignedIp,
      connected,
      last_handshake: epoch ? new Date(epoch * 1000).toISOString() : null,
    };
  }

  /** Toma la primera IP libre del pool 10.10.0.0/24 (.1 es el servidor). */
  private async allocateIp(tx: Prisma.TransactionClient): Promise<string> {
    const base = this.config.get('WG_PEER_SUBNET_BASE', { infer: true });
    const start = this.config.get('WG_PEER_IP_START', { infer: true });

    const taken = new Set(
      (await tx.wireguardConfig.findMany({ select: { assignedIp: true } })).map(
        (c) => c.assignedIp,
      ),
    );
    for (let host = start; host <= 254; host++) {
      const ip = `${base}.${host}`;
      if (!taken.has(ip)) return ip;
    }
    throw new InternalServerErrorException(
      'No hay IPs disponibles en el pool de la VPN.',
    );
  }

  private buildClientConfig(privateKey: string, ip: string): string {
    const serverKey =
      this.config.get('WG_SERVER_PUBLIC_KEY', { infer: true }) ??
      'SERVER_PUBLIC_KEY_NO_CONFIGURADA';
    const endpoint = this.config.get('WG_SERVER_ENDPOINT', { infer: true });
    const allowedIps = this.config.get('WG_CLIENT_ALLOWED_IPS', {
      infer: true,
    });
    const dns = this.config.get('WG_CLIENT_DNS', { infer: true });

    const lines = [
      '[Interface]',
      `PrivateKey = ${privateKey}`,
      `Address = ${ip}/32`,
    ];
    if (dns) lines.push(`DNS = ${dns}`);
    lines.push(
      '',
      '[Peer]',
      `PublicKey = ${serverKey}`,
      `Endpoint = ${endpoint}`,
      `AllowedIPs = ${allowedIps}`,
      'PersistentKeepalive = 25',
      '',
    );
    return lines.join('\n');
  }
}
