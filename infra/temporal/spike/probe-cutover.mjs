/**
 * Track 7 cutover proof: the REAL API gateway, the REAL built worker, the production-like
 * stack. No spike harness in the path — this drives `apps/api/dist` against
 * `apps/worker/dist` so the thing proven is the thing that would ship.
 *
 * Run with the api identity's env (see the report for the exact invocation).
 */
import { createRequire } from 'node:module';

import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
/*
 * Resolve from THIS file, never from an absolute checkout path: a hardcoded `/Volumes/...`
 * makes the probe unrunnable on any other clone, which is the opposite of what a re-runnable
 * proof is for.
 */
const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const API = `${ROOT}apps/api/dist`;
const { createTemporalClient } = require(`${API}/common/temporal/temporal.client.js`);
const { TemporalGateway } = require(`${API}/common/temporal/temporal.gateway.js`);
const { platformHealthcheckWorkflow: WF } = require(
  `${ROOT}packages/contracts/dist/workflows/index.js`,
);

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};

const client = await createTemporalClient();
const gateway = new TemporalGateway(client);

const eventId = `cutover-${process.pid}-${Math.floor(Math.random() * 1e6)}`;
const input = { eventId, emittedAt: new Date().toISOString() };
const workflowId = WF.workflowId(input);

// ── 1. the contract derives the id; nobody types a string ───────────────────────────
check(
  '1 workflow id is derived from the contract',
  workflowId === `platform.healthcheck-${eventId}`,
  workflowId,
);

// ── 2. a malformed payload is refused AT INGRESS, before Temporal sees it ────────────
let refused = false;
try {
  await gateway.start(WF, { eventId: 'short', emittedAt: 'not-a-date' });
} catch (error) {
  refused = error?.name === 'ZodError';
}
check('2 malformed durable payload refused at ingress', refused, 'ZodError, no workflow started');

// ── 3. start, through the real gateway ──────────────────────────────────────────────
const handle = await gateway.start(WF, input);
check(
  '3 started through the API gateway',
  handle.workflowId === workflowId,
  handle.firstExecutionRunId.slice(0, 8),
);

// ── 4. a duplicate start attaches to the run in flight ──────────────────────────────
const again = await gateway.start(WF, input);
check(
  '4 duplicate start attaches, not duplicates',
  again.firstExecutionRunId === handle.firstExecutionRunId,
  'same runId',
);

// ── 5. query a RUNNING workflow, result validated against the contract ──────────────
await new Promise((r) => setTimeout(r, 2500));
const beats = await gateway.query(WF, workflowId, 'beatsRecorded');
check('5 query answers from the running workflow', beats === 1, `beatsRecorded=${beats}`);

// ── 6. an undeclared signal is refused by the contract, not by the server ───────────
let undeclared = false;
try {
  await gateway.signal(WF, workflowId, 'nope', {});
} catch (error) {
  undeclared = /declares no signal/.test(error.message);
}
check('6 an undeclared signal is refused by the contract', undeclared);

// ── 7. signal, complete, and the result validates ───────────────────────────────────
await gateway.signal(WF, workflowId, 'finish', {});
const result = await gateway.result(WF, workflowId);
const keys = result.beats.map((b) => b.key);
check(
  '7 completed; result matches the contract schema',
  result.eventId === eventId && keys.length === 2 && new Set(keys).size === 2,
  JSON.stringify(keys),
);

await client.connection.close();
console.log(`\n${failures === 0 ? 'all' : `${failures} FAILED of`} 7 cutover checks`);
process.exit(failures === 0 ? 0 : 1);
