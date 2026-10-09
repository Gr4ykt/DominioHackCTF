/** Par de llaves WireGuard (base64). La privada solo se entrega en el .conf. */
export interface WireguardKeypair {
  privateKey: string;
  publicKey: string;
}

/**
 * Puerto de salida hacia WireGuard. El dominio depende de esta interfaz, no de
 * la CLI `wg` ni de la interfaz wg0 (adaptadores en ./adapters).
 */
export abstract class WireguardPort {
  /** Genera un par de llaves nuevo (no requiere root). */
  abstract generateKeypair(): Promise<WireguardKeypair>;

  /** Registra o actualiza el peer del usuario en la interfaz, con su IP fija. */
  abstract setPeer(publicKey: string, assignedIp: string): Promise<void>;

  /** Elimina el peer de la interfaz (al rotar llaves o borrar la config). */
  abstract removePeer(publicKey: string): Promise<void>;

  /** Época (segundos) del último handshake del peer, o null si nunca hubo. */
  abstract latestHandshake(publicKey: string): Promise<number | null>;
}
