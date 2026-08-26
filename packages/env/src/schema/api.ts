import { z } from 'zod';
import {
  adminDatabaseUrlSchema,
  databaseUrlSchema,
  filePathSchema,
  nodeEnvSchema,
  originSchema,
  portSchema,
  temporalAddressSchema,
  temporalNamespaceSchema,
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
   * teardown. The rebuild declares whatever it needs HERE and in .env.example —
   * Law 9: a variable is authored when its owning module's slice begins.
   */

  /*
   * Temporal (ADR-0025) — the API STARTS and SIGNALS workflows; the worker executes them.
   * Same variables, a DIFFERENT certificate and a different token: two identities, so a
   * compromise of one is not a compromise of both. (They currently hold the same Temporal
   * ROLE — the built-in authorizer cannot separate start-workflow from poll-task-queue;
   * `infra/temporal/README.md` §3 records why and what closing it would take.)
   */
  TEMPORAL_ADDRESS: temporalAddressSchema,
  TEMPORAL_NAMESPACE: temporalNamespaceSchema,
  TEMPORAL_TLS_CA_FILE: filePathSchema,
  TEMPORAL_TLS_CERT_FILE: filePathSchema,
  TEMPORAL_TLS_KEY_FILE: filePathSchema,
  TEMPORAL_AUTH_TOKEN_FILE: filePathSchema,
  TEMPORAL_TLS_SERVER_NAME: z.string().min(1).default('temporal'),

  /* Injected by the platform, not by us. */
  FLY_MACHINE_VERSION: z.string().default('0.0.1'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
