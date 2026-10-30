import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The overage sweep (`M12-35`): a Temporal Schedule runs this workflow every hour, and its one step
 * reckons each closed, settled mandate period's overage from the usage ledger, then adds each
 * waiting add-on to its mandate's next debit at the gateway.
 *
 * Its own queue: a step waits on the gateway, and must never hold back the one-minute timers. Its
 * step runs in the api; the worker holds only this sequence.
 */
export const billingOverageWorkflow = defineWorkflow({
  name: 'billingOverage',
  taskQueue: 'heliogrid-billing-overage',
  input: z.object({}),
  result: z.object({
    reckoned: z.number().int().nonnegative(),
    added: z.number().int().nonnegative(),
  }),
  signals: {},
  queries: {},
  workflowId: () => 'billing-overage',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const BILLING_OVERAGE_SCHEDULE_ID = 'billing-overage';

/** The step, as both processes see it, called and registered by name. */
export interface BillingOverageActivities {
  addDueOverage(): Promise<WorkflowResult<typeof billingOverageWorkflow>>;
}
