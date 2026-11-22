import { CAD_PLAN_READ_QUEUE, designPlanReadWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import * as bundledWorkflows from '../../worker.workflows';
import { cadPlanActivities } from './studio.activities';
import * as studioWorkflows from './studio.workflows';

/** The name check — `platform.public.ts` says why a rename must fail to compile. */
type StudioWorkflowName = typeof designPlanReadWorkflow.name;
studioWorkflows satisfies Record<StudioWorkflowName, unknown>;
// And the bundle's one entry re-exports it: an area left out there starts, then fails every task.
bundledWorkflows satisfies Record<StudioWorkflowName, unknown>;

/** A CAD plan's read: its source and keep steps run in the api, on this queue. */
export const studioWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: designPlanReadWorkflow.taskQueue,
};

/**
 * Plans read at once: one. A large DWG's reader holds hundreds of MB, beside the renders and every
 * workflow this process also runs; a second plan waits its turn in seconds.
 */
const PLANS_AT_ONCE = 1;

/** The CAD reader's queue: only this process polls it, since only its image carries the reader. */
export const cadPlanWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: CAD_PLAN_READ_QUEUE,
  activities: cadPlanActivities,
  maxConcurrentActivities: PLANS_AT_ONCE,
};
