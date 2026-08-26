/**
 * Drives ONE workflow through the REAL API gateway, so the shell rehearsals below exercise
 * the shipping code path rather than a spike client.
 *
 *   node cutover-wf.mjs start|status|finish|cancel|result <eventId>
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

const [action, eventId] = process.argv.slice(2);
const client = await createTemporalClient();
const gateway = new TemporalGateway(client);
const input = { eventId, emittedAt: new Date().toISOString() };
const id = WF.workflowId(input);

try {
  if (action === 'start') {
    await gateway.start(WF, input);
    console.log(id);
  } else if (action === 'status') {
    console.log((await client.workflow.getHandle(id).describe()).status.name);
  } else if (action === 'finish') {
    await gateway.signal(WF, id, 'finish', {});
    console.log((await gateway.result(WF, id)).beats.map((b) => b.key).join(' '));
  } else if (action === 'cancel') {
    await client.workflow.getHandle(id).cancel();
    console.log('cancel requested');
  } else if (action === 'result') {
    console.log((await gateway.result(WF, id)).beats.map((b) => b.key).join(' '));
  }
} finally {
  await client.connection.close();
}
