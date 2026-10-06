import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { OutboxActivityRegistration } from './outbox.activities';
import { OutboxAdminRepository } from './outbox.admin.repository';
import { OutboxDispatcher } from './outbox.dispatcher';
import { TemporalActivityHost } from './temporal.activity-host';
import { TemporalConnection } from './temporal.client';
import { TemporalGateway } from './temporal.gateway';
import { TEMPORAL_CLIENT } from './temporal.tokens';

/**
 * Closes the gRPC channel on `app.close()`. A live channel keeps the process alive, so without
 * this a command that boots the application context to do one thing never exits.
 */
@Injectable()
class TemporalShutdown implements OnApplicationShutdown {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TEMPORAL_CLIENT) private readonly connection: TemporalConnection) {}

  onApplicationShutdown(): Promise<void> {
    return this.connection.close();
  }
}

/**
 * Orchestration wiring (ADR-0025), registered declaratively like every other cross-cutting
 * provider — `main.ts` stays bootstrap only.
 *
 * The connection is built ONCE per process, on first use — not at boot (`T-FPLAT-064`): reads
 * keep being served while Temporal is unreachable, and a test that starts no workflow needs none.
 * It is a long-lived gRPC channel with its own reconnection: building one per request would open
 * a TLS handshake per call and make Temporal's own backpressure invisible.
 *
 * The api also HOSTS workflow steps (`temporal.activity-host.ts`) and owns the outbox's dispatch
 * (`outbox.dispatcher.ts`): both sit here because both are the one seam to the orchestrator.
 *
 * A module never constructs its own client — it injects `TemporalGateway`. Same rule the
 * `bullmq-fenced` dep-cruiser rule held for queues, and `temporal-client-fenced` now holds it
 * for this.
 */
@Global()
@Module({
  providers: [
    { provide: TEMPORAL_CLIENT, useClass: TemporalConnection },
    TemporalGateway,
    TemporalShutdown,
    TemporalActivityHost,
    OutboxAdminRepository,
    OutboxDispatcher,
    OutboxActivityRegistration,
  ],
  // A module starts a workflow through the gateway, hands its committed outbox event to the
  // dispatcher, and registers its queue's steps with the host.
  exports: [TemporalGateway, OutboxDispatcher, TemporalActivityHost],
})
export class TemporalModule {}
