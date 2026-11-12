import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The owner's monthly summary (`M13-21`): a Temporal Schedule runs this workflow every 15 minutes,
 * and its one step writes, for each tenant whose local month has turned and whose local clock has
 * passed 09:00 on the first, one in-app summary of the month just ended — once per tenant and month.
 *
 * Its step runs in the API process, beside the tables it reads; the worker holds only this sequence.
 */
export const monthlySummaryWorkflow = defineWorkflow({
  name: 'monthlySummary',
  taskQueue: 'heliogrid-reporting',
  input: z.object({}),
  result: z.object({ summarised: z.number().int().nonnegative() }),
  signals: {},
  queries: {},
  workflowId: () => 'monthly-summary',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const MONTHLY_SUMMARY_SCHEDULE_ID = 'monthly-summary';

/**
 * The step, as both processes see it: the worker calls it by NAME and the api registers it by
 * name. `summarised` counts the tenants written to this run.
 */
export interface MonthlySummaryActivities {
  summariseDueTenants(): Promise<WorkflowResult<typeof monthlySummaryWorkflow>>;
}
