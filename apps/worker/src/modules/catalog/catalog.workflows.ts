import type {
  CatalogImportActivities,
  CatalogImportStepResult,
  catalogImportWorkflow,
  WorkflowInput,
} from '@heliogrid/contracts/workflows';
import { proxyActivities } from '@temporalio/workflow';
import { runImportPhase } from '../import/import.public';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The steps are typed against the contract, type-only: they run in the api, beside the catalog's
 * tables and the stored file, and this process never loads their implementation. The sequence is
 * the one every spreadsheet import shares (`import.phases.ts`).
 */
const { readCatalogImport, matchCatalogImport, applyCatalogImportRows } =
  proxyActivities<CatalogImportActivities>({
    // A 2 MB file read and opened, its rows matched, or one batch of rows written; a step still
    // running after this is stuck.
    startToCloseTimeout: '1 minute',
    // Bounded: a store or database down past these ends the phase — a read leaves a file to choose
    // again, a pass a mapping to confirm again, a run a report of the rows it could not write.
    retry: { maximumAttempts: 5 },
  });

const { endCatalogImportRead, endCatalogImportMatch, endCatalogImportRun } =
  proxyActivities<CatalogImportActivities>({
    startToCloseTimeout: '30 seconds',
    // Not bounded: ending a phase needs the database, and nothing else can tell the person.
    retry: { maximumInterval: '1 minute' },
  });

/** The exported name IS the workflow type; `catalog.public.ts` asserts it equals the contract's. */
export async function catalogImport(
  input: WorkflowInput<typeof catalogImportWorkflow>,
): Promise<CatalogImportStepResult> {
  const step = { tenantId: input.tenantId, jobId: input.jobId };
  return runImportPhase(input.phase, {
    read: () => readCatalogImport(step),
    endRead: () => endCatalogImportRead(step),
    match: () => matchCatalogImport(step),
    endMatch: () => endCatalogImportMatch(step),
    applyRows: () => applyCatalogImportRows(step),
    endRun: () => endCatalogImportRun(step),
  });
}
