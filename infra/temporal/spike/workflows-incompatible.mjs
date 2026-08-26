/**
 * The SAME workflow with an incompatible change: an extra activity call BEFORE the recorded
 * one. Replaying a history produced by the original against this must FAIL — that failure is
 * the gate, and probe-replay.mjs exists to watch it happen.
 *
 * This is what an innocent-looking edit does. Nobody writes "break every running workflow";
 * they add a step at the top of a function.
 */
import { condition, defineSignal, proxyActivities, setHandler } from '@temporalio/workflow';

const { recordHeartbeat } = proxyActivities({
  startToCloseTimeout: '10 seconds',
  retry: { maximumAttempts: 3 },
});

export const finish = defineSignal('finish');

export async function platformHealthcheck(input) {
  await recordHeartbeat(input.eventId, 0); // ← THE CHANGE: a command the history has no record of
  const first = await recordHeartbeat(input.eventId, 1);
  let done = false;
  setHandler(finish, () => {
    done = true;
  });
  await condition(() => done, '5 minutes');
  const second = await recordHeartbeat(input.eventId, 2);
  return { eventId: input.eventId, beats: [first, second] };
}
