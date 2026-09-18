import { loadInvariantsEnv } from '@heliogrid/env/server';

/**
 * What a proof needs before it can run, and the ONE shape its absence takes (CLAUDE.md §8,
 * "silence is never evidence"): present → run; absent under CI → THROW, because a skipped proof
 * that reports success is worse than no proof; absent locally → skip, loudly. Every precondition
 * in `apps/api/tests` goes through `skipUnless`, so no suite can invent a quiet third way.
 */

const env = loadInvariantsEnv();
export const databaseUrl = env.DATABASE_URL ?? env.DATABASE_ADMIN_URL ?? '';
export const adminUrl = env.DATABASE_ADMIN_URL ?? databaseUrl;

/**
 * Fail CLOSED under CI, as the invariants do: a skipped proof that reports success is worse than
 * no proof. CI migrates the database before these run; a local run gets its `.env.local` from
 * `vitest.config.mts`. Returns whether the suite must skip.
 */
export function skipWithoutDatabase(proof: string, unproven: string): boolean {
  return skipUnless(databaseUrl !== '', proof, `no DATABASE_URL/DATABASE_ADMIN_URL. ${unproven}`);
}

/**
 * The ONE shape a proof's precondition takes: present → run; absent under CI → THROW, because a
 * skipped proof that reports success is worse than no proof; absent locally → skip, loudly.
 * Every precondition goes through here so no suite can invent a quiet third way.
 */
export function skipUnless(present: boolean, proof: string, unproven: string): boolean {
  if (present) return false;
  if (env.CI) throw new Error(`${proof} NOT RUN under CI: ${unproven}`);
  console.warn(`SKIP ${proof}: ${unproven}`);
  return true;
}
