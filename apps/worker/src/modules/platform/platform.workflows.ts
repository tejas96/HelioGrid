import {
  condition,
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import type { PlatformActivities } from './platform.activities.types';

/**
 * DETERMINISTIC CODE. This file is replayed from history every time a worker picks the
 * workflow up, so anything that could answer differently on a second run corrupts it.
 *
 * It therefore imports NOTHING from Node, Nest, the database, HTTP or the environment — no
 * `Date.now()`, no `Math.random()`, no `process.env`, no `fetch`. Time comes from the
 * workflow clock, randomness from the workflow's seeded source, and every side effect from an
 * ACTIVITY. `workflows-deterministic-imports` in `.dependency-cruiser.cjs` enforces the import
 * half; the replay gate (`infra/temporal/spike/probe-replay.mjs`) catches the rest.
 *
 * The activity TYPES are imported type-only from a types file that itself imports nothing —
 * importing the implementations would drag the database into the bundle.
 */
const { recordHeartbeat } = proxyActivities<PlatformActivities>({
  startToCloseTimeout: '10 seconds',
  // Bounded, not infinite: an activity that can never succeed should stop and be visible.
  retry: { maximumAttempts: 3 },
});

export const finishSignal = defineSignal('finish');
export const beatsRecordedQuery = defineQuery<number>('beatsRecorded');

/**
 * The exported name IS the workflow type Temporal resolves. It must equal
 * `platformHealthcheckWorkflow.name` in contracts, and `platform.public.ts` asserts that at
 * compile time rather than leaving it to a runtime failure on the first task.
 */
export async function platformHealthcheck(input: { eventId: string; emittedAt: string }) {
  const beats: Array<{ key: string; at: string }> = [];
  setHandler(beatsRecordedQuery, () => beats.length);

  beats.push(await recordHeartbeat(input.eventId, 1));

  let done = false;
  setHandler(finishSignal, () => {
    done = true;
  });
  // A bounded wait, so an unsignalled workflow ends rather than living until retention
  // expires it. `condition` returns false on timeout; the workflow completes either way.
  await condition(() => done, '5 minutes');

  beats.push(await recordHeartbeat(input.eventId, 2));
  return { eventId: input.eventId, beats };
}
