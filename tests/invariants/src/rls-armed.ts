import type postgres from 'postgres';

/**
 * Catalog half of the tenancy invariant — is RLS actually ARMED?
 *
 * Its own file because it proves a different thing from tenancy-rls.ts. That file proves
 * BEHAVIOUR (tenant A's session cannot read or write tenant B's rows) and can only prove it
 * where tenant B actually HAS rows — the runner seeds `tenants` and `users` only, so on every
 * other table its `count(*) where tenant_id = B` is 0 because the table is empty, true no
 * matter what RLS does. This file proves the MECHANISM from pg_catalog, which does not care
 * whether a table has rows.
 *
 * Four bypasses are covered here, each of which passed a green suite at some point:
 *   1. a table with no RLS at all (a new module migration that forgets it)
 *   2. a policy that does not key on the tenant (`using (true)`, or one that merely MENTIONS
 *      app.tenant_id — `using (current_setting('app.tenant_id', true) is not null)` reads
 *      plausible, keys on nothing, and leaks everything)
 *   3. a grant on a partition CHILD, which has its own (absent) RLS
 *   4. a view or SECURITY DEFINER function that reads an armed table as its superuser owner
 */

/**
 * The policy expressions this schema is allowed to use, EXACTLY as Postgres renders them
 * back. A whitelist, not a substring search: `like '%app.tenant_id%'` is a blacklist that can
 * only reject shapes someone already thought of, and it accepted
 * `using (current_setting('app.tenant_id', true) is not null)` — which mentions the token,
 * keys on nothing, and leaks every tenant while the gate printed "tenant-keyed policy".
 *
 * A new policy shape must be added HERE, deliberately, with a reason — the same discipline
 * GLOBAL_TABLES already imposes in table-tenancy-scan.ts.
 */
const CANONICAL_POLICY_EXPRESSIONS: Record<string, string> = {
  "(tenant_id = (NULLIF(current_setting('app.tenant_id'::text, true), ''::text))::uuid)":
    'the standard tenant-scoped table policy (migration 0001)',
  "(id = (NULLIF(current_setting('app.tenant_id'::text, true), ''::text))::uuid)":
    'the tenants registry, which is keyed by id rather than tenant_id (migration 0001)',
};

/**
 * SECURITY DEFINER functions in `public`, each with a written reason. Empty today.
 *
 * Every table is owned by a SUPERUSER, and 0005 records that FORCE cannot restrain one. A
 * SECURITY DEFINER function therefore reads through RLS entirely. plans exactly
 * such a path for public customer-link reads, so this list exists before that module does.
 */
const SECURITY_DEFINER_ALLOWED: Record<string, string> = {};

/**
 * Views and materialized views exempt from the RLS-bypass check, each with a written reason.
 * Empty today. Extension-owned relations do NOT need an entry — they are excluded structurally
 * via pg_depend, because this repo can neither own nor ALTER them.
 */
const VIEWS_ALLOWED: Record<string, string> = {};

/**
 * Which schemas hold application relations. NOT `= 'public'`.
 *
 * Every query in this file and in tenancy-rls.ts was hard-scoped to `public`, so a module that
 * created its tables in its own schema — an ordinary Postgres pattern, and one Law 9's
 * module-owns-its-migration rule invites — got no RLS check whatsoever while the suite printed
 * "tenancy invariants OK". Excluding the system schemas instead means a new schema is covered
 * the day it is created rather than the day someone remembers to add it to a list.
 */
const appSchemas = (sql: postgres.Sql) => sql`
  n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
  and n.nspname not like 'pg\\_temp%' and n.nspname not like 'pg\\_toast%'`;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`rls-armed: ${msg}`);
}

type RelRow = {
  table_name: string;
  rls_enabled: boolean;
  rls_forced: boolean;
};

type PolicyRow = {
  table_name: string;
  polname: string;
  polcmd: string;
  qual: string | null;
  withcheck: string | null;
};

type ChildGrantRow = { child: string; parent: string; privilege: string; grantee: string };
type ViewRow = { relname: string; relkind: string; security_invoker: boolean };
type SecDefRow = { proname: string };

/**
 * Which expression governs a policy depends on its command, and getting this wrong makes the
 * gate reject CORRECT configurations — the failure mode that teaches people to weaken gates.
 *
 * An INSERT policy (`polcmd = 'a'`) carries only WITH CHECK; its `polqual` is NULL by
 * construction, so treating NULL-qual as unkeyed rejects the textbook
 * `for select` + `for insert` + `for update` split. That split is exactly right for the
 * append-only ledgers, which hold select+insert grants only.
 */
