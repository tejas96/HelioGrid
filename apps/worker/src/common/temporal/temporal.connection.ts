import {
  createIdentityTokenReader,
  IDENTITY_TOKEN_REFRESH_MS,
  temporalTlsFrom,
} from '@heliogrid/env/server';
import { NativeConnection } from '@temporalio/worker';
import { ENV } from '../../config/env';

/**
 * The worker's connection. Same two halves of identity as the API's, through the same reader
 * (ADR-0025), and a DIFFERENT certificate and token — two identities, so a compromise of one is
 * not a compromise of both.
 *
 * `NativeConnection`, not the client's `Connection`: a worker polls through the Rust core, and
 * handing it a JS-side connection silently creates a second one. It takes the token as a STRING
 * and cannot ask for one per request, so the rotation it cannot notice is pushed in below.
 */
export interface WorkerConnection {
  connection: NativeConnection;
  stopTokenRefresh(): void;
}

export async function connectToTemporal(): Promise<WorkerConnection> {
  const readToken = createIdentityTokenReader(ENV.TEMPORAL_AUTH_TOKEN_FILE);
  const connection = await NativeConnection.connect({
    address: ENV.TEMPORAL_ADDRESS,
    tls: temporalTlsFrom(ENV),
    apiKey: readToken(),
  });

  let pushed = readToken();
  const timer = setInterval(() => {
    const current = readToken();
    if (current === pushed) return;
    pushed = current;
    // Failing to refresh must not take the worker down: the current token may still be valid,
    // and a crash here would turn a rotation hiccup into an outage.
    void connection.setApiKey(current).catch(() => undefined);
  }, IDENTITY_TOKEN_REFRESH_MS);
  timer.unref();

  return { connection, stopTokenRefresh: () => clearInterval(timer) };
}
