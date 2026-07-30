import postgres from 'postgres';

/**
 * Inverse tenancy scan — the other half of tenancy-rls.ts.
 *
 * tenancy-rls.ts scans for tables that ALREADY carry tenant_id and proves isolation on
 * those. Its only presence check is a count floor (`length >= 7`), so a table created
 * WITHOUT tenant_id never appears in the scan and escapes both the invariant and RLS
 * entirely. That made "every tenant-owned table carries tenant_id" prose wearing a
 * mechanical costume.
 *
 * This proves the complement: every base table in `public` either carries tenant_id or is
 * justified below. There is no third option.
 */

/**
 * Tables that are genuinely global. Each needs a WRITTEN reason — a silent entry here is
 * indistinguishable from a table that slipped through.
 */
const GLOBAL_TABLES: Record<string, string> = {
  tenants: 'the tenant registry itself — RLS restricts it to the caller’s own row',
  schema_migrations: 'the migration ledger; server-internal, sha256-locked by the runner',

  // Better Auth owns and migrates these (docs/04 §1). They are keyed by its own identity
  // model, accessed by its own DB role, and deliberately exempt from app RLS (docs/08 §2).
  // They are absent until `pnpm --filter @heliogrid/api exec tsx src/scripts/auth-migrate.ts`
  // has run, which is why the stale-entry check below only warns.
  user: 'Better Auth internal (docs/04 §1)',
  session: 'Better Auth internal',
  account: 'Better Auth internal',
  verification: 'Better Auth internal',
  organization: 'Better Auth internal — tenants.id IS organization.id',
  member: 'Better Auth internal',
  invitation: 'Better Auth internal (unused; phone invites are ours, in `invites`)',
  jwks: 'Better Auth internal (jwt plugin)',
};

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`table-tenancy: ${msg}`);
}

export async function runTableTenancyScan(adminUrl: string) {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    // Base tables and partitioned parents only. Partition CHILDREN are excluded via
    // pg_inherits: they inherit the parent's columns and policies, so scanning them would
    // double-report audit_log_* and usage_events_*.
    const tables = (
      await sql<{ table_name: string }[]>`
        select c.relname as table_name
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind in ('r', 'p')
          and not exists (select 1 from pg_inherits i where i.inhrelid = c.oid)
        order by c.relname`
    ).map((r) => r.table_name);

    assert(tables.length > 0, 'found base tables in public (is the database migrated?)');

    const withTenant = new Set(
      (
        await sql<{ table_name: string }[]>`
          select table_name from information_schema.columns
          where table_schema = 'public' and column_name = 'tenant_id'`
      ).map((r) => r.table_name),
    );

    const offenders = tables.filter((t) => !withTenant.has(t) && !(t in GLOBAL_TABLES));

    if (offenders.length) {
      throw new Error(
        `${offenders.length} table(s) carry neither tenant_id nor a global justification:\n` +
          `  - ${offenders.join('\n  - ')}\n\n` +
          '  Add tenant_id (plus a composite index leading with it, a fail-closed RLS policy\n' +
          '  for app_user, and explicit grants) — or, if the table is genuinely global, add it\n' +
          '  to GLOBAL_TABLES in this file WITH THE REASON. A table that escapes tenancy is\n' +
          '  readable across every tenant.',
      );
    }

    // Guard the allowlist against rot: an entry for a table that does not exist hides the
    // fact that nobody has revisited these exemptions. A warning, not a failure — Better
    // Auth's tables are legitimately absent until its own migrator has run.
    const stale = Object.keys(GLOBAL_TABLES).filter((t) => !tables.includes(t));
    if (stale.length) {
      console.warn(
        `table-tenancy: GLOBAL_TABLES lists ${stale.length} table(s) not present in this ` +
          `database — expected if the owning migrator has not run: ${stale.join(', ')}`,
      );
    }

    const globals = tables.filter((t) => t in GLOBAL_TABLES).length;
    console.log(
      `table tenancy scan OK — ${tables.length} base tables: ${tables.length - globals} ` +
        `tenant-scoped, ${globals} justified global`,
    );
  } finally {
    await sql.end();
  }
}
