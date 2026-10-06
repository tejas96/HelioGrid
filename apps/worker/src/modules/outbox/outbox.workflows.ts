import type { OutboxActivities } from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The step is typed against the contract, type-only: it runs in the api, beside the outbox table,
 * and this process never loads its implementation.
 */
const { dispatchDueOutboxEvents } = proxyActivities<OutboxActivities>({
  // A sweep starts at most a bounded batch; a step still running after this is stuck, not slow.
  startToCloseTimeout: '1 minute',
  // Bounded: the next scheduled sweep tries again a minute later anyway.
  retry: { maximumAttempts: 3 },
});

/** The exported name IS the workflow type; `outbox.public.ts` asserts it equals the contract's. */
export async function outboxSweep(): Promise<{ dispatched: number }> {
  return dispatchDueOutboxEvents();
}
