import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The centre's horizon (`F6-19`): every read is bounded by the horizon, and this workflow,
 * run daily by a Temporal Schedule, deletes the notification rows past it. Nothing is lost — the
 * inbox is an inbox, and every fact lives on its record's timeline.
 *
 * Its step runs in the API process, beside the notification table; the worker holds only this
 * sequence.
 */
export const notificationHorizonPurgeWorkflow = defineWorkflow({
  name: 'notificationHorizonPurge',
  taskQueue: 'heliogrid-notifications',
  input: z.object({}),
  result: z.object({ purged: z.number().int().nonnegative() }),
  signals: {},
  queries: {},
  workflowId: () => 'notification-horizon-purge',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const NOTIFICATION_HORIZON_PURGE_SCHEDULE_ID = 'notification-horizon-purge';

/** The step, by NAME on both sides, so a rename is a compile error on both. */
export interface NotificationHorizonPurgeActivities {
  purgeNotificationsPastHorizon(): Promise<WorkflowResult<typeof notificationHorizonPurgeWorkflow>>;
}
