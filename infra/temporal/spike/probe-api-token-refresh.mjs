/**
 * Proves the API's client picks up a ROTATED token without reconnecting.
 *
 * This needs a LONG-LIVED client: a fresh process reads the file at startup and would pass
 * whether or not the refresh works, which is exactly how the API half of this went unproven
 * on the first attempt (2026-08-26). One client, one connection, a rotation in between.
 */
import { execFileSync } from 'node:child_process';
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

const tokenFile = process.env.TEMPORAL_AUTH_TOKEN_FILE;
const client = await createTemporalClient();
const gateway = new TemporalGateway(client);

const before = `apitok-a-${process.pid}`;
await gateway.start(WF, { eventId: before, emittedAt: new Date().toISOString() });
check('1 the long-lived client works on the current token', true, before);

// Rotate the file underneath the RUNNING client.
execFileSync('sh', ['-c', `node ${ROOT}infra/temporal/scripts/mint-token.mjs api > ${tokenFile}`]);
check('2 the token file was rewritten under the live client', true);

// The SAME client, the SAME connection — no reconnect.
const after = `apitok-b-${process.pid}`;
let ok = true;
try {
  await gateway.start(WF, { eventId: after, emittedAt: new Date().toISOString() });
} catch (error) {
  ok = false;
  console.log(`      ${error.message.slice(0, 140)}`);
}
check('3 the SAME client starts a workflow on the ROTATED token', ok, after);

/*
 * And an obviously invalid token must FAIL — otherwise check 3 proves only that the OLD token
 * had not expired yet, which is exactly the trap this probe exists to avoid.
 *
 * Assert down the CAUSE CHAIN, not on `error.message`: the SDK's own message is the generic
 * "Failed to start Workflow" and the server's reason sits underneath. Matching the top-level
 * message reported a false FAIL on a working implementation (2026-08-26).
 */
execFileSync('sh', ['-c', `printf 'Bearer not-a-jwt' > ${tokenFile}`]);
const reason = (error) => {
  const seen = [];
  for (let e = error; e; e = e.cause) seen.push(e.message ?? '');
  return seen.join(' <- ');
};
let refused = '';
try {
  await gateway.start(WF, {
    eventId: `apitok-c-${process.pid}`,
    emittedAt: new Date().toISOString(),
  });
} catch (error) {
  refused = reason(error);
}
check(
  '4 a BAD token is refused — the read is LIVE, not cached at connect',
  /unauthorized|permission|denied/i.test(refused),
  refused.slice(0, 90),
);

execFileSync('sh', ['-c', `node ${ROOT}infra/temporal/scripts/mint-token.mjs api > ${tokenFile}`]);
await client.connection.close();
console.log(`\n${failures === 0 ? 'all' : `${failures} FAILED of`} 4 api-token checks`);
process.exit(failures === 0 ? 0 : 1);
