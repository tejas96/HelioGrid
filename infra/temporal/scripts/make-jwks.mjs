/**
 * Turn an RSA public key into the JWKS document Temporal's default key provider fetches.
 *
 * Hand-rolled rather than pulling in `jose`: this runs only in the local spike, and adding a
 * runtime dependency to the workspace for a script that never ships is the kind of drift the
 * dependency gates exist to catch.
 */
import { createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const KEY_ID = 'heliogrid-dev';

const pem = readFileSync(process.argv[2], 'utf8');
const jwk = createPublicKey(pem).export({ format: 'jwk' });

process.stdout.write(
  `${JSON.stringify({ keys: [{ ...jwk, kid: KEY_ID, use: 'sig', alg: 'RS256' }] }, null, 2)}\n`,
);
