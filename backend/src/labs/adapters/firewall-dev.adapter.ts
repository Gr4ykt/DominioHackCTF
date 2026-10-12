import { Injectable, Logger } from '@nestjs/common';
import { FirewallPort } from '../ports/firewall.port.js';

/** Modo dev: no toca iptables (pruebas locales sin root). */
@Injectable()
export class FirewallDevAdapter extends FirewallPort {
  private readonly logger = new Logger(FirewallDevAdapter.name);

  async ensureBaseChains() {
    this.logger.debug('[dev] cadenas base (no se tocan iptables)');
    await Promise.resolve();
  }
  async allowUserToLab(userIp: string, labSubnet: string) {
    this.logger.debug(`[dev] allow ${userIp} <-> ${labSubnet}`);
    await Promise.resolve();
  }
  async denyUserToLab(userIp: string, labSubnet: string) {
    this.logger.debug(`[dev] deny ${userIp} <-> ${labSubnet}`);
    await Promise.resolve();
  }
}
