import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The held pushes (`F6-14`): a push quiet hours held back has a `push_due_at` and no
 * `push_sent_at`, and nothing sends it at emit. A Temporal Schedule runs this workflow every minute;
 * its one step claims the rows now due — skipping any another drain holds — and sends each once
 * through the same push port the emit uses.
 *
 * Its step runs in the API process, beside the notification table; the worker holds only this
 * sequence.
 */
export const notificationPushDrainWorkflow = defineWorkflow({
  name: 'notificationPushDrain',
  taskQueue: 'heliogrid-notifications',
  input: z.object({}),
  result: z.object({ pushed: z.number().int().nonnegative() }),
  signals: {},
  queries: {},
  workflowId: () => 'notification-push-drain',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const NOTIFICATION_PUSH_DRAIN_SCHEDULE_ID = 'notification-push-drain';

/** The step, by NAME on both sides, so a rename is a compile error on both. */
export interface NotificationPushDrainActivities {
  pushDueNotifications(): Promise<WorkflowResult<typeof notificationPushDrainWorkflow>>;
}
