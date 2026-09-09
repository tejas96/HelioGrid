import postgres from 'postgres';

/**
 * Inverse tenancy scan — the other half of tenancy-rls.ts.
 *
 * tenancy-rls.ts scans for tables that ALREADY carry tenant_id and proves isolation on
 * those. Its only presence check is a count floor, so a table created WITHOUT tenant_id never
 * appears in the scan and escapes both the invariant and RLS entirely. That made "every
 * tenant-owned table carries tenant_id" prose wearing a mechanical costume.
 *
 * This proves the complement: every base table in `public` either carries tenant_id or is
 * justified below, in one of exactly two global categories. There is no fourth option.
 */

/**
 * Platform tables: genuinely global, and either UNREACHABLE by any RLS-subject role or ARMED —
 * RLS enabled and forced with a canonical policy, which `rls-armed.ts` proves. Each needs a
 * WRITTEN reason — a silent entry here is indistinguishable from a table that slipped through.
 * The reachability check below skips an armed table, because its policy is what confines it.
 */
const GLOBAL_TABLES: Record<string, string> = {
  tenant:
    'the tenant registry itself — ARMED: RLS restricts it to the caller’s own row; a new tenant ' +
    'is written on the admin path only, because signup crosses tenancy (T-M01-025)',
  user_account:
    'the global platform account, keyed by phone — ARMED: RLS shows a row only to a tenant ' +
    'that holds a membership on it; every write runs on the admin path (T-M01-025)',
  otp_challenge:
    'a sign-in code keyed to a phone before any account exists — unreachable, the admin path ' +
    'alone reads and writes it (T-M01-025)',
  session:
    'a device session, the refresh grant — unreachable, the admin path alone; the token every ' +
    'call carries is verified, never looked up (T-M01-025)',
  schema_migrations: 'the migration ledger; server-internal, sha256-locked by the runner',
};

/**
 * Readable global reference data: no tenant_id, no RLS, SELECT held by every RLS-subject role
 * and NO write privilege — INSERT, UPDATE, DELETE and TRUNCATE all absent. Every tenant reads
 * its market's pack and none writes it; the publish command on the admin path is the only
 * writer (`F1-12`). Same rule as GLOBAL_TABLES: a reason, or the entry is a hole.
 */
const GLOBAL_READABLE_TABLES: Record<string, string> = {
  market_pack:
    'the market registry: the versioned unit of a market’s configuration and the source of a ' +
    'tenant’s market (F1-01); every tenant reads it, the publish command alone writes it',
  market_pack_version:
    'one published, dated pack revision as ONE jsonb payload (F1-11); pinned by every priced ' +
    'output, superseded and never deleted, written only by the publish command',
};

/**
 * UNIQUE indexes on a tenant table that deliberately do NOT lead with tenant_id, by index name
 * with a written reason. Empty: an exemption is listed by its real index name in the change
 * that lands the table, never ahead of it. The shape a reason takes: a login phone is one
 * platform identity, so its unique is global; a customer phone is (tenant_id, phone), because
 * two EPCs may legitimately serve the same homeowner.
 */
const GLOBAL_UNIQUES: Record<string, string> = {
  invitation_token_hash_key:
    'the hash of the secret in an invite link: the landing resolves a link before any tenant is ' +
    'known, and the secret is 32 random bytes, so no two tenants can meet on it (T-M01-028)',
};

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`table-tenancy: ${msg}`);
}

/**
 * The readable-global category, from the catalog: for every listed table that exists, RLS is
 * off, and every RLS-subject role — members of app_user without BYPASSRLS, derived rather than
 * spelled — holds SELECT and holds no write. Column-level for INSERT and UPDATE, because a
 * `grant insert (pack)` is a complete write the table-level question answers false for.
 */
