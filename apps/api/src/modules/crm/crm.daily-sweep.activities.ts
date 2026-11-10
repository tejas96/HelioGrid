import {
  CRM_DAILY_SWEEP_SCHEDULE_ID,
  type CrmDailySweepActivities,
  crmDailySweepWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { CrmDailySweepService } from './crm.daily-sweep.service';

/**
 * How often the sweep looks: the longest past 09:00 a company's day waits to be swept. Every lead's
 * wake is 09:00 on its company's clock (`M02-49`), and companies sit in every zone.
 */
const SWEEP_EVERY = '15 minutes';

/**
 * The sweep's step, registered with the step host: it runs here, beside the CRM's tables. The
 * worker's `crmDailySweep` workflow calls it through the `crm-daily-sweep` schedule, on the CRM's
 * own queue, so a slow sweep never holds back another area's timers.
 */
@Injectable()
export class CrmDailySweepActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(CrmDailySweepService) private readonly sweep: CrmDailySweepService,
  ) {}

  onModuleInit(): void {
    const activities: CrmDailySweepActivities = {
      sweepDueTenants: () => this.sweep.sweepDueTenants(Date.now()),
    };
    this.host.register({
      taskQueue: crmDailySweepWorkflow.taskQueue,
      activities,
      schedule: {
        id: CRM_DAILY_SWEEP_SCHEDULE_ID,
        workflow: crmDailySweepWorkflow,
        input: {},
        every: SWEEP_EVERY,
      },
    });
  }
}
