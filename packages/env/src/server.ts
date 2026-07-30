/**
 * The ONE place Node reads `process.env`. Everything else imports a typed result from here.
 *
 * Memoized per target: parse once, fail once, at startup — not on the first request that
 * happens to touch a variable. Each loader is a function rather than a top-level const so
 * importing this module has no side effect; a consumer that never calls a loader never reads
 * the environment.
 *
 * The cache is written with an explicit `if`, not `cache ??= …`. Biome's noAssignInExpressions
 * rejects the terser form and is right to: an assignment hidden inside a return expression
 * reads as side-effect-free when it is exactly the opposite.
 */
import { parseEnv } from './parse';
import { type ApiEnv, apiEnvSchema } from './schema/api';
import { type InvariantsEnv, invariantsEnvSchema } from './schema/invariants';
import { type WorkerEnv, workerEnvSchema } from './schema/worker';

let apiCache: ApiEnv | undefined;
export function loadApiEnv(): ApiEnv {
  if (!apiCache) apiCache = parseEnv(apiEnvSchema, process.env, 'apps/api');
  return apiCache;
}

let workerCache: WorkerEnv | undefined;
export function loadWorkerEnv(): WorkerEnv {
  if (!workerCache) workerCache = parseEnv(workerEnvSchema, process.env, 'apps/worker');
  return workerCache;
}

let invariantsCache: InvariantsEnv | undefined;
export function loadInvariantsEnv(): InvariantsEnv {
  if (!invariantsCache) {
    invariantsCache = parseEnv(invariantsEnvSchema, process.env, 'tests/invariants');
  }
  return invariantsCache;
}

// Types come from the schemas (re-exported by the root entry), not re-declared here — one
// definition each, or `ApiEnv` would mean two different things depending on the import path.
export type { ApiEnv } from './schema/api';
export type { InvariantsEnv } from './schema/invariants';
export type { WorkerEnv } from './schema/worker';
