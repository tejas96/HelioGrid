import { outboxSweepWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as outboxWorkflows from './outbox.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
outboxWorkflows satisfies Record<typeof outboxSweepWorkflow.name, unknown>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<typeof outboxSweepWorkflow.name, unknown>;

/**
 * The workflow alone: its one step runs in the api, beside the outbox table and the gateway, so
 * this registration carries no activities and this process polls no activity task on the queue.
 */
export const outboxWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: outboxSweepWorkflow.taskQueue,
};
