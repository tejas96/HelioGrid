import {
  BILLING_NOTICES_SCHEDULE_ID,
  type BillingNoticesActivities,
  billingNoticesWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { BillingNoticeService } from './billing-notice.service';

/** How often the sweep runs: the longest a due notice waits to be told. */
const NOTICES_EVERY = '1 minute';

/**
 * The notices' step, registered with the step host: it runs here, beside the subscription tables.
 * The worker's `billingNotices` workflow calls it through the `billing-notices` schedule, on its
 * own queue, so a slow SMS carrier never holds back the billing timers.
 */
@Injectable()
export class BillingNoticeActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(BillingNoticeService) private readonly notices: BillingNoticeService,
  ) {}

  onModuleInit(): void {
    const activities: BillingNoticesActivities = {
      tellDueNotices: () => this.notices.tellDue(Date.now()),
    };
    this.host.register({
      taskQueue: billingNoticesWorkflow.taskQueue,
      activities,
      schedule: {
        id: BILLING_NOTICES_SCHEDULE_ID,
        workflow: billingNoticesWorkflow,
        input: {},
        every: NOTICES_EVERY,
      },
    });
  }
}
