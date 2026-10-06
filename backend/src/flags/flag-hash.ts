import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Las flags nunca se guardan en texto plano: SHA-256 de salt + valor. */
export function hashFlag(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value.trim()}`).digest('hex');
}

export function generateFlagSalt(): string {
  return randomBytes(16).toString('hex');
}

/** Comparación en tiempo constante contra el hash almacenado. */
export function verifyFlag(
  candidate: string,
  salt: string,
  storedHash: string,
): boolean {
  const candidateHash = Buffer.from(hashFlag(candidate, salt), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return (
    candidateHash.length === expected.length &&
    timingSafeEqual(candidateHash, expected)
  );
}
