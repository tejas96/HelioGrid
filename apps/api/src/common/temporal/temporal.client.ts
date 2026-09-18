import { createIdentityTokenReader, temporalTlsFrom } from '@heliogrid/env/server';
import { Injectable } from '@nestjs/common';
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

/**
 * The client, connected on FIRST USE rather than at boot (owner ruling, `T-FPLAT-064`). The
 * environment is still validated when the process starts — a misconfigured service refuses to
 * boot — but the socket opens only when a workflow is first started, signalled or queried. So an
 * api whose work is reads keeps serving them while Temporal is down, and a test that starts no
 * workflow needs no Temporal at all.
 *
 * Still ONE channel per process: the first caller connects and every later one shares it. A
 * connect that failed is forgotten, so the next call tries again rather than returning the same
 * dead promise forever.
 */
@Injectable()
export class TemporalConnection {
  private opening: Promise<Client> | undefined;

  /** Whether a connect was ever attempted — what a boot test asserts stayed false. */
  get opened(): boolean {
    return this.opening !== undefined;
  }

  client(): Promise<Client> {
    if (this.opening === undefined) {
      this.opening = createTemporalClient().catch((error: unknown) => {
        this.opening = undefined;
        throw error;
      });
    }
    return this.opening;
  }

  /** Closes the channel only if one was ever opened — a process that never used it holds nothing. */
  async close(): Promise<void> {
    if (this.opening === undefined) return;
    const client = await this.opening.catch(() => undefined);
    this.opening = undefined;
    await client?.connection.close();
  }
}
