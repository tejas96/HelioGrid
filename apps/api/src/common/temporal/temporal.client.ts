import { createIdentityTokenReader, temporalTlsFrom } from '@heliogrid/env/server';
import { Client, Connection } from '@temporalio/client';
import { ENV } from '../../config/env';

/**
 * The ONE place this app connects to Temporal. Everything else takes the gateway by DI.
 *
 * Both halves of identity — the certificate that says who is calling and the signed token that
 * says what it may do — are read by `@heliogrid/env/server`, the one reader both this app and
 * the worker use (ADR-0025).
 */
export async function createTemporalClient(): Promise<Client> {
  const connection = await Connection.connect({
    address: ENV.TEMPORAL_ADDRESS,
    tls: temporalTlsFrom(ENV),
    /*
     * A FUNCTION, not a string — the SDK calls it per request, so this connection notices a
     * rotated token on its next call and never needs the worker's timer.
     *
     * (The SDK's name for the bearer credential; it becomes the `authorization` header the
     * server's claim mapper reads. Not a Temporal Cloud API key.)
     */
    apiKey: createIdentityTokenReader(ENV.TEMPORAL_AUTH_TOKEN_FILE),
  });
  return new Client({ connection, namespace: ENV.TEMPORAL_NAMESPACE });
}
