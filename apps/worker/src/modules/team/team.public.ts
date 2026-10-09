import { inviteMessageWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import * as teamWorkflows from './team.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
teamWorkflows satisfies Record<typeof inviteMessageWorkflow.name, unknown>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<typeof inviteMessageWorkflow.name, unknown>;

/**
 * The workflow alone: its step runs in the api, beside the invitation's tables, so this
 * registration carries no activities and this process polls no activity task on the queue.
 */
export const teamWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: inviteMessageWorkflow.taskQueue,
};
