import { z } from 'zod';

/**
 * Shared env FRAGMENTS — so a variable two services share is described ONCE while each
 * service still declares exactly what it needs.
 *
 * This file never reads an environment source; it only describes shapes. Composition lives
 * in the sibling per-target schemas, validation in ../parse.ts, and the single actual read
 * in ../server.ts. Here and not in packages/contracts: contracts is the WIRE
 * format, and deployment configuration is not part of the API surface.
 */

/** Runtime role: member of app_user, subject to RLS. Required by anything touching Postgres. */
export const databaseUrlSchema = z.string().url().startsWith('postgres');

/** DDL/owner role. Optional at runtime — falls back to DATABASE_URL where an app allows it. */
export const adminDatabaseUrlSchema = databaseUrlSchema.optional();

/**
 * The TCP/RESP endpoint, never the Upstash REST URL (docs/engineering/03 §7).
 *
 * Redis is NOT the orchestrator any more — ADR-0025 moved that to Temporal, which has its own
 * PostgreSQL and never touches this. Redis stays for rate limiting and SSE fan-out
 * (docs/engineering/08 §7), and for the superseded BullMQ scaffold until Track 7 cuts over.
 * Removing BullMQ therefore does not remove this variable.
 *
 * Temporal's own connection variables (address, namespace, mTLS paths, token source) land in
 * Track 7 WITH their first consumer — a validated variable nothing reads is a required
 * setting nobody can explain.
 */
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

/**
 * Temporal (ADR-0025). Shared by apps/api (which STARTS workflows) and apps/worker (which
 * EXECUTES them) — one description, two consumers, which is what this file is for.
 *
 * The certificate paths are FILES, not inline PEM. A private key in an environment variable
 * is readable by every child process, appears in `fly ssh console` output and in any crash
 * dump that snapshots the environment; a file has permissions. Fly writes secrets to files
 * for exactly this reason.
 */
export const temporalAddressSchema = z.string().min(3);
export const temporalNamespaceSchema = z.string().min(1);
/** A path that must exist at boot; the caller asserts readability, the schema asserts shape. */
export const filePathSchema = z.string().min(1);
