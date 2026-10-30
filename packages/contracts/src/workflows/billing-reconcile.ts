import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * The 6-hour reconcile (`M12-09`, `M12-43`): a Temporal Schedule runs this workflow, and it asks
 * the gateway for the charges on every subscription and open checkout that can still take one,
 * page by page, handing each to the one charge path. A charge the path had not recorded is drift
 * it repaired, and each raises an internal alert — reconciliation is supposed to be boring.
 *
 * Its own queue, not the timers': a page waits on the gateway, and a slow gateway must never hold
 * back the one-minute timers. Its step runs in the api; the worker holds only the loop.
 */
export const billingReconcileWorkflow = defineWorkflow({
  name: 'billingReconcile',
  taskQueue: 'heliogrid-billing-reconcile',
  input: z.object({}),
  result: z.object({
    checked: z.number().int().nonnegative(),
    repaired: z.number().int().nonnegative(),
  }),
  signals: {},
  queries: {},
  workflowId: () => 'billing-reconcile',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const BILLING_RECONCILE_SCHEDULE_ID = 'billing-reconcile';

/** One page's answer. `after` is where the next page starts; `null` when this was the last. */
export interface ReconcilePageResult {
  readonly checked: number;
  readonly repaired: number;
  readonly after: string | null;
}

/** The step, as both processes see it, called and registered by name. */
export interface BillingReconcileActivities {
  reconcilePage(after: string | null): Promise<ReconcilePageResult>;
}

export type BillingReconcileResult = WorkflowResult<typeof billingReconcileWorkflow>;