function unkeyedReason(p: PolicyRow): string | undefined {
  // Object.hasOwn, never `in`: `in` walks Object.prototype, so a policy expression that
  // rendered as `constructor` or `toString` would be accepted as canonical and leak everything.
  const ok = (e: string | null) => e !== null && Object.hasOwn(CANONICAL_POLICY_EXPRESSIONS, e);

  if (p.polcmd === 'a') {
    return ok(p.withcheck)
      ? undefined
      : `INSERT policy "${p.polname}" WITH CHECK is ${p.withcheck ?? 'absent'}`;
  }
  if (!ok(p.qual)) return `policy "${p.polname}" USING is ${p.qual ?? 'absent'}`;
  // A non-null WITH CHECK on a read/write/all policy governs writes and must key too.
  if (p.withcheck !== null && !ok(p.withcheck)) {
    return `policy "${p.polname}" WITH CHECK is ${p.withcheck}`;
  }
  return undefined;
}

export async function assertRlsArmed(sql: postgres.Sql, tables: string[]) {
  const rels = await sql<RelRow[]>`
    select c.relname as table_name,
           c.relrowsecurity as rls_enabled,
           c.relforcerowsecurity as rls_forced
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where ${appSchemas(sql)} and c.relname = any(${tables})`;
  const byName = new Map(rels.map((r) => [r.table_name, r]));

  const policies = await sql<PolicyRow[]>`
    select c.relname as table_name, p.polname, p.polcmd::text as polcmd,
           pg_get_expr(p.polqual, p.polrelid) as qual,
           pg_get_expr(p.polwithcheck, p.polrelid) as withcheck
    from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where ${appSchemas(sql)} and c.relname = any(${tables})`;

  for (const table of tables) {
    const r = byName.get(table);
    assert(r, `${table}: present in pg_class (RLS state readable)`);
    assert(
      r.rls_enabled,
      `${table}: RLS ENABLED — 'alter table ${table} enable row level security'`,
    );
    assert(
      r.rls_forced,
      `${table}: RLS FORCED — 'alter table ${table} force row level security' (see 0005)`,
    );

    const own = policies.filter((p) => p.table_name === table);
    assert(
      own.length > 0,
      `${table}: has an RLS policy — enabled with no policy denies all, which someone then "fixes" with using(true)`,
    );
    // EVERY policy, because permissive policies OR together: one unkeyed policy defeats the rest.
    for (const p of own) {
      const bad = unkeyedReason(p);
      assert(
        !bad,
        `${table}: ${bad}. Tenant policies must render EXACTLY as one of:\n` +
          Object.keys(CANONICAL_POLICY_EXPRESSIONS)
            .map((e) => `      ${e}`)
            .join('\n') +
          '\n      A new shape is a deliberate decision — add it to CANONICAL_POLICY_EXPRESSIONS\n' +
          '      in tests/invariants/src/rls-armed.ts with a reason. Do NOT loosen this check.',
      );
    }
  }
}

/**
 * Partition CHILDREN inherit columns from their parent — they do NOT inherit RLS.
 *
 * Postgres evaluates a direct child query against the CHILD's own settings, and every
 * audit_log_* / usage_events_* child here has relrowsecurity=false and zero policies. That is
 * safe ONLY while app_user holds no grant on any child, and nothing enforced that: a
 * retention or rollover migration doing `grant select on audit_log_2027_07 to app_user` is a
 * complete, silent tenancy bypass. So assert the grant is absent rather than assuming the
 * caller always goes through the parent.
 */
