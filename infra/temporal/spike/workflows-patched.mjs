/**
 * The same change as workflows-incompatible.mjs, made SAFELY.
 *
 * `patched(id)` returns false when replaying a history recorded before the patch existed and
 * true for new executions, so old histories take the old path and new ones take the new. That
 * is the whole mechanism, and the sequence it implies is a policy, not a preference:
 *
 *   1  deploy with patched('x')            — old and new histories both work
 *   2  wait until every pre-patch execution has closed (retention bounds this)
 *   3  deploy deprecatePatch('x')          — new code only
 *   4  remove the branch
 *
 * Skipping step 2 is what wedges workflows, and 30-day retention is what makes step 2 a wait
 * rather than a guess.
 */
import {
  condition,
  defineSignal,
  patched,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';

const { recordHeartbeat } = proxyActivities({
  startToCloseTimeout: '10 seconds',
  retry: { maximumAttempts: 3 },
});

export const finish = defineSignal('finish');

export async function platformHealthcheck(input) {
  if (patched('healthcheck-preflight-beat')) {
    await recordHeartbeat(input.eventId, 0);
  }
  const first = await recordHeartbeat(input.eventId, 1);
  let done = false;
  setHandler(finish, () => {
    done = true;
  });
  await condition(() => done, '5 minutes');
  const second = await recordHeartbeat(input.eventId, 2);
  return { eventId: input.eventId, beats: [first, second] };
}
