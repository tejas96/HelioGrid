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
const { readCatalogImport } = proxyActivities<CatalogImportActivities>({
  // A 2 MB file read and opened; a step still running after this is stuck, not slow.
  startToCloseTimeout: '1 minute',
  // Bounded: a store or database down past these leaves the person a file to choose again.
  retry: { maximumAttempts: 5 },
});

const { endCatalogImportRead } = proxyActivities<CatalogImportActivities>({
  startToCloseTimeout: '30 seconds',
  // Not bounded: ending the read needs the database, and nothing else can tell the person.
  retry: { maximumInterval: '1 minute' },
});

/** The exported name IS the workflow type; `catalog.public.ts` asserts it equals the contract's. */
export async function catalogImport(
  input: WorkflowInput<typeof catalogImportWorkflow>,
): Promise<CatalogImportStepResult> {
  const step = { tenantId: input.tenantId, jobId: input.jobId };
  switch (input.phase) {
    case 'read':
      try {
        return await readCatalogImport(step);
      } catch (error) {
        if (error instanceof ActivityFailure) return endCatalogImportRead(step);
        throw error;
      }
  }
}
