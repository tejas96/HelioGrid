import type {
  NotificationHorizonPurgeActivities,
  NotificationPushDrainActivities,
} from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The two notification jobs. Their steps are typed against the contract, type-only: they run
 * in the api, beside the notification table and the push port, and this process never loads them.
 */

const { pushDueNotifications } = proxyActivities<NotificationPushDrainActivities>({
  // A run sends a bounded batch, each push waiting on the provider; past this it is stuck.
  startToCloseTimeout: '5 minutes',
  // Bounded: the next scheduled run looks again a minute later, and a push is never sent twice.
  retry: { maximumAttempts: 3 },
});

/** The held pushes now due (`F6-14`). The exported name IS the workflow type. */
export async function notificationPushDrain(): Promise<{ pushed: number }> {
  return pushDueNotifications();
}

const { purgeNotificationsPastHorizon } = proxyActivities<NotificationHorizonPurgeActivities>({
  // A run deletes a bounded number of batches; past this it is stuck.
  startToCloseTimeout: '10 minutes',
  // Bounded: tomorrow's run deletes whatever this one left.
  retry: { maximumAttempts: 3 },
});

/** The notices past the centre's horizon (`F6-19`). The exported name IS the workflow type. */
export async function notificationHorizonPurge(): Promise<{ purged: number }> {
  return purgeNotificationsPastHorizon();
}
