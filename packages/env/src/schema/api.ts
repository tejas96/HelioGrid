import { z } from 'zod';
import {
  API_PORT_DEFAULT,
  adminDatabaseUrlSchema,
  adminPoolMaxSchema,
  databaseUrlSchema,
  developmentCodeSchema,
  developmentPhonesSchema,
  filePathSchema,
  googleClientIdsSchema,
  nodeEnvSchema,
  originSchema,
  poolMaxSchema,
  portSchema,
  secretSchema,
  serviceAccountJsonBase64Schema,
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
  API_PORT: portSchema.default(API_PORT_DEFAULT),

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
  /* The runtime and admin pools. See the fragment for why an operator must be able to move these. */
  DB_POOL_MAX: poolMaxSchema,
  DB_ADMIN_POOL_MAX: adminPoolMaxSchema,

  TEMPORAL_ADDRESS: temporalAddressSchema,
  TEMPORAL_NAMESPACE: temporalNamespaceSchema,
  TEMPORAL_TLS_CA_FILE: filePathSchema,
  TEMPORAL_TLS_CERT_FILE: filePathSchema,
  TEMPORAL_TLS_KEY_FILE: filePathSchema,
  TEMPORAL_AUTH_TOKEN_FILE: filePathSchema,
  TEMPORAL_TLS_SERVER_NAME: z.string().min(1).default('temporal'),

  /**
   * The FCM credential a push leaves through (`F6-13`). Optional on purpose: absent binds the
   * development adapter, which writes the push to the log — so a machine with no Firebase
   * project still runs the whole path, and CI does too.
   */
  FCM_SERVICE_ACCOUNT_JSON_BASE64: serviceAccountJsonBase64Schema.optional(),
  /**
   * The object store every file's bytes live in (`T-FPLAT-035`), reached through the S3 API that
   * every vendor the suite uses speaks — so a vendor move is these values, never code. All or
   * none: absent in development binds the in-memory store — declares succeed, and no client can
   * reach the link to upload — and production refuses to boot without one (the file module owns that refusal, since `PROVIDER` is domain's vocabulary).
   * The endpoint is the address a CLIENT uploads to, so it must be reachable from a browser.
   */
  OBJECT_STORE_PROVIDER: z.string().min(1).optional(),
  OBJECT_STORE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORE_REGION: z.string().min(1).optional(),
  OBJECT_STORE_BUCKET: z.string().min(1).optional(),
  OBJECT_STORE_ACCESS_KEY_ID: z.string().min(1).optional(),
  OBJECT_STORE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  /** Bucket in the path (`host/bucket/key`) rather than the host name; RustFS and Oracle need it. */
  OBJECT_STORE_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  /**
   * The development numbers whose sign-in code is the one fixed code, so a local sign-in and a QA
   * run never read a log or wait out a cap (`M01-04`'s caps and `M01-05`'s single use still hold
   * for every other number). Both or neither, and refused outright in production: the boot stops,
   * the door never carries a known code. Each number must be one the market packs resolve.
   */
  DEV_OTP_PHONES: developmentPhonesSchema.optional(),
  DEV_OTP_CODE: developmentCodeSchema.optional(),
  /**
   * The Google OAuth client ids a Google ID token may be issued for (`M01-02`): each
   * environment's web id (which the web and Android sign-ins name) and its iOS id. Client ids, not
   * secrets. Optional: unset, POST /auth/sign-in/google refuses every token and nothing else changes.
   */
  GOOGLE_CLIENT_IDS: googleClientIdsSchema.optional(),

  /**
   * The oldest phone build the api still serves, and where each store sells the new one
   * (`F4-36`). Unset: no minimum, nothing refused. Raising it is a config change and a restart,
   * never an app release. Its grammar is domain's (`parseClientVersion`), which this package may
   * not import — so `createApp` owns both boot refusals, a minimum it cannot read and a minimum
   * without both store links, in one place with one test.
   */
  MOBILE_MIN_VERSION: z.string().min(1).optional(),
  MOBILE_STORE_URL_IOS: z.string().url().optional(),
  MOBILE_STORE_URL_ANDROID: z.string().url().optional(),

  /* Injected by the platform, not by us. */
  FLY_MACHINE_VERSION: z.string().default('0.0.1'),
});

export const apiEnvSchema = apiEnvObject.superRefine((env, ctx) => {
  const store = [
    env.OBJECT_STORE_PROVIDER,
    env.OBJECT_STORE_ENDPOINT,
    env.OBJECT_STORE_REGION,
    env.OBJECT_STORE_BUCKET,
    env.OBJECT_STORE_ACCESS_KEY_ID,
    env.OBJECT_STORE_SECRET_ACCESS_KEY,
  ].filter((v) => v !== undefined).length;
  if (store > 0 && store < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OBJECT_STORE_PROVIDER'],
      message:
        'The OBJECT_STORE_ provider, endpoint, region, bucket and both keys are set together, or not at all.',
    });
  }
  const declared = [env.DEV_OTP_PHONES, env.DEV_OTP_CODE].filter((v) => v !== undefined).length;
  if (declared === 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DEV_OTP_PHONES'],
      message: 'DEV_OTP_PHONES and DEV_OTP_CODE are set together, or not at all.',
    });
  }
  if (declared > 0 && env.NODE_ENV === 'production') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DEV_OTP_PHONES'],
      message:
        'A fixed sign-in code never runs in production. Remove DEV_OTP_PHONES and DEV_OTP_CODE.',
    });
  }
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
