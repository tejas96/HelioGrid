import type {
  CrmDailySweepActivities,
  LeadImportActivities,
  LeadImportStepResult,
  leadImportWorkflow,
  WorkflowInput,
} from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';
import { runImportPhase } from '../import/import.public';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The CRM's workflows. Their steps are typed against the contract, type-only: they run in the api,
 * beside the CRM's tables and the stored file, and this process never loads their implementation.
 */

const { readLeadImport, matchLeadImport, applyLeadImportRows } =
  proxyActivities<LeadImportActivities>({
    // A 2 MB file read and opened, its rows judged, or one batch of rows landed — each row in its
    // own transaction; a step still running after this is stuck.
    startToCloseTimeout: '1 minute',
    // Bounded: a store or database down past these ends the phase — a read leaves a file to choose
    // again, a pass a mapping to confirm again, a run a report of the rows it could not land.
    retry: { maximumAttempts: 5 },
  });

const { endLeadImportRead, endLeadImportMatch, endLeadImportRun } =
  proxyActivities<LeadImportActivities>({
    startToCloseTimeout: '30 seconds',
    // Not bounded: ending a phase needs the database, and nothing else can tell the person.
    retry: { maximumInterval: '1 minute' },
  });

/**
 * The lead import (`T-M02-005`): the shared spreadsheet sequence over the CRM's steps. The exported
 * name IS the workflow type; `crm.public.ts` asserts it equals the contract's.
 */
export async function leadImport(
  input: WorkflowInput<typeof leadImportWorkflow>,
): Promise<LeadImportStepResult> {
  const step = { tenantId: input.tenantId, jobId: input.jobId };
  return runImportPhase(input.phase, {
    read: () => readLeadImport(step),
    endRead: () => endLeadImportRead(step),
    match: () => matchLeadImport(step),
    endMatch: () => endLeadImportMatch(step),
    applyRows: () => applyLeadImportRows(step),
    endRun: () => endLeadImportRun(step),
  });
}

const { sweepDueTenants } = proxyActivities<CrmDailySweepActivities>({
  // A run sweeps a bounded batch of companies, each in one transaction; past this it is stuck.
  startToCloseTimeout: '10 minutes',
  // Bounded: the next scheduled run looks again 15 minutes later, and a company's day is swept once.
  retry: { maximumAttempts: 3 },
});

/**
 * The CRM's one timer (`M02-49`): each company whose day has passed 09:00 on its own clock, swept
 * once that day. The exported name IS the workflow type; `crm.public.ts` asserts it.
 */
export async function crmDailySweep(): Promise<{ swept: number }> {
  return sweepDueTenants();
}
