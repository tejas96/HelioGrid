import {
  STORAGE_GAUGE_SCHEDULE_ID,
  type StorageGaugeActivities,
  storageGaugeWorkflow,
  type UsageRecordActivities,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { UsageService } from './usage.service';

/** `M12-33` — storage is a nightly gauge. */
const GAUGE_EVERY = '1 day';

/**
 * The usage ledger's steps, registered with the step host on their own queue: they run here,
 * beside the ledger. The worker's `usageRecord` workflow calls the write for each outbox event,
 * and its `storageGauge` workflow the gauge, page by page, through the `storage-gauge` schedule.
 */
@Injectable()
export class UsageActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(UsageService) private readonly usage: UsageService,
  ) {}

  onModuleInit(): void {
    const steps: UsageRecordActivities & StorageGaugeActivities = {
      recordUsageEvent: (event) => this.usage.record(event, Date.now()),
      weighStoragePage: ({ after, runStartedAt }) =>
        this.usage.weighStoragePage(after, Date.parse(runStartedAt)),
    };
    this.host.register({
      taskQueue: storageGaugeWorkflow.taskQueue,
      activities: steps,
      schedule: {
        id: STORAGE_GAUGE_SCHEDULE_ID,
        workflow: storageGaugeWorkflow,
        input: {},
        every: GAUGE_EVERY,
      },
    });
  }
}
