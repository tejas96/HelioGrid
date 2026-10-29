import type { BillingTimersActivities } from '@heliogrid/contracts/workflows';
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
