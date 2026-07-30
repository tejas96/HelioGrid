import { z } from 'zod';
import {
  adminDatabaseUrlSchema,
  databaseUrlSchema,
  nodeEnvSchema,
  redisUrlSchema,
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
   * Optional ON PURPOSE — absent REDIS_URL is the documented scaffold-idle mode, and
   * modelling it here keeps that a visible part of the contract rather than an inline
   * ternary in worker.module.ts.
   */
  REDIS_URL: redisUrlSchema.optional(),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
