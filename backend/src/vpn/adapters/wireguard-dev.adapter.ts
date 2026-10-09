import { Injectable, Logger } from '@nestjs/common';
import { generateWireguardKeypair } from '../wireguard-keys.js';
import { WireguardKeypair, WireguardPort } from '../wireguard.port.js';

/**
 * Adaptador de desarrollo: genera llaves reales y permite armar un .conf válido,
 * pero NO toca la interfaz wg0. Sirve para probar el flujo (descarga, frontend)
 * en local sin root ni túnel. En producción se usa WireguardCliAdapter.
 */
@Injectable()
export class WireguardDevAdapter extends WireguardPort {
  private readonly logger = new Logger(WireguardDevAdapter.name);

  generateKeypair(): Promise<WireguardKeypair> {
    return generateWireguardKeypair();
  }

  async setPeer(publicKey: string, assignedIp: string): Promise<void> {
    this.logger.debug(`[dev] setPeer ${assignedIp} (no se toca wg0)`);
    void publicKey;
    await Promise.resolve();
  }

  async removePeer(publicKey: string): Promise<void> {
    this.logger.debug('[dev] removePeer (no se toca wg0)');
    void publicKey;
    await Promise.resolve();
  }

  async latestHandshake(): Promise<number | null> {
    return Promise.resolve(null);
  }
}
