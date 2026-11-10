import {
  NOTIFICATION_HORIZON_PURGE_SCHEDULE_ID,
  NOTIFICATION_PUSH_DRAIN_SCHEDULE_ID,
  type NotificationHorizonPurgeActivities,
  type NotificationPushDrainActivities,
  notificationHorizonPurgeWorkflow,
  notificationPushDrainWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { NotificationHorizonService } from './notification.horizon.service';
import { NotificationPushService } from './notification.push.service';

/** How often the drain looks: the longest a held push waits past its quiet window's end. */
const DRAIN_EVERY = '1 minute';

/** The purge runs daily: a row a day past the horizon is unread by every centre read anyway. */
const PURGE_EVERY = '1 day';

/**
 * The two notification jobs' steps, registered with the step host: they run here, beside the
 * notification table and the push port. The worker's `notificationPushDrain` and
 * `notificationHorizonPurge` workflows call them through their schedules, on the notifications' own
 * queue, so a slow push provider never holds back another area's timers.
 */
@Injectable()
export class NotificationJobsActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(NotificationHorizonService) private readonly horizon: NotificationHorizonService,
  ) {}

  onModuleInit(): void {
    const drain: NotificationPushDrainActivities = {
      pushDueNotifications: () => this.push.drainDue(new Date()),
    };
    this.host.register({
      taskQueue: notificationPushDrainWorkflow.taskQueue,
      activities: drain,
      schedule: {
        id: NOTIFICATION_PUSH_DRAIN_SCHEDULE_ID,
        workflow: notificationPushDrainWorkflow,
        input: {},
        every: DRAIN_EVERY,
      },
    });
    const purge: NotificationHorizonPurgeActivities = {
      purgeNotificationsPastHorizon: () => this.horizon.purgePastHorizon(Date.now()),
    };
    this.host.register({
      taskQueue: notificationHorizonPurgeWorkflow.taskQueue,
      activities: purge,
      schedule: {
        id: NOTIFICATION_HORIZON_PURGE_SCHEDULE_ID,
        workflow: notificationHorizonPurgeWorkflow,
        input: {},
        every: PURGE_EVERY,
      },
    });
  }
}
