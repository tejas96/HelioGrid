import type {
  StorageGaugeActivities,
  StorageGaugePageResult,
  UsageRecordActivities,
  UsageRecordStepResult,
  usageRecordWorkflow,
  WorkflowInput,
} from '@heliogrid/contracts/workflows';
import { proxyActivities, workflowInfo } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The steps are typed against the contract, type-only: they run in the api, beside the ledger,
 * and this process never loads their implementation.
 */
const { recordUsageEvent } = proxyActivities<UsageRecordActivities>({
  // One insert; a step still running after this is stuck.
  startToCloseTimeout: '30 seconds',
  // Unbounded on purpose: a used unit that never reaches the ledger is a unit never billed, and
  // the insert is a no-op once it has landed (`M12-18`, `M12-32`). The backoff caps at an hour.
  retry: { initialInterval: '10 seconds', maximumInterval: '1 hour' },
});

/** The exported name IS the workflow type; `usage.public.ts` asserts it equals the contract's. */
export async function usageRecord(
  input: WorkflowInput<typeof usageRecordWorkflow>,
): Promise<UsageRecordStepResult> {
  const { eventId: _eventId, ...event } = input;
  return recordUsageEvent(event);
}

const { weighStoragePage } = proxyActivities<StorageGaugeActivities>({
  // One page of companies, each one indexed sum over its files.
  startToCloseTimeout: '5 minutes',
  // Bounded: the next night weighs again, and a night's reading already written is kept.
  retry: { maximumAttempts: 3 },
});

/** Every page in turn until one comes back short. */
export async function storageGauge(): Promise<{ weighed: number }> {
  // From history, so a replay reads the same start: every page is dated by it.
  const runStartedAt = workflowInfo().runStartTime.toISOString();
  let weighed = 0;
  let after: string | null = null;
  do {
    const page: StorageGaugePageResult = await weighStoragePage({ after, runStartedAt });
    weighed += page.weighed;
    after = page.after;
  } while (after !== null);
  return { weighed };
}
