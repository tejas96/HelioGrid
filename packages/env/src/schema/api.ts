import { z } from 'zod';
import {
  adminDatabaseUrlSchema,
  databaseUrlSchema,
  developmentCodeSchema,
  developmentPhoneSchema,
  filePathSchema,
  nodeEnvSchema,
  originSchema,
  portSchema,
  secretSchema,
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
const apiEnvObject = z.object({
  NODE_ENV: nodeEnvSchema,
  API_PORT: portSchema.default(8084),

  DATABASE_URL: databaseUrlSchema,
  DATABASE_ADMIN_URL: adminDatabaseUrlSchema,

  WEB_ORIGIN: originSchema.default('http://localhost:3002'),

  /**
   * Signs the ten-minute API token (`M01-07`). A secret: no default, and an absent value stops
   * the boot. Rotating it signs every live token out within one token life, which is the
   * revocation bound by design. The SMS provider's own variables arrive with its adapter.
   */
  AUTH_TOKEN_SECRET: secretSchema,

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

  /**
   * ONE development number whose sign-in code is fixed, so a local sign-in and a QA run never read
   * a log or wait out a cap (`M01-04`'s caps and `M01-05`'s single use still hold for every other
   * number). Both or neither, and refused outright in production: the boot stops, the door never
   * carries a known code. The number must be one the market packs resolve.
   */
  DEV_OTP_PHONE: developmentPhoneSchema.optional(),
  DEV_OTP_CODE: developmentCodeSchema.optional(),

  /* Injected by the platform, not by us. */
  FLY_MACHINE_VERSION: z.string().default('0.0.1'),
});

export const apiEnvSchema = apiEnvObject.superRefine((env, ctx) => {
  const declared = [env.DEV_OTP_PHONE, env.DEV_OTP_CODE].filter((v) => v !== undefined).length;
  if (declared === 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DEV_OTP_PHONE'],
      message: 'DEV_OTP_PHONE and DEV_OTP_CODE are set together, or not at all.',
    });
  }
  if (declared > 0 && env.NODE_ENV === 'production') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DEV_OTP_PHONE'],
      message:
        'A fixed sign-in code never runs in production. Remove DEV_OTP_PHONE and DEV_OTP_CODE.',
    });
  }
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
