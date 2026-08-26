/**
 * How a HelioGrid process reaches Temporal: mutual TLS for WHO, a signed token for WHAT-MAY.
 *
 * Both are required. Track 7 lifts this shape into `apps/api/src/common/temporal/` and the
 * worker's bootstrap — it lives here first so the connection is proven before any product
 * code depends on it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connection } from '@temporalio/client';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKI = join(HERE, '..', 'pki');

export const NAMESPACE = 'heliogrid';
export const TASK_QUEUE = 'heliogrid-platform';
export const ADDRESS = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';

/** Mints an identity token. In production this is the identity provider, not a local script. */
export function token(identity) {
  return execFileSync('node', [join(HERE, '..', 'scripts', 'mint-token.mjs'), identity], {
    encoding: 'utf8',
  });
}

export function tlsFor(identity) {
  return {
    serverNameOverride: 'temporal',
    serverRootCACertificate: readFileSync(join(PKI, 'ca-bundle.pem')),
    clientCertPair: {
      crt: readFileSync(join(PKI, `client-${identity}`, 'tls.pem')),
      key: readFileSync(join(PKI, `client-${identity}`, 'tls.key')),
    },
  };
}

/**
 * `apiKey` is the SDK's name for the bearer credential — it becomes the `authorization`
 * header the default claim mapper reads. It is NOT a Temporal Cloud API key here.
 */
export async function connect(identity) {
  return Connection.connect({
    address: ADDRESS,
    tls: tlsFor(identity),
    apiKey: token(identity).replace(/^Bearer /, ''),
  });
}
