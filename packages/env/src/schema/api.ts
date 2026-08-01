import { z } from 'zod';
import {
  adminDatabaseUrlSchema,
  databaseUrlSchema,
  nodeEnvSchema,
  originSchema,
  portSchema,
} from './fragments';

/**
 * Everything apps/api reads from the environment, in one place. Adding a var here and to
 * `.env.example` is the whole job — there is no second place to update.
 *
 * NOTE the deliberate absences: no secret carries `.default()`, and no URL is optional-with-
 * empty-string. A missing DATABASE_URL used to coerce to `''` and fail at the first query;
 * now it fails at boot, loudly, with the key named.
 */
export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  API_PORT: portSchema.default(8084),

  DATABASE_URL: databaseUrlSchema,
  DATABASE_ADMIN_URL: adminDatabaseUrlSchema,

  WEB_ORIGIN: originSchema.default('http://localhost:3002'),

  /*
   * BETTER_AUTH_SECRET / BETTER_AUTH_URL / MSG91_* were removed on 2026-08-01 with the auth
   * teardown (ADR-0024). The rebuild declares whatever it needs HERE and in .env.example —
   * Law 9: a variable is authored when its owning module's slice begins.
   */

  /* Injected by the platform, not by us. */
  FLY_MACHINE_VERSION: z.string().default('0.0.1'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
