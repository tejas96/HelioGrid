import { Global, Module } from '@nestjs/common';
import { createTemporalClient } from './temporal.client';
import { TemporalGateway } from './temporal.gateway';
import { TEMPORAL_CLIENT } from './temporal.tokens';

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
  providers: [{ provide: TEMPORAL_CLIENT, useFactory: createTemporalClient }, TemporalGateway],
  exports: [TemporalGateway],
})
export class TemporalModule {}