async function assertReadableGlobals(sql: postgres.Sql): Promise<number> {
  const listed = Object.keys(GLOBAL_READABLE_TABLES);
  const problems = await sql<{ table_name: string; problem: string }[]>`
    select distinct c.relname as table_name, p.problem
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral (
      select r.rolname from pg_roles r
      where pg_has_role(r.rolname, 'app_user', 'MEMBER')
        and not r.rolbypassrls and not r.rolsuper and r.rolname not like 'pg\\_%'
    ) as sub
    cross join lateral (values
      ('RLS is enabled — readable reference data carries no policy', c.relrowsecurity),
      ('SELECT is not held by ' || sub.rolname,
        not has_table_privilege(sub.rolname, c.oid, 'SELECT')),
      ('INSERT is held by ' || sub.rolname,
        has_any_column_privilege(sub.rolname, c.oid, 'INSERT')),
      ('UPDATE is held by ' || sub.rolname,
        has_any_column_privilege(sub.rolname, c.oid, 'UPDATE')),
      ('DELETE is held by ' || sub.rolname, has_table_privilege(sub.rolname, c.oid, 'DELETE')),
      ('TRUNCATE is held by ' || sub.rolname,
        has_table_privilege(sub.rolname, c.oid, 'TRUNCATE'))
    ) as p(problem, failed)
    where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
      and c.relkind in ('r', 'p')
      and c.relname = any(${listed})
      and p.failed
    order by c.relname, p.problem`;
  assert(
    problems.length === 0,
    `${problems.length} readable-global violation(s) — reference data is SELECT for every ` +
      'RLS-subject role and nothing else, with no RLS:\n' +
      problems.map((p) => `  - ${p.table_name}: ${p.problem}`).join('\n') +
      '\n\n  A write privilege here lets a tenant role rewrite what every tenant prices on;\n' +
      '  revoke it — the admin path is the only writer. RLS here would either deny every\n' +
      '  read or need a policy that keys on nothing.',
  );
  const [present] = await sql<{ n: number }[]>`
    select count(*)::int as n from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname = any(${listed})`;
  return present?.n ?? 0;
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
          -- oracle — and this check exists to prove completeness. tenancy-rls.ts reads the
          -- catalog the same way, so the two halves cannot disagree about what a table is.
          select c.relname as table_name
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id'
            and a.attnum > 0 and not a.attisdropped
          where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
            and c.relkind in ('r', 'p')`
      ).map((r) => r.table_name),
    );

    // Object.hasOwn, never `in`: `in` walks Object.prototype, so a table named `constructor`
    // would read as justified.
    const justified = (t: string) =>
      Object.hasOwn(GLOBAL_TABLES, t) || Object.hasOwn(GLOBAL_READABLE_TABLES, t);
    const offenders = tables.filter((t) => !withTenant.has(t) && !justified(t));

    if (offenders.length) {
      throw new Error(
        `${offenders.length} table(s) carry neither tenant_id nor a global justification:\n` +
          `  - ${offenders.join('\n  - ')}\n\n` +
          '  Add tenant_id (plus a composite index leading with it, a fail-closed RLS policy\n' +
          '  for app_user, and explicit grants) — or, if the table is genuinely global, add it\n' +
          '  to GLOBAL_TABLES (unreachable) or GLOBAL_READABLE_TABLES (SELECT only) in this\n' +
          '  file WITH THE REASON. A table that escapes tenancy is readable across every tenant.',
      );
    }

    // Guard the allowlists against rot: an entry for a table that does not exist hides the
    // fact that nobody has revisited these exemptions. A warning, not a failure — an entry
    // is legitimately absent until the migration that owns its table has run.
    const stale = [...Object.keys(GLOBAL_TABLES), ...Object.keys(GLOBAL_READABLE_TABLES)].filter(
      (t) => !tables.includes(t),
    );
    if (stale.length) {
      console.warn(
        `table-tenancy: the global lists name ${stale.length} table(s) not present in this ` +
          `database — expected until the migration that owns it has run: ${stale.join(', ')}`,
      );
    }

    // A GLOBAL_TABLES entry exempts a table from tenancy; it must therefore be UNREACHABLE by
    // the RLS-subject roles, or the exemption is just a hole with a comment on it. An ARMED
    // table is exempt from this rule — `tenant` and `user_account` protect themselves, and
    // tenancy-rls.ts proves their policies are the canonical ones.
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

    const readable = await assertReadableGlobals(sql);

    // Every UNIQUE key on a tenant table must LEAD WITH tenant_id — otherwise it is global,
    // and tenant B cannot create a row whose natural key tenant A already used. Nothing but
    // this stops a module introducing one. A catalog question, cheap and exact.
    const globalUniques = await sql<{ table_name: string; index_name: string }[]>`
      select c.relname as table_name, i.relname as index_name
      from pg_index x
      join pg_class c on c.oid = x.indrelid
      join pg_class i on i.oid = x.indexrelid
      join pg_namespace n on n.oid = c.relnamespace
      where x.indisunique
        -- NOT primary keys: a surrogate uuid id PK is globally unique BY DESIGN and that is
        -- correct. The target is natural-key uniques (an idempotency key, a mutation id) — the
        -- ones where tenant B is blocked by tenant A's value.
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
    const offendingUniques = globalUniques.filter(
      (u) => !Object.hasOwn(GLOBAL_UNIQUES, u.index_name),
    );
    assert(
      offendingUniques.length === 0,
      `${offendingUniques.length} UNIQUE key(s) on a tenant table do not lead with tenant_id:\n` +
        offendingUniques.map((u) => `  - ${u.index_name} on ${u.table_name}`).join('\n') +
        '\n\n  A global unique means tenant B cannot use a value tenant A already took —\n' +
        '  cross-tenant information leakage AND a hard collision. Make it\n' +
        '  `unique (tenant_id, …)`, or add the index name to GLOBAL_UNIQUES in this file\n' +
        '  WITH THE REASON it is deliberately global.',
    );

    // An armed platform table carries RLS; the rest of GLOBAL_TABLES is unreachable.
    const [armedRow] = await sql<{ n: number }[]>`
      select count(*)::int as n from pg_class c
      where c.relname = any(${Object.keys(GLOBAL_TABLES)}) and c.relrowsecurity`;
    const armed = armedRow?.n ?? 0;
    const unreachable = tables.filter((t) => Object.hasOwn(GLOBAL_TABLES, t)).length - armed;
    const tenantScoped = tables.length - unreachable - armed - readable;
    console.log(
      `table tenancy scan OK — ${tables.length} base tables: ${tenantScoped} tenant-scoped, ` +
        `${armed} armed platform, ${unreachable} unreachable global, ${readable} readable ` +
        'global (SELECT only, no RLS); every unique key on a tenant table leads with tenant_id',
    );
  } finally {
    await sql.end();
  }
}
