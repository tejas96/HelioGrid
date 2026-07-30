import { z } from 'zod';
import {
  adminDatabaseUrlSchema,
  databaseUrlSchema,
  nodeEnvSchema,
  originSchema,
  portSchema,
  secretSchema,
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
  PORT: portSchema,

  DATABASE_URL: databaseUrlSchema,
  DATABASE_ADMIN_URL: adminDatabaseUrlSchema,

  BETTER_AUTH_SECRET: secretSchema,
  BETTER_AUTH_URL: originSchema.default('http://localhost:8080'),
  WEB_ORIGIN: originSchema.default('http://localhost:3000'),

  /* MSG91 is optional: absent ⇒ the OTP port logs codes to the console (dev adapter). */
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),

  /* Injected by the platform, not by us. */
  FLY_MACHINE_VERSION: z.string().default('0.0.1'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
