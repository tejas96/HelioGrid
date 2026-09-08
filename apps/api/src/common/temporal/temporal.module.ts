import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import type { Client } from '@temporalio/client';
import { createTemporalClient } from './temporal.client';
import { TemporalGateway } from './temporal.gateway';
import { TEMPORAL_CLIENT } from './temporal.tokens';

/**
 * Closes the gRPC channel on `app.close()`. A live channel keeps the process alive, so without
 * this a command that boots the application context to do one thing never exits.
 */
@Injectable()
class TemporalShutdown implements OnApplicationShutdown {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TEMPORAL_CLIENT) private readonly client: Client) {}

  onApplicationShutdown(): Promise<void> {
    return this.client.connection.close();
  }
}

/**
 * Orchestration wiring (ADR-0025), registered declaratively like every other cross-cutting
 * provider — `main.ts` stays bootstrap only.
 *
 * The connection is built ONCE per process, at boot. It is a long-lived gRPC channel with its
 * own reconnection: building one per request would open a TLS handshake per call and make
 * Temporal's own backpressure invisible.
 *
 * A module never constructs its own client — it injects `TemporalGateway`. Same rule the
 * `bullmq-fenced` dep-cruiser rule held for queues, and `temporal-client-fenced` now holds it
 * for this.
 */
@Global()
@Module({
  providers: [
    { provide: TEMPORAL_CLIENT, useFactory: createTemporalClient },
    TemporalGateway,
    TemporalShutdown,
  ],
  exports: [TemporalGateway],
})
export class TemporalModule {}
