import { loadInvariantsEnv } from '@heliogrid/env/server';
import { runEnumParity } from './enum-parity';
import { runSchemaParity } from './schema-parity';
import { runTableTenancyScan } from './table-tenancy-scan';
import { runTenancyInvariants } from './tenancy-rls';
import { runTenantIdInBody } from './tenant-id-in-body';

/**
 * Locked invariant runner. Sets: tenancy (live), enum parity (live), money (lands with the
 * proposal module), billing (lands with the billing module), migrations (Track A).
 * Requires a migrated database via DATABASE_URL/DATABASE_ADMIN_URL; skips LOUDLY when
 * absent (CI always provides one — see .github/workflows/ci.yml).
 */
async function main() {
  runTenantIdInBody(); // static — needs no database, must never be skipped
  const env = loadInvariantsEnv();
  const url = env.DATABASE_ADMIN_URL ?? env.DATABASE_URL;
  if (!url) {
    // Fail CLOSED in CI: a skipped invariant that reports success is worse than no
    // invariant at all — that is exactly how the tenancy gate went unexecuted for the
    // whole of the foundation phase, and again until 2026-07-31 because nothing loaded .env.local.
    if (env.CI) {
      throw new Error(
        'INVARIANTS NOT RUN: DATABASE_URL/DATABASE_ADMIN_URL missing under CI. ' +
          'Check the `env` list on turbo.json’s test task — Turborepo strict env mode ' +
          'strips undeclared variables.',
      );
    }
    console.warn('SKIP invariants: DATABASE_URL/DATABASE_ADMIN_URL not set (local run only)');
    return;
  }
  const empty = await isGreenfield(url);
  if (empty) {
    // Not a gate — the database is LEGITIMATELY empty after the 2026-08-01 teardown
    // (ADR-0024). But a green run below must never read as "tenancy is proven", which is
    // exactly how the tenancy gate went unexecuted for the whole foundation phase.
    console.warn(
      '\n  INVARIANTS VACUOUS: 0 application tables. Tenancy, table scoping, enum parity and\n' +
        '  schema parity all have nothing to compare, so their passing below means NOTHING.\n' +
        "  Real coverage returns with the auth + tenancy module's first migration.\n",
    );
  }
  await runTenancyInvariants(url);
  await runTableTenancyScan(url);
  await runEnumParity(url);
  await runSchemaParity(url);
  console.log(empty ? 'invariants green (vacuously — see the banner above)' : 'invariants green');
}

/** Application tables only: the migration ledger is bookkeeping, not schema. */
async function isGreenfield(url: string): Promise<boolean> {
  const sql = (await import('postgres')).default(url, { max: 1, onnotice: () => {} });
  try {
    const [row] = await sql<{ n: number }[]>`
      select count(*)::int as n from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and c.relname <> 'schema_migrations'`;
    return (row?.n ?? 0) === 0;
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('INVARIANT FAILURE');
  console.error(err);
  process.exit(1);
});
