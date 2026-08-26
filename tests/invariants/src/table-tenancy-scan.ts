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

  // An auth provider owns and migrates these. They are keyed by its own identity
  // model, accessed by its own DB role, and deliberately exempt from app RLS (docs/engineering/08 §2).
  // They are absent until the auth module lands its first migration, which is why the
  // stale-entry check below only warns.
  //
  // ⚠ THE LAST THREE ARE PROVISIONAL — do NOT inherit them into the first auth migration
  // without the owner ruling. `packages/contracts/CLAUDE.md` (Track 5a, later record) says
  // HelioGrid owns tenants, MEMBERSHIPS and roles; these entries say the provider does. If
  // HelioGrid owns memberships, `member` is a tenant-owned table that must carry tenant_id
  // and sit under RLS — and exempting it here would be a silent tenancy bypass on the one
  // table that maps a person to a tenant. Whether Better Auth is adopted at all, and whether
  // its organization plugin is used, is the deferred Track 5b decision.
  // Recorded as conflicts.md row 13. Nothing is mis-enforced today: 0 application tables.
  user: 'auth-provider internal',
  session: 'Better Auth internal',
  account: 'Better Auth internal',
  verification: 'Better Auth internal',
  jwks: 'Better Auth internal (jwt plugin)',
  organization:
    'PROVISIONAL (conflicts.md #13) — provider-internal ONLY if the organization plugin is adopted; ownership of tenants is contested',
  member:
    'PROVISIONAL (conflicts.md #13) — contested: if HelioGrid owns memberships this is tenant-owned and must NOT be exempt',
  invitation:
    'PROVISIONAL (conflicts.md #13) — unused either way; phone invites are ours, in `invites`',
};

/**
 * UNIQUE indexes on a tenant table that deliberately do NOT lead with tenant_id, by index name
 * with a written reason. Empty today — migration 0003 scoped every one of them.
 */
const GLOBAL_UNIQUES: Record<string, string> = {
  users_phone_e164_key:
    'users: "login identity; unique global (auth owns verification)". One phone is ' +
    'one platform identity — Better Auth verifies the number, so the same person cannot hold ' +
    'two accounts. Contrast customers.phone_e164, which is correctly (tenant_id, phone_e164) ' +
    'because two EPCs may legitimately serve the same homeowner.',
  invites_token_hash_key:
    'the invite token is looked up BEFORE any tenant context exists — the recipient follows a ' +
    'link and is not yet authenticated — so the hash must be globally unique to resolve at all.',
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
        where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
          and n.nspname not like 'pg\\_temp%' and n.nspname not like 'pg\\_toast%'
          and c.relkind in ('r', 'p')
          and not exists (select 1 from pg_inherits i where i.inhrelid = c.oid)
        order by c.relname`
    ).map((r) => r.table_name);

    assert(tables.length > 0, 'found base tables in public (is the database migrated?)');

    const withTenant = new Set(
      (
        await sql<{ table_name: string }[]>`
          -- pg_attribute, not information_schema.columns: that view is PRIVILEGE-FILTERED, so
          -- a table the connecting role cannot see simply vanishes from the completeness
          -- oracle — and this check exists to prove completeness. tenancy-rls.ts was rewritten
          -- off information_schema for the same reason; both halves now read the catalog the
          -- same way.
          select c.relname as table_name
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id'
            and a.attnum > 0 and not a.attisdropped
          where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
            and c.relkind in ('r', 'p')`
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

    // A GLOBAL_TABLES entry exempts a table from tenancy; it must therefore be UNREACHABLE by
    // the RLS-subject roles, or the exemption is just a hole with a comment on it. The eight
    // Better Auth tables have RLS off and zero policies by design (they are keyed by its own
    // identity model) — what makes that safe is that app_user cannot touch them, and nothing
    // asserted it. Armed tables are exempt from this rule: `tenants` protects itself.
    const reachableGlobals = await sql<{ table_name: string; grantee: string }[]>`
      select c.relname as table_name, sub.rolname as grantee
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral (
        select r.rolname from pg_roles r
        where pg_has_role(r.rolname, 'app_user', 'MEMBER')
          and not r.rolbypassrls and not r.rolsuper and r.rolname not like 'pg\\_%'
      ) as sub
      where c.relname = any(${Object.keys(GLOBAL_TABLES)})
        and not c.relrowsecurity
        and has_any_column_privilege(sub.rolname, c.oid, 'SELECT')`;
    assert(
      reachableGlobals.length === 0,
      `${reachableGlobals.length} table(s) are exempt from tenancy AND readable by an ` +
        'RLS-subject role — the exemption is only safe while they are unreachable:\n' +
        reachableGlobals.map((g) => `  - ${g.table_name} readable by ${g.grantee}`).join('\n') +
        '\n\n  Either revoke the grant, or arm the table with RLS and remove it from ' +
        'GLOBAL_TABLES.',
    );

    // Every UNIQUE key on a tenant table must LEAD WITH tenant_id — otherwise it is global,
    // and tenant B cannot create a row whose natural key tenant A already used. Migration 0003
    // exists solely to repair that (`0003_tenant_scope_global_uniques`), and nothing prevented
    // the next module reintroducing it. A catalog question, cheap and exact.
    const globalUniques = await sql<{ table_name: string; index_name: string }[]>`
      select c.relname as table_name, i.relname as index_name
      from pg_index x
      join pg_class c on c.oid = x.indrelid
      join pg_class i on i.oid = x.indexrelid
      join pg_namespace n on n.oid = c.relnamespace
      where x.indisunique
        -- NOT primary keys: a surrogate uuid id PK is globally unique BY DESIGN and that is
        -- correct. 0003's actual target was natural-key uniques (usage_events.idempotency_key,
        -- sync_mutations.mutation_id) — the ones where tenant B is blocked by tenant A's value.
        -- (No backticks in this template literal: one terminates the string. Cost 2 debugs.)
        and not x.indisprimary
        -- Partition children inherit their parent's keys; the parent is checked once.
        and not exists (select 1 from pg_inherits inh where inh.inhrelid = c.oid)
        and n.nspname not in ('pg_catalog', 'information_schema')
        and exists (select 1 from pg_attribute a
                    where a.attrelid = c.oid and a.attname = 'tenant_id' and a.attnum > 0)
        and not exists (select 1 from pg_attribute a
                        where a.attrelid = c.oid and a.attname = 'tenant_id'
                          and a.attnum = x.indkey[0])`;
    const offendingUniques = globalUniques.filter((u) => !(u.index_name in GLOBAL_UNIQUES));
    assert(
      offendingUniques.length === 0,
      `${offendingUniques.length} UNIQUE key(s) on a tenant table do not lead with tenant_id:\n` +
        offendingUniques.map((u) => `  - ${u.index_name} on ${u.table_name}`).join('\n') +
        '\n\n  A global unique means tenant B cannot use a value tenant A already took —\n' +
        '  cross-tenant information leakage AND a hard collision. Make it\n' +
        '  `unique (tenant_id, …)`, or add the index name to GLOBAL_UNIQUES in this file\n' +
        '  WITH THE REASON it is deliberately global. See migration 0003.',
    );

    const globals = tables.filter((t) => t in GLOBAL_TABLES).length;
    console.log(
      `table tenancy scan OK — ${tables.length} base tables: ${tables.length - globals} ` +
        `tenant-scoped, ${globals} justified global; every unique key on a tenant table ` +
        'leads with tenant_id',
    );
  } finally {
    await sql.end();
  }
}
