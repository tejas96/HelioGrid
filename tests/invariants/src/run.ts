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
  const { tables, hasRlsSubjectRole } = await inspectDatabase(url);
  const empty = tables === 0;

  /*
   * NEVER MIGRATED — no tables AND no `app_user`. Every db-backed invariant below reaches for
   * that role by name (`pg_has_role(…, 'app_user', …)` in three files), and postgres raises
   * 42704 when it does not exist, so they cannot run at all rather than running vacuously.
   *
   * This is CI on a fresh service container: the teardown deleted migration 0004,
   * which created the role. Roles are CLUSTER-wide, so a long-lived dev database still has it
   * and this whole condition is invisible locally — which is why main went red on 2026-08-01
   * and stayed red while local runs looked green.
   *
   * Tables WITHOUT the role is a different thing entirely — a broken database, not a
   * greenfield one — and `runTenancyInvariants` still fails closed on it.
   */
  if (empty && !hasRlsSubjectRole) {
    console.warn(
      '\n  INVARIANTS NOT RUN: the database was never migrated — 0 application tables and no\n' +
        '  app_user role (greenfield since 2026-08-01). NOTHING is proven here:\n' +
        '  not tenancy, not table scoping, not enum or schema parity. Real coverage returns\n' +
        "  with the auth + tenancy module's first migration, which re-creates the role.\n",
    );
    return;
  }

  if (empty) {
    // Not a gate — the database is LEGITIMATELY empty after the 2026-08-01 teardown
    // But a green run below must never read as "tenancy is proven", which is
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

/**
 * What this database actually has, before anything assumes it. Application tables only —
 * the migration ledger is bookkeeping, not schema — plus whether the RLS-subject role the
 * invariants query by name exists at all.
 */
async function inspectDatabase(
  url: string,
): Promise<{ tables: number; hasRlsSubjectRole: boolean }> {
  const sql = (await import('postgres')).default(url, { max: 1, onnotice: () => {} });
  try {
    const [row] = await sql<{ n: number }[]>`
      select count(*)::int as n from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and c.relname <> 'schema_migrations'`;
    const [role] = await sql<{ n: number }[]>`
      select count(*)::int as n from pg_roles where rolname = 'app_user'`;
    return { tables: row?.n ?? 0, hasRlsSubjectRole: (role?.n ?? 0) > 0 };
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('INVARIANT FAILURE');
  console.error(err);
  process.exit(1);
});
