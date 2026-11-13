import type { MonthlySummaryActivities } from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The owner's reports. The step is typed against the contract, type-only: it runs in the api,
 * beside the tables it reads, and this process never loads its implementation.
 */

const { summariseDueTenants } = proxyActivities<MonthlySummaryActivities>({
  // A run summarises a bounded batch of companies, each in one transaction; past this it is stuck.
  startToCloseTimeout: '10 minutes',
  // Bounded: the next scheduled run looks again 15 minutes later, and a month is summarised once.
  retry: { maximumAttempts: 3 },
});

/**
 * The owner's monthly summary (`M13-21`): each company whose clock has passed 09:00 on the first,
 * summarised once for the month just ended. The exported name IS the workflow type;
 * `reporting.public.ts` asserts it.
 */
export async function monthlySummary(): Promise<{ summarised: number }> {
  return summariseDueTenants();
}
