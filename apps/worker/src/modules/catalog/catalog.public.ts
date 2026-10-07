import { catalogImportWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as catalogWorkflows from './catalog.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
catalogWorkflows satisfies Record<typeof catalogImportWorkflow.name, unknown>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<typeof catalogImportWorkflow.name, unknown>;

/**
 * The workflow alone: its steps run in the api, beside the catalog's tables, so this registration
 * carries no activities and this process polls no activity task on the queue.
 */
export const catalogWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: catalogImportWorkflow.taskQueue,
};
