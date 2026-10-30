import { storageGaugeWorkflow, usageRecordWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as usageWorkflows from './usage.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
usageWorkflows satisfies Record<
  typeof usageRecordWorkflow.name | typeof storageGaugeWorkflow.name,
  unknown
>;
// And the bundle's one entry re-exports them: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<
  typeof usageRecordWorkflow.name | typeof storageGaugeWorkflow.name,
  unknown
>;

/**
 * The workflows alone: their steps run in the api, beside the ledger, so this registration carries
 * no activities and this process polls no activity task on the queue.
 */
export const usageWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: usageRecordWorkflow.taskQueue,
};
