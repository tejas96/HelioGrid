import {
  BILLING_TIMERS_SCHEDULE_ID,
  type BillingTimersActivities,
  billingTimersWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { BillingService } from './billing.service';

/** How often the timers run: the longest a due state waits to be recorded. */
const TIMERS_EVERY = '1 minute';

/**
 * The timers' one step, registered with the step host: it runs here, beside the subscription
 * tables, and the worker's `billingTimers` workflow calls it through the `billing-timers` schedule.
 */
@Injectable()
export class BillingActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(BillingService) private readonly billing: BillingService,
  ) {}

  onModuleInit(): void {
    const activities: BillingTimersActivities = {
      advanceDueSubscriptions: () => this.billing.advanceDue(Date.now()),
    };
    this.host.register({
      taskQueue: billingTimersWorkflow.taskQueue,
      activities,
      schedule: {
        id: BILLING_TIMERS_SCHEDULE_ID,
        workflow: billingTimersWorkflow,
        input: {},
        every: TIMERS_EVERY,
      },
    });
  }
}
