/**
 * The replay gate — what stops a deploy from corrupting histories that are already durable.
 *
 * A workflow is not executed once; it is RE-EXECUTED from its history every time a worker
 * picks it up. Change the code so it would take a different path, and the replay diverges
 * from the recorded history. Temporal detects that as a non-determinism error and the
 * workflow wedges: it cannot progress on the new code and the old code is gone.
 *
 * The defence is to replay REAL captured histories against the NEW code before shipping it.
 * This proves the gate works by breaking it deliberately:
 *
 *   1  capture the history of a workflow the current code produced
 *   2  replay it against the SAME code                → passes
 *   3  replay it against INCOMPATIBLY CHANGED code    → fails, loudly
 *   4  replay it against the same change behind patched() → passes
 *
 * Step 3 is the one that matters. A gate nobody has watched go red is not a gate.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { connect, NAMESPACE, TASK_QUEUE } from './connect.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};

const connection = await connect('api');
const client = new Client({ connection, namespace: NAMESPACE });

// ── 1. produce a real history ───────────────────────────────────────────────────────
const id = `replay-${Date.now()}`;
const handle = await client.workflow.start('platformHealthcheck', {
  taskQueue: TASK_QUEUE,
  workflowId: id,
  args: [{ eventId: id }],
});
await new Promise((r) => setTimeout(r, 2500));
await handle.signal('finish');
await handle.result();

const history = await handle.fetchHistory();
check(
  '1 captured a real history from a completed workflow',
  history.events.length > 5,
  `${history.events.length} events`,
);

// ── 2. replay against the code that produced it ─────────────────────────────────────
let sameOk = true;
try {
  await Worker.runReplayHistory({ workflowsPath: join(HERE, 'workflows.mjs') }, history, id);
} catch (error) {
  sameOk = false;
  console.log(`      unexpected: ${error.message.slice(0, 120)}`);
}
check('2 replays clean against unchanged code', sameOk, '');

// ── 3. replay against an INCOMPATIBLE change ────────────────────────────────────────
// workflows-incompatible.mjs adds an activity call BEFORE the recorded one, so the replay
// reaches a command the history does not contain.
let brokeAsExpected = false;
let brokeWith = '';
try {
  await Worker.runReplayHistory(
    { workflowsPath: join(HERE, 'workflows-incompatible.mjs') },
    history,
    id,
  );
} catch (error) {
  brokeAsExpected = /nondeterminism|non-determinism|determinism|mismatch/i.test(
    `${error.name} ${error.message}`,
  );
  brokeWith = `${error.name}`;
}
check('3 INCOMPATIBLE change is caught by replay', brokeAsExpected, brokeWith || 'it did NOT fail');

// ── 4. the same change, behind patched() ────────────────────────────────────────────
let patchedOk = true;
try {
  await Worker.runReplayHistory(
    { workflowsPath: join(HERE, 'workflows-patched.mjs') },
    history,
    id,
  );
} catch (error) {
  patchedOk = false;
  console.log(`      unexpected: ${error.message.slice(0, 160)}`);
}
check('4 the same change behind patched() replays clean', patchedOk, '');

await connection.close();
console.log(`\n${failures === 0 ? 'all' : `${failures} FAILED of`} 4 replay checks`);
process.exit(failures === 0 ? 0 : 1);
