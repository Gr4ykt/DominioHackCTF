import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import { generateWireguardKeypair } from '../wireguard-keys.js';
import { WireguardKeypair, WireguardPort } from '../wireguard.port.js';

const run = promisify(execFile);

/**
 * Adaptador de producción: ejecuta `wg` sobre la interfaz real (wg0).
 * Usa execFile con argumentos fijos (sin shell) para evitar inyección.
 * Requiere la interfaz levantada y permisos (sudoers acotado o CAP_NET_ADMIN).
 */
@Injectable()
export class WireguardCliAdapter extends WireguardPort {
  private readonly logger = new Logger(WireguardCliAdapter.name);
  private readonly iface: string;
  private readonly useSudo: boolean;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.iface = config.get('WG_INTERFACE', { infer: true });
    this.useSudo = config.get('WG_USE_SUDO', { infer: true });
  }

  /** Prefija con sudo si NestJS no corre como root. */
  private wg(args: string[]) {
    return this.useSudo ? run('sudo', ['wg', ...args]) : run('wg', args);
  }

  generateKeypair(): Promise<WireguardKeypair> {
    return generateWireguardKeypair();
  }

  async setPeer(publicKey: string, assignedIp: string): Promise<void> {
    await this.wg([
      'set',
      this.iface,
      'peer',
      publicKey,
      'allowed-ips',
      `${assignedIp}/32`,
    ]);
  }

  async removePeer(publicKey: string): Promise<void> {
    await this.wg(['set', this.iface, 'peer', publicKey, 'remove']);
  }

  async latestHandshake(publicKey: string): Promise<number | null> {
    const { stdout } = await this.wg(['show', this.iface, 'dump']);
    const line = stdout.split('\n').find((l) => l.startsWith(publicKey));
    if (!line) return null;
    // dump: pubkey preshared endpoint allowed-ips latest-handshake rx tx keepalive
    const epoch = Number(line.split('\t')[4]);
    return epoch > 0 ? epoch : null;
  }
}
