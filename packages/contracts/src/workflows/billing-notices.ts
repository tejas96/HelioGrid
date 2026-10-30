import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The billing notices (`M12-39`, `M12-42`): a Temporal Schedule runs this workflow every minute,
 * and its one step tells each subscription the notice of its dunning ladder or trial that has
 * fallen due — in the app, by push and by the market's SMS text.
 *
 * Its step runs in the API process, beside the subscription tables; the worker holds only this
 * sequence.
 */
export const billingNoticesWorkflow = defineWorkflow({
  name: 'billingNotices',
  taskQueue: 'heliogrid-billing-notices',
  input: z.object({}),
  result: z.object({ told: z.number().int().nonnegative() }),
  signals: {},
  queries: {},
  workflowId: () => 'billing-notices',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const BILLING_NOTICES_SCHEDULE_ID = 'billing-notices';

/**
 * The step, as both processes see it: the worker calls it by NAME and the api registers it by
 * name, so a rename is a compile error on both sides.
 */
export interface BillingNoticesActivities {
  tellDueNotices(): Promise<WorkflowResult<typeof billingNoticesWorkflow>>;
}
