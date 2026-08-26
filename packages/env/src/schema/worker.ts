import { z } from 'zod';
import {
  adminDatabaseUrlSchema,
  databaseUrlSchema,
  filePathSchema,
  nodeEnvSchema,
  temporalAddressSchema,
  temporalNamespaceSchema,
} from './fragments';

/**
 * Everything apps/worker reads from the environment. Composed from the same shared
 * fragments as apps/api, so a var both services use is described once.
 */
export const workerEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,

  DATABASE_URL: databaseUrlSchema,
  DATABASE_ADMIN_URL: adminDatabaseUrlSchema,

  /*
   * REDIS_URL is GONE from the worker (ADR-0025, Track 7). It existed for BullMQ; orchestration
   * is Temporal now, which has its own PostgreSQL. `redisUrlSchema` stays in fragments.ts and
   * Redis stays in the product — docs/engineering/08 §7 needs it for rate limiting and SSE
   * fan-out — but those are API concerns, and a variable this process never reads is a
   * required setting nobody can explain.
   */

  /*
   * Temporal (ADR-0025). REQUIRED, unlike REDIS_URL: a worker with no orchestrator is not
   * "idle", it is a machine that will never do the work it was started for — and it would say
   * nothing about it. Failing at boot with the key named is the whole point of this file.
   */
  TEMPORAL_ADDRESS: temporalAddressSchema,
  TEMPORAL_NAMESPACE: temporalNamespaceSchema,
  TEMPORAL_TLS_CA_FILE: filePathSchema,
  TEMPORAL_TLS_CERT_FILE: filePathSchema,
  TEMPORAL_TLS_KEY_FILE: filePathSchema,
  /** The identity token, read from a FILE for the reason fragments.ts states. */
  TEMPORAL_AUTH_TOKEN_FILE: filePathSchema,
  /** Verified against the server certificate's SANs. A mismatch must fail, not warn. */
  TEMPORAL_TLS_SERVER_NAME: z.string().min(1).default('temporal'),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
