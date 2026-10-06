import {
  OUTBOX_SWEEP_SCHEDULE_ID,
  type OutboxActivities,
  outboxSweepWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { OutboxDispatcher } from './outbox.dispatcher';
import { TemporalActivityHost } from './temporal.activity-host';

/** How often the sweep runs: the longest a crashed dispatch waits, past the dispatcher's grace. */
const SWEEP_EVERY = '1 minute';

/**
 * The sweep's one step, registered with the step host: it runs here, beside the outbox table, and
 * the worker's `outboxSweep` workflow calls it every minute through the `outbox-sweep` schedule.
 */
@Injectable()
export class OutboxActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
  ) {}

  onModuleInit(): void {
    const activities: OutboxActivities = {
      dispatchDueOutboxEvents: async () => ({ dispatched: await this.dispatcher.dispatchDue() }),
    };
    this.host.register({
      taskQueue: outboxSweepWorkflow.taskQueue,
      activities,
      schedule: {
        id: OUTBOX_SWEEP_SCHEDULE_ID,
        workflow: outboxSweepWorkflow,
        input: {},
        every: SWEEP_EVERY,
      },
    });
  }
}
