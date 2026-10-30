import {
  BILLING_OVERAGE_SCHEDULE_ID,
  BILLING_RECONCILE_SCHEDULE_ID,
  BILLING_TIMERS_SCHEDULE_ID,
  type BillingOverageActivities,
  type BillingReconcileActivities,
  type BillingTimersActivities,
  billingOverageWorkflow,
  billingReconcileWorkflow,
  billingTimersWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { BillingService } from './billing.service';
import { OverageService } from './overage.service';
import { ReconcileService } from './reconcile.service';

/** How often the timers run: the longest a due state waits to be recorded. */
const TIMERS_EVERY = '1 minute';

/** `M12-43` — the reconcile's fixed product cadence. */
const RECONCILE_EVERY = '6 hours';

/** How often the overage sweep runs: a period is reckoned within an hour of settling. */
const OVERAGE_EVERY = '1 hour';

/**
 * The billing steps, registered with the step host: they run here, beside the subscription
 * tables. The worker's `billingTimers` workflow calls the timers' step through the `billing-timers`
 * schedule, and its `billingReconcile` workflow the reconcile's, page by page, through
 * `billing-reconcile` — on its own queue, so a slow gateway never holds back the timers — and
 * its `billingOverage` workflow the overage sweep's, through `billing-overage`, on its own queue too.
 */
@Injectable()
export class BillingActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(BillingService) private readonly billing: BillingService,
    @Inject(ReconcileService) private readonly reconcile: ReconcileService,
    @Inject(OverageService) private readonly overage: OverageService,
  ) {}

  onModuleInit(): void {
    const timers: BillingTimersActivities = {
      advanceDueSubscriptions: () => this.billing.advanceDue(Date.now()),
    };
    this.host.register({
      taskQueue: billingTimersWorkflow.taskQueue,
      activities: timers,
      schedule: {
        id: BILLING_TIMERS_SCHEDULE_ID,
        workflow: billingTimersWorkflow,
        input: {},
        every: TIMERS_EVERY,
      },
    });
    const reconcile: BillingReconcileActivities = {
      reconcilePage: (after) => this.reconcile.reconcilePage(after, Date.now()),
    };
    this.host.register({
      taskQueue: billingReconcileWorkflow.taskQueue,
      activities: reconcile,
      schedule: {
        id: BILLING_RECONCILE_SCHEDULE_ID,
        workflow: billingReconcileWorkflow,
        input: {},
        every: RECONCILE_EVERY,
      },
    });
    const overage: BillingOverageActivities = {
      addDueOverage: () => this.overage.addDue(Date.now()),
    };
    this.host.register({
      taskQueue: billingOverageWorkflow.taskQueue,
      activities: overage,
      schedule: {
        id: BILLING_OVERAGE_SCHEDULE_ID,
        workflow: billingOverageWorkflow,
        input: {},
        every: OVERAGE_EVERY,
      },
    });
  }
}
