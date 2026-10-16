import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import { FirewallPort } from '../ports/firewall.port.js';

const run = promisify(execFile);
const FWD = 'DHCTF-FWD';
const IN = 'DHCTF-IN';

/**
 * Modo producción: aplica las reglas con iptables (execFile, args fijos).
 * Requiere root (sudoers acotado o CAP_NET_ADMIN). Reglas de POC_RED (H-11).
 */
@Injectable()
export class FirewallCliAdapter extends FirewallPort {
  private readonly logger = new Logger(FirewallCliAdapter.name);
  private readonly iface: string;
  private readonly labsCidr: string;
  private readonly useSudo: boolean;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.iface = config.get('WG_INTERFACE', { infer: true });
    this.labsCidr = `${config.get('LAB_SUBNET_PREFIX', { infer: true })}.0.0/16`;
    this.useSudo = config.get('WG_USE_SUDO', { infer: true });
  }

  private ipt(args: string[]) {
    return this.useSudo
      ? run('sudo', ['iptables', ...args])
      : run('iptables', args);
  }

  private async chainExists(chain: string): Promise<boolean> {
    try {
      await this.ipt(['-nL', chain]);
      return true;
    } catch {
      return false;
    }
  }

  async ensureBaseChains() {
    if (!(await this.chainExists(FWD))) {
      await this.ipt(['-N', FWD]);
      await this.ipt(['-I', 'DOCKER-USER', '1', '-j', FWD]);
      // Los DROP base; las reglas ACCEPT por lab se INSERTAN encima.
      await this.ipt(['-A', FWD, '-i', this.iface, '-j', 'DROP']);
      await this.ipt(['-A', FWD, '-o', this.iface, '-j', 'DROP']);
      await this.ipt(['-A', FWD, '-s', this.labsCidr, '-j', 'DROP']);
    }
    if (!(await this.chainExists(IN))) {
      await this.ipt(['-N', IN]);
      await this.ipt(['-I', 'INPUT', '1', '-j', IN]);
      await this.ipt([
        '-A',
        IN,
        '-s',
        this.labsCidr,
        '-m',
        'conntrack',
        '--ctstate',
        'ESTABLISHED,RELATED',
        '-j',
        'ACCEPT',
      ]);
      await this.ipt(['-A', IN, '-s', this.labsCidr, '-j', 'DROP']);
      await this.ipt(['-A', IN, '-i', this.iface, '-j', 'DROP']);
    }
    await this.allowVpnInRawTable();
    this.logger.log('Cadenas base de iptables listas');
  }

  /**
   * Docker 28 agrega en la tabla `raw` (hook prerouting) un DROP anti-spoofing
   * por contenedor: descarta todo lo que va a la IP del lab y NO entra por su
   * bridge. El tráfico de la VPN entra por `wg0`, así que caería ahí antes de
   * llegar a DHCTF-FWD. Insertamos una excepción al tope de raw/PREROUTING para
   * wg0 -> subred de labs. Idempotente (borra la previa y la reinserta en 1),
   * de modo que quede por encima del DROP que Docker añade al crear cada red.
   * El aislamiento por usuario lo sigue garantizando DHCTF-FWD.
   */
  private async allowVpnInRawTable() {
    const rule = [
      'PREROUTING',
      '-i',
      this.iface,
      '-d',
      this.labsCidr,
      '-j',
      'ACCEPT',
    ];
    await this.ipt(['-t', 'raw', '-D', ...rule]).catch(() => undefined);
    await this.ipt(['-t', 'raw', '-I', 'PREROUTING', '1', ...rule.slice(1)]);
  }

  async allowUserToLab(userIp: string, labSubnet: string) {
    // Docker (re)crea su DROP anti-spoofing al levantar la red del lab; nos
    // aseguramos de que nuestra excepción de raw quede por encima en cada inicio.
    await this.allowVpnInRawTable();
    // Se insertan al tope (antes de los DROP base).
    await this.ipt([
      '-I',
      FWD,
      '1',
      '-i',
      this.iface,
      '-s',
      `${userIp}/32`,
      '-d',
      labSubnet,
      '-j',
      'ACCEPT',
    ]);
    await this.ipt([
      '-I',
      FWD,
      '1',
      '-o',
      this.iface,
      '-s',
      labSubnet,
      '-d',
      `${userIp}/32`,
      '-j',
      'ACCEPT',
    ]);
  }

  async denyUserToLab(userIp: string, labSubnet: string) {
    await this.ipt([
      '-D',
      FWD,
      '-i',
      this.iface,
      '-s',
      `${userIp}/32`,
      '-d',
      labSubnet,
      '-j',
      'ACCEPT',
    ]).catch(() => undefined);
    await this.ipt([
      '-D',
      FWD,
      '-o',
      this.iface,
      '-s',
      labSubnet,
      '-d',
      `${userIp}/32`,
      '-j',
      'ACCEPT',
    ]).catch(() => undefined);
  }
}
