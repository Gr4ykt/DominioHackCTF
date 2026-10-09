import { execFile } from 'node:child_process';
import type { WireguardKeypair } from './wireguard.port.js';

/** Genera un par de llaves WireGuard con el binario `wg` (no requiere root). */
export function generateWireguardKeypair(): Promise<WireguardKeypair> {
  return new Promise((resolve, reject) => {
    execFile('wg', ['genkey'], (genErr, genOut) => {
      if (genErr) return reject(genErr);
      const privateKey = genOut.trim();
      const child = execFile('wg', ['pubkey'], (pubErr, pubOut) =>
        pubErr
          ? reject(pubErr)
          : resolve({ privateKey, publicKey: pubOut.trim() }),
      );
      child.stdin?.end(`${privateKey}\n`);
    });
  });
}
