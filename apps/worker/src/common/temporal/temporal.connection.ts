import {
  createIdentityTokenReader,
  temporalTlsFrom,
  watchIdentityToken,
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
 * and cannot ask for one per request, so each rotation is pushed in (`watchIdentityToken`).
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

  const stopTokenRefresh = watchIdentityToken(readToken, (token) => connection.setApiKey(token));
  return { connection, stopTokenRefresh };
}
