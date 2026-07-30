import { z } from 'zod';

/**
 * Shared env FRAGMENTS — so a variable two services share is described ONCE while each
 * service still declares exactly what it needs.
 *
 * This file never reads an environment source; it only describes shapes. Composition lives
 * in the sibling per-target schemas, validation in ../parse.ts, and the single actual read
 * in ../server.ts. Moved here from packages/contracts on 2026-07-30: contracts is the WIRE
 * format, and deployment configuration is not part of the API surface.
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
