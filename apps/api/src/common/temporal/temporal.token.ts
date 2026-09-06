import { readFileSync, statSync } from 'node:fs';

/**
 * Reads the identity token from its file, re-reading only when the file CHANGES.
 *
 * Reading once at boot is the bug this exists to prevent: an identity token has an expiry, a
 * worker or API process runs for weeks, and the moment the token lapses every call fails with
 * *"Request unauthorized."* — which reads as a permissions problem, not an expired credential.
 * It shows after the local stack has run for a few hours.
 *
 * Keyed on mtime+size rather than a TTL: the file changes exactly when the credential is
 * rotated, so this re-reads then and not on a timer nobody tuned. A rotated secret is picked
 * up without a restart, which is what makes rotation a routine operation rather than a deploy.
 */
export function createTokenReader(path: string): () => string {
  let cached: { key: string; token: string } | undefined;

  return () => {
    const stat = statSync(path);
    const key = `${stat.mtimeMs}:${stat.size}`;
    if (cached?.key === key) return cached.token;
    const token = readFileSync(path, 'utf8')
      .replace(/^Bearer\s+/, '')
      .trim();
    cached = { key, token };
    return token;
  };
}
