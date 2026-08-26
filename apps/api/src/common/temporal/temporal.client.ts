import { readFileSync } from 'node:fs';
import { Client, Connection } from '@temporalio/client';
import { ENV } from '../../config/env';
import { createTokenReader } from './temporal.token';

/**
 * The ONE place this app connects to Temporal. Everything else takes the gateway by DI.
 *
 * Two halves of identity, and they are different halves (ADR-0025):
 *  - mutual TLS says WHO is calling — this app's own certificate, not the worker's;
 *  - a signed token says WHAT IT MAY DO, read from a FILE because a private credential in an
 *    environment variable is readable by every child process and lands in crash dumps.
 *
 * `serverNameOverride` is verified against the server certificate's SANs. Dropping it does not
 * fail loudly — it makes the client accept a certificate for a different host, which is the
 * whole attack mTLS exists to stop.
 */
export async function createTemporalClient(): Promise<Client> {
  const connection = await Connection.connect({
    address: ENV.TEMPORAL_ADDRESS,
    tls: {
      serverNameOverride: ENV.TEMPORAL_TLS_SERVER_NAME,
      serverRootCACertificate: readFileSync(ENV.TEMPORAL_TLS_CA_FILE),
      clientCertPair: {
        crt: readFileSync(ENV.TEMPORAL_TLS_CERT_FILE),
        key: readFileSync(ENV.TEMPORAL_TLS_KEY_FILE),
      },
    },
    /*
     * A FUNCTION, not a string — the SDK calls it per request.
     *
     * A string is read ONCE at boot, so the moment the token expires every call fails with
     * "Request unauthorized.", which reads as a permissions problem rather than a stale
     * credential; the instinct is then to widen permissions. This app runs for weeks and its
     * token does not. `createTokenReader` re-reads only when the file changes, so an
     * unrotated token costs one `stat` and a rotated one is picked up without a restart.
     *
     * (The SDK's name for the bearer credential; it becomes the `authorization` header the
     * server's claim mapper reads. Not a Temporal Cloud API key.)
     */
    apiKey: createTokenReader(ENV.TEMPORAL_AUTH_TOKEN_FILE),
  });
  return new Client({ connection, namespace: ENV.TEMPORAL_NAMESPACE });
}