export async function assertPartitionChildrenUngranted(sql: postgres.Sql) {
  const rows = await sql<ChildGrantRow[]>`
    select child.relname as child, parent.relname as parent,
           priv.privilege, sub.rolname as grantee
    from pg_inherits i
    join pg_class child on child.oid = i.inhrelid
    join pg_class parent on parent.oid = i.inhparent
    join pg_namespace n on n.oid = child.relnamespace
    -- pg_inherits links partitioned INDEXES to their children too; without this the query
    -- asks has_table_privilege about an index, which is meaningless.
    cross join lateral (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'))
      as priv(privilege)
    -- EVERY RLS-subject role, derived — not the literal 'app_user'. app_user is NOLOGIN;
    -- production connects as app_runtime, which is a MEMBER of it, and a grant to app_runtime
    -- was completely invisible. Deriving the set means a future login role is covered the day
    -- it is created. app_admin and the owner are excluded because they hold BYPASSRLS/superuser
    -- by design (0004, 0005) — RLS was never restraining them and this check would be noise.
    cross join lateral (
      select r.rolname from pg_roles r
      where pg_has_role(r.rolname, 'app_user', 'MEMBER')
        and not r.rolbypassrls and not r.rolsuper and r.rolname not like 'pg\\_%'
    ) as sub
    where ${appSchemas(sql)}
      and child.relkind in ('r', 'p', 'f')
      -- SELECT/INSERT/UPDATE are column-grantable, so ask has_any_column_privilege: a
      -- COLUMN-level grant (grant select (tenant_id, action) on a child) is a complete
      -- cross-tenant read and the table-level question answers false for it. DELETE and
      -- TRUNCATE exist only at table level — has_any_column_privilege rejects them outright.
      and case when priv.privilege in ('DELETE', 'TRUNCATE')
               then has_table_privilege(sub.rolname, child.oid, priv.privilege)
               else has_any_column_privilege(sub.rolname, child.oid, priv.privilege) end`;

  assert(
    rows.length === 0,
    `an RLS-subject role holds a direct grant on ${rows.length} partition child(ren) — RLS ` +
      'does not inherit from the parent, so this reads across every tenant:\n' +
      rows
        .map((r) => `      ${r.privilege} on ${r.child} (child of ${r.parent}) to ${r.grantee}`)
        .join('\n') +
      '\n      Revoke it, or arm the child itself (enable + force + a keyed policy).',
  );
}

/**
 * Views and SECURITY DEFINER functions run as their OWNER. Every relation here is owned by a
 * superuser, which 0005 records that FORCE cannot restrain — so a view without
 * `security_invoker = true` reads every tenant's rows regardless of the caller's policies.
 */
export async function assertNoRlsBypassingRoutes(sql: postgres.Sql) {
  // Extension-owned relations are excluded: pg_stat_statements ships views this repo does not
  // own and cannot ALTER (docs/engineering/09 enables it), and a gate that is permanently red for something
  // nobody can fix is the pressure that gets gates weakened — the failure mode this whole audit
  // keeps finding. `pg_depend`/`pg_extension` is the honest test of "not ours".
  const views = await sql<ViewRow[]>`
    select c.relname, c.relkind::text as relkind,
           coalesce((select true from unnest(c.reloptions) o
                     where o = 'security_invoker=true' or o = 'security_invoker=on'), false)
             as security_invoker
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where ${appSchemas(sql)} and c.relkind in ('v', 'm')
      and not exists (select 1 from pg_depend d
                      where d.objid = c.oid and d.deptype = 'e')`;

  // MATERIALIZED views cannot carry security_invoker at all — Postgres rejects the ALTER — and
  // they store their rows, so the snapshot itself is cross-tenant. They need a different remedy
  // (don't materialize tenant data), so say that instead of prescribing an impossible statement.
  const leakyMat = views.filter(
    (v) => v.relkind === 'm' && !Object.hasOwn(VIEWS_ALLOWED, v.relname),
  );
  assert(
    leakyMat.length === 0,
    `${leakyMat.length} MATERIALIZED view(s) over tenant data: ` +
      `${leakyMat.map((v) => v.relname).join(', ')}.\n` +
      '      A matview cannot carry security_invoker — it STORES rows gathered as its owner, so\n' +
      '      RLS never applies to the snapshot. Either do not materialize tenant-scoped data,\n' +
      '      or add it to VIEWS_ALLOWED in this file WITH A REASON explaining what confines it.',
  );

  const leaky = views.filter(
    (v) => v.relkind === 'v' && !v.security_invoker && !Object.hasOwn(VIEWS_ALLOWED, v.relname),
  );
  assert(
    leaky.length === 0,
    `${leaky.length} view(s) lack security_invoker=true, so they read as their owner and RLS ` +
      `never applies: ${leaky.map((v) => v.relname).join(', ')}.\n` +
      '      `alter view <name> set (security_invoker = true)`, or add it to VIEWS_ALLOWED\n' +
      '      in this file WITH A REASON.',
  );

  const secdef = await sql<SecDefRow[]>`
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where ${appSchemas(sql)} and p.prosecdef`;

  const undeclared = secdef.filter((f) => !Object.hasOwn(SECURITY_DEFINER_ALLOWED, f.proname));
  assert(
    undeclared.length === 0,
    `${undeclared.length} SECURITY DEFINER function(s) in public are not declared: ` +
      `${undeclared.map((f) => f.proname).join(', ')}.\n` +
      '      Each runs as its superuser owner and bypasses RLS entirely. Add it to\n' +
      '      SECURITY_DEFINER_ALLOWED in tests/invariants/src/rls-armed.ts WITH A REASON.',
  );
}
