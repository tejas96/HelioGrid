/**
 * The durable handoff, which is the whole reason an outbox exists.
 *
 * The failure it prevents: a product transaction commits, the process then tells Temporal to
 * start a workflow, and the process dies in between. Either the workflow never starts (work
 * silently lost) or the retry starts a SECOND one (work silently doubled). A dual-write —
 * committing the product row and calling Temporal in the same breath — has no third option.
 *
 * The outbox protocol: the event is written IN THE SAME TRANSACTION as the product change, a
 * dispatcher reads pending rows and starts the workflow with a workflow id DERIVED FROM THE
 * EVENT ID, then marks the row done. Every step is retryable because the id is stable.
 *
 * SCOPE, stated plainly: the outbox TABLE is product schema, and the owner has ruled product
 * database work out of this track. What is proven here is the half that is provable — that a
 * dispatcher crashing after Temporal accepted the start, then retrying, yields EXACTLY ONE
 * workflow and EXACTLY ONE set of effects. What is NOT proven is that the row and the product
 * change commit atomically; that arrives with the first migration.
 */
import { Client } from '@temporalio/client';
import { connect, NAMESPACE, TASK_QUEUE } from './connect.mjs';

let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};

const connection = await connect('api');
const client = new Client({ connection, namespace: NAMESPACE });

const eventId = `evt-${process.pid}-${Math.floor(Math.random() * 1e6)}`;
const workflowId = `healthcheck-${eventId}`;

/** One outbox row. `status` is what the dispatcher updates AFTER Temporal has accepted. */
const outbox = [{ id: eventId, status: 'pending' }];

async function dispatch({ crashAfterStart }) {
  const row = outbox.find((r) => r.status === 'pending');
  if (!row) return 'nothing-pending';
  const handle = await client.workflow.start('platformHealthcheck', {
    taskQueue: TASK_QUEUE,
    // THE dedupe key. Derived from the event, never generated — a random id would make every
    // retry a new workflow, which is the doubling this protocol exists to prevent.
    workflowId: `healthcheck-${row.id}`,
    args: [{ eventId: row.id }],
    // A retry must attach to the run already in flight rather than fail or replace it.
    workflowIdConflictPolicy: 'USE_EXISTING',
  });
  if (crashAfterStart) {
    // The dispatcher dies here: Temporal has the workflow, the row still says pending.
    throw new Error('injected dispatcher crash after start, before commit');
  }
  row.status = 'done';
  return handle.firstExecutionRunId;
}

// ── 1. the crash ────────────────────────────────────────────────────────────────────
let crashed = false;
try {
  await dispatch({ crashAfterStart: true });
} catch (error) {
  crashed = /injected dispatcher crash/.test(error.message);
}
check('1 dispatcher crashed after Temporal accepted the start', crashed, `row=${outbox[0].status}`);
check('1 the outbox row is still pending — it will be retried', outbox[0].status === 'pending', '');

// ── 2. the retry ────────────────────────────────────────────────────────────────────
const runIdAfterRetry = await dispatch({ crashAfterStart: false });
check(
  '2 the retry succeeded and the row is now done',
  outbox[0].status === 'done',
  `run=${runIdAfterRetry?.slice(0, 8)}…`,
);

/**
 * Counts executions for the id. It RETRIES, because SQL visibility is eventually consistent:
 * a list issued immediately after a start can return zero, and a probe that asserted once
 * would be flaky in exactly the way that teaches people to re-run until green. Track 7's code
 * must not assume read-after-write on `list` either — that is the point of writing it here.
 */
async function countExecutions() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const rows = [];
    for await (const wf of client.workflow.list({
      query: `WorkflowId = '${workflowId}'`,
    })) {
      rows.push(wf);
    }
    if (rows.length > 0) return rows.length;
    await new Promise((r) => setTimeout(r, 500));
  }
  return 0;
}

// ── 3. exactly one workflow ─────────────────────────────────────────────────────────
const found = { length: await countExecutions() };
check('3 EXACTLY ONE workflow exists for the event', found.length === 1, `count=${found.length}`);

// ── 4. a third dispatch of the same event is still one workflow ─────────────────────
outbox[0].status = 'pending';
await dispatch({ crashAfterStart: false });
const again = { length: await countExecutions() };
check('4 a THIRD dispatch still yields one workflow', again.length === 1, `count=${again.length}`);

// ── 5. the effects applied once ─────────────────────────────────────────────────────
const handle = client.workflow.getHandle(workflowId);
await handle.signal('finish');
const result = await handle.result();
const keys = result.beats.map((b) => b.key);
check(
  '5 activity effects applied exactly once each',
  keys.length === 2 && new Set(keys).size === 2 && keys.every((k) => k.startsWith(eventId)),
  JSON.stringify(keys),
);

// ── 6. the conflict policy is a DECISION, so prove the other one refuses ────────────
let rejected = false;
try {
  await client.workflow.start('platformHealthcheck', {
    taskQueue: TASK_QUEUE,
    workflowId,
    args: [{ eventId }],
    workflowIdReusePolicy: 'REJECT_DUPLICATE',
  });
} catch (error) {
  rejected = /already started|WorkflowExecutionAlreadyStarted|already exists/i.test(
    `${error.message}${error.name}`,
  );
}
check('6 REJECT_DUPLICATE refuses to reuse a completed id', rejected, '');

await connection.close();
console.log(`\n${failures === 0 ? 'all' : `${failures} FAILED of`} 7 durable-handoff checks`);
process.exit(failures === 0 ? 0 : 1);
