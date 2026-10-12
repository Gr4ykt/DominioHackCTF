/**
 * Puerto hacia el firewall (iptables). Reglas validadas en POC_RED (H-11):
 * usuario <-> su subred de lab permitido en ambos sentidos; todo lo demás
 * desde/hacia wg0 y desde las subredes de labs, bloqueado.
 */
export abstract class FirewallPort {
  /** Crea las cadenas base (una vez, al arrancar). Idempotente. */
  abstract ensureBaseChains(): Promise<void>;
  /** Permite el tráfico usuario <-> subred de su lab (al iniciar el lab). */
  abstract allowUserToLab(userIp: string, labSubnet: string): Promise<void>;
  /** Quita ese permiso (al detener/expirar el lab). */
  abstract denyUserToLab(userIp: string, labSubnet: string): Promise<void>;
}
