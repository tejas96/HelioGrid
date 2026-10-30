import { billingReconcileWorkflow, billingTimersWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as billingWorkflows from './billing.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
billingWorkflows satisfies Record<
  typeof billingTimersWorkflow.name | typeof billingReconcileWorkflow.name,
  unknown
>;
// And the bundle's one entry re-exports them: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<
  typeof billingTimersWorkflow.name | typeof billingReconcileWorkflow.name,
  unknown
>;

/**
 * The workflow alone: its one step runs in the api, beside the subscription tables, so this
 * registration carries no activities and this process polls no activity task on the queue.
 */
export const billingWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: billingTimersWorkflow.taskQueue,
};

/** The reconcile's own queue: its pages wait on the gateway, never in the timers' way. */
export const billingReconcileWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: billingReconcileWorkflow.taskQueue,
};
