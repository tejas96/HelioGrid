import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The CRM's one timer (`M02-49`, block 3 RFC decision 7): a Temporal Schedule runs this workflow
 * every 15 minutes, and its one step sweeps each tenant whose local day has passed 09:00 and has no
 * sweep for that day yet — waking snoozed leads, resurfacing postponed losses, flagging dormant
 * leads and telling the owner of leads unassigned for more than a day, once each.
 *
 * Its step runs in the API process, beside the CRM's tables; the worker holds only this sequence.
 */
export const crmDailySweepWorkflow = defineWorkflow({
  name: 'crmDailySweep',
  taskQueue: 'heliogrid-crm',
  input: z.object({}),
  result: z.object({ swept: z.number().int().nonnegative() }),
  signals: {},
  queries: {},
  workflowId: () => 'crm-daily-sweep',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const CRM_DAILY_SWEEP_SCHEDULE_ID = 'crm-daily-sweep';

/**
 * The step, as both processes see it: the worker calls it by NAME and the api registers it by
 * name, so a rename is a compile error on both sides. `swept` counts the tenants swept this run.
 */
export interface CrmDailySweepActivities {
  sweepDueTenants(): Promise<WorkflowResult<typeof crmDailySweepWorkflow>>;
}
