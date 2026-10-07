import type {
  CatalogImportActivities,
  CatalogImportStepResult,
  catalogImportWorkflow,
  WorkflowInput,
} from '@heliogrid/contracts/workflows';
import { ActivityFailure, proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The steps are typed against the contract, type-only: they run in the api, beside the catalog's
 * tables and the stored file, and this process never loads their implementation.
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
  switch (input.phase) {
    case 'read':
      return endedOnFailure(
        () => readCatalogImport(step),
        () => endCatalogImportRead(step),
      );
    case 'match':
      return endedOnFailure(
        () => matchCatalogImport(step),
        () => endCatalogImportMatch(step),
      );
    case 'run':
      return endedOnFailure(
        () => runEveryBatch(step),
        () => endCatalogImportRun(step),
      );
  }
}

/** A phase's work, or — once a step has failed past its retries — the step that ends the phase. */
async function endedOnFailure(
  work: () => Promise<CatalogImportStepResult>,
  end: () => Promise<CatalogImportStepResult>,
): Promise<CatalogImportStepResult> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ActivityFailure) return end();
    throw error;
  }
}

/**
 * One batch per step call until none is left: each call writes rows its batch has not, so every
 * call moves the run on and the loop ends with the sheet.
 */
async function runEveryBatch(step: { tenantId: string; jobId: string }) {
  for (;;) {
    const applied = await applyCatalogImportRows(step);
    if (applied.status !== 'running') return applied;
  }
}
