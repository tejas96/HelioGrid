import { crmDailySweepWorkflow, leadImportWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as crmWorkflows from './crm.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
crmWorkflows satisfies Record<
  typeof leadImportWorkflow.name | typeof crmDailySweepWorkflow.name,
  unknown
>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<
  typeof leadImportWorkflow.name | typeof crmDailySweepWorkflow.name,
  unknown
>;

/**
 * The CRM's workflows alone, on its one queue: their steps run in the api, beside the CRM's tables,
 * so this registration carries no activities and this process polls no activity task on the queue.
 * Every CRM workflow shares this one registration — a second on the same queue would be a second
 * worker polling it.
 */
export const crmWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: leadImportWorkflow.taskQueue,
};
