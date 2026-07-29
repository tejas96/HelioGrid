import { z } from 'zod';

/**
 * Shared env FRAGMENTS. Each app composes its own `envSchema` from these in
 * `apps/<app>/src/config/env.schema.ts` — so a var two services share is described once,
 * while each service still declares exactly what it needs.
 *
 * This file never reads `process.env`; it only describes shapes. The single read per app
 * lives in that app's `src/config/env.ts` (CLAUDE.md §Structure).
 */

/** Runtime role: member of app_user, subject to RLS. Required by anything touching Postgres. */
export const databaseUrlSchema = z.string().url().startsWith('postgres');

/** DDL/owner role. Optional at runtime — falls back to DATABASE_URL where an app allows it. */
export const adminDatabaseUrlSchema = databaseUrlSchema.optional();

/** BullMQ needs the TCP/RESP endpoint, never the Upstash REST URL (docs/03 §7). */
export const redisUrlSchema = z.string().url().startsWith('redis');

/**
 * Secrets get a length floor and NEVER a default — a dev fallback silently ships a
 * predictable signing key to production. Absent value ⇒ the app refuses to boot.
 */
export const secretSchema = z.string().min(32);

/** Browser origin allowed by CORS + Better Auth trustedOrigins. */
export const originSchema = z.string().url();

/** Non-secret convenience values may default IN THE SCHEMA — never via `??` at a call site. */
export const portSchema = z.coerce.number().int().min(1).max(65535).default(8080);

/** Node's conventional lifecycle switch. */
export const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');
