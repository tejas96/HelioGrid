import { loadInvariantsEnv } from '@heliogrid/env/server';
import { runEnumParity } from './enum-parity';
import { runFormatInvariants } from './format-rendering';
import { runSchemaParity } from './schema-parity';
import { runTableTenancyScan } from './table-tenancy-scan';
import { runTenancyInvariants } from './tenancy-rls';
import { runTenantIdInBody } from './tenant-id-in-body';

/**
 * Locked invariant runner. Sets: tenancy (live), table scoping (live), enum parity (live),
 * schema parity (live), tenant-id-in-body (static), format rendering (static, F3-19…F3-24).
 * Requires a migrated database via DATABASE_URL/DATABASE_ADMIN_URL; skips LOUDLY when
 * absent (CI always provides one — see .github/workflows/ci.yml).
 */
async function main() {
  runTenantIdInBody(); // static — needs no database, must never be skipped
  runFormatInvariants(); // static — the format layer needs no database either
  const env = loadInvariantsEnv();
  const url = env.DATABASE_ADMIN_URL ?? env.DATABASE_URL;
  if (!url) {
    // Fail CLOSED in CI: a skipped invariant that reports success is worse than no
    // invariant at all — that is exactly how the tenancy gate went unexecuted for the
    // whole of the foundation phase, and again because nothing loaded .env.local.
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
  const { tables, tenantTables, hasRlsSubjectRole } = await inspectDatabase(url);

  /*
   * NEVER PROVISIONED — no application table AND no `app_user`. Every db-backed invariant below
   * reaches for that role by name (`pg_has_role(…, 'app_user', …)`), and postgres raises 42704
   * when it does not exist, so they cannot run at all rather than running vacuously.
   *
   * Roles are CLUSTER objects from infra/postgres/init/01-roles.sql: a local database has them
   * from its first boot, and CI runs that file before it migrates. Tables WITHOUT the role is a
   * different thing entirely — a broken database, not an unprovisioned one — and the scan below
   * fails on it rather than skipping.
   */
  if (tables === 0 && !hasRlsSubjectRole) {
    console.warn(
      '\n  INVARIANTS NOT RUN: the database was never provisioned or migrated — 0 application\n' +
        '  tables and no app_user role. NOTHING is proven here: not tenancy, not table\n' +
        '  scoping, not enum or schema parity. Run infra/postgres/init/01-roles.sql, then\n' +
        '  migrate.\n',
    );
    return;
  }

  if (tenantTables === 0) {
    // A tenant table is one that carries tenant_id. Global reference data (the market pack)
    // is migrated before any tenant table exists, and it IS inspected below — but a green
    // tenancy run over zero tenant tables must never read as "isolation is proven".
    console.warn(
      '\n  TENANCY VACUOUS: no table carries tenant_id yet, so cross-tenant isolation has\n' +
        '  nothing to compare and its passing below means NOTHING. The global reference\n' +
        '  tables ARE inspected — readable-global grants and the schema mirror are proven,\n' +
        "  tenancy is not. Isolation coverage returns with the identity spine's migration.\n",
    );
  }
  await runTenancyInvariants(url);
  await runTableTenancyScan(url);
  await runEnumParity(url);
  await runSchemaParity(url);
  console.log(
    tenantTables === 0
      ? 'invariants green — tenancy vacuously (see the banner above)'
      : 'invariants green',
  );
}

/**
 * What this database actually has, before anything assumes it: application tables (the
 * migration ledger is bookkeeping, not schema), how many of them are tenant tables, and whether
 * the RLS-subject role the invariants query by name exists at all.
 */
async function inspectDatabase(
  url: string,
): Promise<{ tables: number; tenantTables: number; hasRlsSubjectRole: boolean }> {
  const sql = (await import('postgres')).default(url, { max: 1, onnotice: () => {} });
  try {
    const [row] = await sql<{ tables: number; tenant_tables: number }[]>`
      select count(*)::int as tables,
             count(*) filter (where exists (
               select 1 from pg_attribute a
               where a.attrelid = c.oid and a.attname = 'tenant_id'
                 and a.attnum > 0 and not a.attisdropped))::int as tenant_tables
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and c.relname <> 'schema_migrations'`;
    const [role] = await sql<{ n: number }[]>`
      select count(*)::int as n from pg_roles where rolname = 'app_user'`;
    return {
      tables: row?.tables ?? 0,
      tenantTables: row?.tenant_tables ?? 0,
      hasRlsSubjectRole: (role?.n ?? 0) > 0,
    };
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('INVARIANT FAILURE');
  console.error(err);
  process.exit(1);
});
