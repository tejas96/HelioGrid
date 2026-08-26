import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { TEMPORAL_WORKER_REGISTRATIONS } from './common/temporal/temporal.tokens';
import { TemporalWorkerHost } from './common/temporal/temporal.worker';
import { platformWorkerRegistration } from './modules/platform/platform.public';

/**
 * Orchestration wiring — TEMPORAL (ADR-0025).
 *
 * This module used to register a BullMQ root connection. It was replaced, not extended: a
 * queue delivers one independent unit of work, and every multi-step property this product
 * needs — durable timers measured in days, exactly-once effects on money, recovery on
 * restart, safe code change while work is in flight — would otherwise have been rebuilt by
 * hand in thirteen modules.
 *
 * `REDIS_URL` IS gone from THIS app — it existed only for BullMQ. Redis itself stays in the
 * product (docs/engineering/08 §7: rate limiting and SSE fan-out), but those are API
 * concerns, and a required variable this process never reads is a setting nobody can explain.
 *
 * Workflows and activities land per business area under `src/modules/<area>/`. A module never
 * constructs its own connection — the host below owns the single one
 * (`temporal-client-fenced`, the same shape the `bullmq-fenced` rule had).
 */
@Module({
  imports: [LoggerModule.forRoot()],
  providers: [
    // The ROOT composes: it is the one file allowed to know which business areas exist, so
    // `common/` stays beneath the modules and a new area is one line here plus its own folder.
    {
      provide: TEMPORAL_WORKER_REGISTRATIONS,
      useValue: [platformWorkerRegistration],
    },
    TemporalWorkerHost,
  ],
})
export class WorkerModule {}
