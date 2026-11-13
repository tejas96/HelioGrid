import { monthlySummaryWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as reportingWorkflows from './reporting.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
reportingWorkflows satisfies Record<typeof monthlySummaryWorkflow.name, unknown>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<typeof monthlySummaryWorkflow.name, unknown>;

/**
 * The reports' workflows alone, on their one queue: the step runs in the api, beside the tables it
 * reads, so this registration carries no activities and this process polls no activity task on it.
 */
export const reportingWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: monthlySummaryWorkflow.taskQueue,
};
