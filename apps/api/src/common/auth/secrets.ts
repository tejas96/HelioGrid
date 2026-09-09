import { createHash, randomBytes } from 'node:crypto';

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
