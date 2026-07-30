/**
 * @heliogrid/env — the only package permitted to read a raw environment source.
 *
 * Split by responsibility: `schema/` DESCRIBES shapes (and never reads), `parse.ts` VALIDATES,
 * and each entry module is the only place a raw source is touched — `./server` for Node.
 * Import the entry that matches your runtime, never `process.env`.
 *
 * The root entry is deliberately runtime-free: it exports schemas and types only, so a
 * consumer can type against the environment without pulling in a read.
 */
export { parseEnv } from './parse';
export { type ApiEnv, apiEnvSchema } from './schema/api';
export * from './schema/fragments';
export { type InvariantsEnv, invariantsEnvSchema } from './schema/invariants';
export { type MobileEnv, mobileEnvSchema } from './schema/mobile';
export { type WebEnv, webEnvSchema } from './schema/web';
export { type WorkerEnv, workerEnvSchema } from './schema/worker';
