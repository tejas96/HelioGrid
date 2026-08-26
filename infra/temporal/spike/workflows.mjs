/**
 * Deterministic workflow code. It imports NOTHING from Node, Nest, the database, HTTP or the
 * environment — a workflow is replayed from its history, so anything that could answer
 * differently on a second run corrupts it.
 *
 * Track 7's boundary rule comes from here: `apps/worker/src/modules/<area>/workflows.ts` is
 * bundled separately and may import only `@temporalio/workflow` and pure types.
 */
import { condition, defineSignal, proxyActivities, setHandler } from '@temporalio/workflow';

const { recordHeartbeat } = proxyActivities({
  startToCloseTimeout: '10 seconds',
  retry: { maximumAttempts: 3 },
});

export const finish = defineSignal('finish');

/**
 * Mirrors the existing `platform.healthcheck` job. Deliberately signal-driven: a workflow
 * that ends immediately cannot be caught mid-flight, and every durability proof here needs
 * one that is still running when the server restarts or the database is restored.
 */
export async function platformHealthcheck(input) {
  const first = await recordHeartbeat(input.eventId, 1);
  let done = false;
  setHandler(finish, () => {
    done = true;
  });
  await condition(() => done, '5 minutes');
  const second = await recordHeartbeat(input.eventId, 2);
  return { eventId: input.eventId, beats: [first, second] };
}
