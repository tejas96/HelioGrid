import type {
  CAD_PLAN_READ_QUEUE,
  CadPlanReadActivities,
  DesignPlanReadActivities,
  DesignPlanReadResult,
  designPlanReadWorkflow,
  WorkflowInput,
} from '@heliogrid/contracts/workflows';
import { ActivityFailure, proxyActivities } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * A design's CAD plan read on our server (`T-M05-002d`). Where the plan is and where its lines go,
 * and the keep, run in the api, typed against the contract type-only; the read runs here, on the
 * CAD reader's own queue.
 */
const { designPlanSource, keepDesignPlan } = proxyActivities<DesignPlanReadActivities>({
  // One read and a signed address, or one check of the store and one write; past this it is stuck.
  startToCloseTimeout: '1 minute',
  // Bounded: a store or database down past these ends the read as refused, and the person picks
  // the file again.
  retry: { maximumAttempts: 5 },
});

const { endDesignPlanRead } = proxyActivities<DesignPlanReadActivities>({
  startToCloseTimeout: '30 seconds',
  // Not bounded: ending the read needs the database, and nothing else tells the person.
  retry: { maximumInterval: '1 minute' },
});

/** The literal the contract names; a renamed queue fails to compile here. */
const CAD_QUEUE: typeof CAD_PLAN_READ_QUEUE = 'heliogrid-cad';

/**
 * The read's tries: each asks the api for fresh addresses first, since the link to the plan lives
 * five minutes (`FILE_DOWNLOAD_LINK_SECONDS`) and plans wait their turn one at a time.
 */
const READ_TRIES = 3;

const { readCadPlan } = proxyActivities<CadPlanReadActivities>({
  taskQueue: CAD_QUEUE,
  // A read waiting longer than this for its turn would fetch on a stale link: the try ends and the
  // next one asks for fresh addresses.
  scheduleToStartTimeout: '4 minutes',
  // The link need only be live when the fetch starts, which the wait above keeps inside its five
  // minutes. A 282 KB DWG reads in a quarter of a second; a read still running after this is stuck.
  startToCloseTimeout: '3 minutes',
  retry: { maximumAttempts: 1 },
});

/** The exported name IS the workflow type; `studio.public.ts` asserts it equals the contract's. */
export async function designPlanRead(
  input: WorkflowInput<typeof designPlanReadWorkflow>,
): Promise<DesignPlanReadResult> {
  const step = { tenantId: input.tenantId, pictureId: input.pictureId };
  try {
    for (let tried = 1; ; tried += 1) {
      const source = await designPlanSource(step);
      // Gone, or already read: ending it again answers the state it holds.
      if (source === null) return await endDesignPlanRead(step);
      try {
        const read = await readCadPlan(source);
        return await keepDesignPlan({ ...step, read });
      } catch (error) {
        if (!(error instanceof ActivityFailure) || tried >= READ_TRIES) throw error;
      }
    }
  } catch (error) {
    if (error instanceof ActivityFailure) return endDesignPlanRead(step);
    throw error;
  }
}
