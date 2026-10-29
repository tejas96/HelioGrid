import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The billing timers (`M12-04`, `M12-06`, `M12-52`): a Temporal Schedule runs this workflow every
 * minute, and its one step moves each subscription the clock has made due — a trial past its end
 * to `expired`, a `past_due` company at day seven to `halted` — and starts the trial of a new
 * company an older api signed up without one.
 *
 * Its step runs in the API process, beside the subscription tables; the worker holds only this
 * sequence.
 */
export const billingTimersWorkflow = defineWorkflow({
  name: 'billingTimers',
  taskQueue: 'heliogrid-billing',
  input: z.object({}),
  result: z.object({
    moved: z.number().int().nonnegative(),
    trialsStarted: z.number().int().nonnegative(),
  }),
  signals: {},
  queries: {},
  workflowId: () => 'billing-timers',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const BILLING_TIMERS_SCHEDULE_ID = 'billing-timers';

/**
 * The step, as both processes see it: the worker calls it by NAME and the api registers it by
 * name, so a rename is a compile error on both sides.
 */
export interface BillingTimersActivities {
  advanceDueSubscriptions(): Promise<WorkflowResult<typeof billingTimersWorkflow>>;
}
