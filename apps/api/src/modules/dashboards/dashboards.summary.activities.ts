import {
  MONTHLY_SUMMARY_SCHEDULE_ID,
  type MonthlySummaryActivities,
  monthlySummaryWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { DashboardsSummaryService } from './dashboards.summary.service';

/**
 * How often the summary looks: the longest past 09:00 on the first a company's summary waits.
 * Companies sit in every zone, so their firsts turn at every hour.
 */
const SUMMARY_EVERY = '15 minutes';

/**
 * The summary's step, registered with the step host: it runs here, beside the tables it reads.
 * The worker's `monthlySummary` workflow calls it through the `monthly-summary` schedule, on the
 * reporting queue, so a slow run never holds back another area's timers.
 */
@Injectable()
export class DashboardsSummaryActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(DashboardsSummaryService) private readonly summary: DashboardsSummaryService,
  ) {}

  onModuleInit(): void {
    const activities: MonthlySummaryActivities = {
      summariseDueTenants: () => this.summary.summariseDueTenants(Date.now()),
    };
    this.host.register({
      taskQueue: monthlySummaryWorkflow.taskQueue,
      activities,
      schedule: {
        id: MONTHLY_SUMMARY_SCHEDULE_ID,
        workflow: monthlySummaryWorkflow,
        input: {},
        every: SUMMARY_EVERY,
      },
    });
  }
}
