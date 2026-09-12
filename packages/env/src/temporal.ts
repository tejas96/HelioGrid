import { readFileSync, statSync } from 'node:fs';
import type { ApiEnv } from './schema/api';

/**
 * How a process presents itself to Temporal (ADR-0025), read in ONE place because both halves
 * are credentials and both processes must present them the same way:
 *  - mutual TLS says WHO is calling — this process's own certificate, not the other's;
 *  - a signed token says WHAT IT MAY DO, read from a FILE because a private credential in an
 *    environment variable is readable by every child process and lands in crash dumps.
 *
 * Node-only, so it is reached through this package's server entry and never from a browser or
 * a phone bundle (Law 10).
 */

/**
 * How soon a rotated token is noticed by a connection that cannot ask for one per request.
 * The client SDK takes a FUNCTION and calls it per request; the worker's native connection takes
 * a STRING and must be told, so it asks this often — the one cadence, not one per process.
 */
export const IDENTITY_TOKEN_REFRESH_MS = 60_000;

/**
 * The four values a process needs to prove who it is, TAKEN from the schema that declares them
 * rather than described again here — each service names the variables it reads, and
 * `fragments.ts` states why that stays per service. Renaming one of these keys cannot pass
 * quietly: in `schema/api.ts` it stops this file compiling, and in `schema/worker.ts` it stops
 * the worker's own call site, because its environment no longer satisfies what the reader takes.
 */
export type TemporalIdentityEnv = Pick<
  ApiEnv,
  | 'TEMPORAL_TLS_SERVER_NAME'
  | 'TEMPORAL_TLS_CA_FILE'
  | 'TEMPORAL_TLS_CERT_FILE'
  | 'TEMPORAL_TLS_KEY_FILE'
>;

/** The shape both SDKs take; assembled here so neither service spells it out. */
export interface TemporalTlsOptions {
  readonly serverNameOverride: string;
  readonly serverRootCACertificate: Buffer;
  readonly clientCertPair: { readonly crt: Buffer; readonly key: Buffer };
}

/**
 * The mutual-TLS half. `serverNameOverride` is verified against the server certificate's SANs:
 * dropping it does not fail loudly — it makes the client accept a certificate for a different
 * host, which is the whole attack mTLS exists to stop.
 */
export function temporalTlsFrom(env: TemporalIdentityEnv): TemporalTlsOptions {
  return {
    serverNameOverride: env.TEMPORAL_TLS_SERVER_NAME,
    serverRootCACertificate: readFileSync(env.TEMPORAL_TLS_CA_FILE),
    clientCertPair: {
      crt: readFileSync(env.TEMPORAL_TLS_CERT_FILE),
      key: readFileSync(env.TEMPORAL_TLS_KEY_FILE),
    },
  };
}

/**
 * Reads the identity token from its file, re-reading only when the file CHANGES.
 *
 * Reading once at boot is the bug this exists to prevent: an identity token has an expiry, a
 * worker or API process runs for weeks, and the moment the token lapses every call fails with
 * *"Request unauthorized."* — which reads as a permissions problem, not an expired credential.
 *
 * Keyed on mtime+size rather than a TTL: the file changes exactly when the credential is
 * rotated, so this re-reads then and not on a timer nobody tuned. A rotated secret is picked
 * up without a restart, which is what makes rotation a routine operation rather than a deploy.
 *
 * The `Bearer ` prefix is stripped here: the issuer may write it, and both SDKs add their own.
 */
export function createIdentityTokenReader(path: string): () => string {
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
