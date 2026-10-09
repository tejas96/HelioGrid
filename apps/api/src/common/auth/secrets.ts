import { createHash, createHmac, randomBytes } from 'node:crypto';

const SECRET_BYTES = 32;

/**
 * A credential a client holds and the store never sees in clear: the session cookie, the
 * invite link. 32 random bytes, base64url, so it travels in a cookie and a URL unchanged.
 */
export function randomSecret(): string {
  return randomBytes(SECRET_BYTES).toString('base64url');
}

/** What the store holds for a secret; a leaked table names nothing a client can present. */
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/**
 * A secret made again from what it names: one key and one subject always give the same value, the
 * same length and alphabet as `randomSecret`, and nobody without the key can make it. For a
 * secret a later step must send but the store must never hold — the invite link.
 */
export function keyedSecret(key: string, subject: string): string {
  return createHmac('sha256', key).update(subject).digest('base64url');
}
