import { readFileSync, statSync } from 'node:fs';
import { NativeConnection } from '@temporalio/worker';
import { ENV } from '../../config/env';

/**
 * The worker's connection. Same two halves of identity as the API's (ADR-0025) and a
 * DIFFERENT certificate and token — two identities, so a compromise of one is not a
 * compromise of both.
 *
 * `NativeConnection`, not the client's `Connection`: a worker polls through the Rust core, and
 * handing it a JS-side connection silently creates a second one.
 */
function readToken(): string {
  return readFileSync(ENV.TEMPORAL_AUTH_TOKEN_FILE, 'utf8')
    .replace(/^Bearer\s+/, '')
    .trim();
}

/**
 * How often the token file is re-read. The worker runs for weeks; its token does not last
 * that long, and reading it once at boot means every poll fails the moment it expires — with
 * "Request unauthorized.", which reads as a permissions problem rather than a stale
 * credential.
 *
 * The client's `Connection` takes a FUNCTION and calls it per request; `NativeConnection` does
 * not, so the refresh is explicit here.
 */
const TOKEN_REFRESH_MS = 60_000;

export interface WorkerConnection {
  connection: NativeConnection;
  stopTokenRefresh(): void;
}

export async function connectToTemporal(): Promise<WorkerConnection> {
  const connection = await NativeConnection.connect({
    address: ENV.TEMPORAL_ADDRESS,
    tls: {
      serverNameOverride: ENV.TEMPORAL_TLS_SERVER_NAME,
      serverRootCACertificate: readFileSync(ENV.TEMPORAL_TLS_CA_FILE),
      clientCertPair: {
        crt: readFileSync(ENV.TEMPORAL_TLS_CERT_FILE),
        key: readFileSync(ENV.TEMPORAL_TLS_KEY_FILE),
      },
    },
    apiKey: readToken(),
  });

  // Keyed on mtime+size, so a token that has not been rotated costs one `stat` per minute and
  // no gRPC call at all.
  let lastKey = fileKey();
  const timer = setInterval(() => {
    const key = fileKey();
    if (key === lastKey) return;
    lastKey = key;
    // Failing to refresh must not take the worker down: the current token may still be valid,
    // and a crash here would turn a rotation hiccup into an outage.
    void connection.setApiKey(readToken()).catch(() => undefined);
  }, TOKEN_REFRESH_MS);
  timer.unref();

  return { connection, stopTokenRefresh: () => clearInterval(timer) };
}

function fileKey(): string {
  const stat = statSync(ENV.TEMPORAL_AUTH_TOKEN_FILE);
  return `${stat.mtimeMs}:${stat.size}`;
}
