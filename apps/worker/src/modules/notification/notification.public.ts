import {
  notificationHorizonPurgeWorkflow,
  notificationPushDrainWorkflow,
} from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as notificationWorkflows from './notification.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
notificationWorkflows satisfies Record<
  typeof notificationPushDrainWorkflow.name | typeof notificationHorizonPurgeWorkflow.name,
  unknown
>;
// And the bundle's one entry re-exports them: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<
  typeof notificationPushDrainWorkflow.name | typeof notificationHorizonPurgeWorkflow.name,
  unknown
>;

/**
 * The notification jobs' workflows alone, on their one queue: their steps run in the api, beside
 * the notification table, so this registration carries no activities and this process polls no
 * activity task on the queue. Both jobs share it — a second on the same queue would be a second
 * worker polling it.
 */
export const notificationWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: notificationPushDrainWorkflow.taskQueue,
};
