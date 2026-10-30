import type {
  BillingNoticesActivities,
  BillingReconcileActivities,
  BillingReconcileResult,
  BillingTimersActivities,
  ReconcilePageResult,
} from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The step is typed against the contract, type-only: it runs in the api, beside the subscription
 * tables, and this process never loads its implementation.
 */
const { advanceDueSubscriptions } = proxyActivities<BillingTimersActivities>({
  // A run moves at most a bounded batch; a step still running after this is stuck, not slow.
  startToCloseTimeout: '1 minute',
  // Bounded: the next scheduled run tries again a minute later anyway.
  retry: { maximumAttempts: 3 },
});

/** The exported name IS the workflow type; `billing.public.ts` asserts it equals the contract's. */
export async function billingTimers(): Promise<{ moved: number; trialsStarted: number }> {
  return advanceDueSubscriptions();
}

const { reconcilePage } = proxyActivities<BillingReconcileActivities>({
  // One page waits on the gateway, at most ten seconds per ref (`reconcile.service.ts`).
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 3 },
});

/**
 * The 6-hour reconcile: every page in turn until one comes back short. A page that keeps failing
 * fails the run; the next scheduled run starts from the first page again, and every charge it
 * finds already recorded is the boring case.
 */
export async function billingReconcile(): Promise<BillingReconcileResult> {
  let checked = 0;
  let repaired = 0;
  let after: string | null = null;
  do {
    const page: ReconcilePageResult = await reconcilePage(after);
    checked += page.checked;
    repaired += page.repaired;
    after = page.after;
  } while (after !== null);
  return { checked, repaired };
}

const { tellDueNotices } = proxyActivities<BillingNoticesActivities>({
  // A run tells at most a bounded batch, each by SMS after its commit; past this it is stuck.
  startToCloseTimeout: '2 minutes',
  // Bounded: the next scheduled run tries again a minute later, and a notice told is never told twice.
  retry: { maximumAttempts: 3 },
});

/** The notices due on every dunning ladder and trial (`M12-39`, `M12-42`). */
export async function billingNotices(): Promise<{ told: number }> {
  return tellDueNotices();
}
