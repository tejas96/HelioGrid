import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import {
  assertNoRlsBypassingRoutes,
  assertPartitionChildrenUngranted,
  assertRlsArmed,
} from './rls-armed';

/**
 * Tenancy invariant (CLAUDE.md §Testing): with RLS on, tenant A's session cannot
 * read or write any tenant B row — generated over the schema (every table carrying
 * tenant_id), not hand-listed. Uses SET ROLE app_user to run under the RLS-subject role.
 */

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`tenancy: ${msg}`);
}

async function expectFail(p: Promise<unknown>, msg: string) {
  let failed = false;
  try {
    await p;
  } catch {
    failed = true;
  }
  assert(failed, msg);
}

export async function runTenancyInvariants(adminUrl: string) {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const userA = randomUUID();
  const userB = randomUUID();
  const suffix = tenantA.slice(0, 8);

  try {
    // app_user must not hold BYPASSRLS or superuser
    const roleRow =
      await sql`select rolbypassrls, rolsuper from pg_roles where rolname = 'app_user'`;
    assert(roleRow.length === 1, 'app_user role exists');
    assert(
      !roleRow[0]?.rolbypassrls && !roleRow[0]?.rolsuper,
      'app_user has no BYPASSRLS/superuser',
    );

    // This whole suite proves RLS by BECOMING app_user, so the connecting role must be able to
    // `set local role app_user`. app_admin — which .env.example mandates for
    // DATABASE_ADMIN_URL, and which infra/README tells operators to run this command with —
    // could NOT until 0006_admin_role_privileges.sql granted it membership. Any other role
    // still cannot, and without this preflight the failure surfaces as a raw 42501 from deep
    // inside the run with nothing pointing at the cause.
    await sql
      .begin(async (tx) => {
        await tx`set local role app_user`;
      })
      .catch(() => {
        throw new Error(
          'tenancy: the connecting role cannot SET ROLE app_user, so RLS cannot be proven. ' +
            'Use a member of app_user, or the owner/superuser. app_admin and app_runtime both ' +
            'qualify (0004_login_roles.sql + 0006_admin_role_privileges.sql); a role created ' +
            'outside those migrations will not.',
        );
      });

    /*
     * GREENFIELD GUARD (2026-08-01, ADR-0024). The auth teardown deleted every migration,
     * so `tenants` and `users` do not exist and nothing below can seed or exercise them.
     * The catalog half would still "pass" over zero tables, which is worse than useless —
     * it would report tenancy as proven when nothing was proven at all.
     *
     * What IS still meaningful, and asserted above: the roles survived the schema drop with
     * the right privileges, and the connecting role can still become app_user. That is the
     * platform the rebuild binds to. Everything else waits for its first migration.
     */
    const [tableCount] = await sql<{ n: number }[]>`
      select count(*)::int as n from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and c.relname <> 'schema_migrations'`;
    if ((tableCount?.n ?? 0) === 0) {
      console.log(
        'tenancy invariants VACUOUS — 0 application tables (greenfield since 2026-08-01). ' +
          'Verified only that app_user exists without BYPASSRLS/superuser and that the ' +
          'connecting role can SET ROLE app_user. CROSS-TENANT ISOLATION IS UNPROVEN until ' +
          'the auth + tenancy module lands its first migration.',
      );
      return;
    }

    // Seed two tenants + one user each (admin context)
    await sql`insert into tenants (id, name, slug) values
      (${tenantA}, 'Invariant A', ${`inv-a-${suffix}`}),
      (${tenantB}, 'Invariant B', ${`inv-b-${suffix}`})`;
    await sql`insert into users (id, tenant_id, name, phone_e164) values
      (${userA}, ${tenantA}, 'User A', ${`+91900000${suffix.slice(0, 4)}1`}),
      (${userB}, ${tenantB}, 'User B', ${`+91900000${suffix.slice(0, 4)}2`})`;

    // Partition children are identified STRUCTURALLY via pg_inherits, never by name. The
    // former `not like 'audit_log_%'` filter was a guess about naming: a real tenant table
    // called `usage_events_rollup` or `audit_log_retention` matched the prefix, dropped out of
    // this list, and escaped BOTH the arming check and the leak loop below while
    // table-tenancy-scan vouched for it as tenant-scoped. relkind ('r','p') also keeps views
    // out, which information_schema.columns did not.
    const tenantTables = (
      await sql`select c.relname as table_name
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id' and a.attnum > 0
        where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
          and n.nspname not like 'pg\\_temp%' and n.nspname not like 'pg\\_toast%'
          and c.relkind in ('r', 'p')
          and not exists (select 1 from pg_inherits i where i.inhrelid = c.oid)
        order by c.relname`
    ).map((r) => r.table_name as string);
    assert(
      tenantTables.length >= 7,
      `schema scan found tenant tables (got ${tenantTables.length})`,
    );

    // `tenants` carries no tenant_id (it IS the registry, keyed by id) so the scan above
    // never returns it — but it is tenant-scoped and must be armed like the rest.
    await assertRlsArmed(sql, [...tenantTables, 'tenants']);
    await assertPartitionChildrenUngranted(sql);
    await assertNoRlsBypassingRoutes(sql);

    // ── As tenant A (RLS-subject role) ──
    await sql.begin(async (tx) => {
      await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
      await tx`set local role app_user`;

      for (const table of tenantTables) {
        const leaked = await tx`select count(*)::int as n from ${tx(table)}
          where tenant_id = ${tenantB}`;
        assert(leaked[0]?.n === 0, `${table}: tenant A session sees zero tenant B rows`);
      }
      const visible = await tx`select count(*)::int as n from users`;
      assert(visible[0]?.n >= 1, 'tenant A sees its own users');
      const tenantsVisible = await tx`select id from tenants`;
      assert(
        tenantsVisible.length === 1 && tenantsVisible[0]?.id === tenantA,
        'tenants: only own row visible',
      );
    });

    // Cross-tenant WRITE must fail (WITH CHECK)
    await expectFail(
      sql.begin(async (tx) => {
        await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
        await tx`set local role app_user`;
        await tx`insert into users (id, tenant_id, name, phone_e164)
          values (${randomUUID()}, ${tenantB}, 'Evil', ${`+91900000${suffix.slice(0, 4)}3`})`;
      }),
      'insert into tenant B from tenant A session must fail',
    );

    // Cross-tenant UPDATE touches zero rows
    await sql.begin(async (tx) => {
      await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
      await tx`set local role app_user`;
      const updated = await tx`update users set name = 'Owned' where id = ${userB} returning id`;
      assert(updated.length === 0, 'update of tenant B user affects zero rows');
    });

    // Fail closed: no app.tenant_id set → zero rows everywhere
    await sql.begin(async (tx) => {
      await tx`set local role app_user`;
      const rows = await tx`select count(*)::int as n from users`;
      assert(rows[0]?.n === 0, 'no tenant context → zero rows (fail closed)');
    });

    // Append-only ledgers: asserted from the CATALOG, over every mutating privilege and every
    // RLS-subject role.
    //
    // The previous form ran `update <ledger>` under app_user and required it to throw. Two
    // problems, both real: it tested UPDATE only — DELETE and TRUNCATE were ungated and the
    // grants permitted neither being checked — and `expectFail` accepts ANY exception, so a
    // typo'd table name or a connection blip read as "append-only holds". A privilege question
    // answers all of it at once and cannot be fooled by an unrelated error.
    const ledgerGrants = await sql<{ ledger: string; privilege: string; grantee: string }[]>`
      select c.relname as ledger, priv.privilege, sub.rolname as grantee
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral (values ('UPDATE'), ('DELETE'), ('TRUNCATE')) as priv(privilege)
      cross join lateral (
        select r.rolname from pg_roles r
        where pg_has_role(r.rolname, 'app_user', 'MEMBER')
          and not r.rolbypassrls and not r.rolsuper and r.rolname not like 'pg\\_%'
      ) as sub
      where c.relname in ('audit_log', 'usage_events', 'sync_mutations')
        and case when priv.privilege in ('DELETE', 'TRUNCATE')
                 then has_table_privilege(sub.rolname, c.oid, priv.privilege)
                 else has_any_column_privilege(sub.rolname, c.oid, priv.privilege) end`;
    assert(
      ledgerGrants.length === 0,
      `append-only ledgers hold ${ledgerGrants.length} mutating grant(s):\n` +
        ledgerGrants.map((g) => `      ${g.privilege} on ${g.ledger} to ${g.grantee}`).join('\n') +
        '\n      A ledger row is evidence. Revoke it — corrections are new rows, never edits.',
    );

    // Say which half proved what, and claim no more than that. "Scanned" must never again
    // read as "isolation proven", and the arming half proves a CATALOG SHAPE — enabled,
    // forced, policies matching a canonical expression — not that the policy is semantically
    // right for a schema nobody has written yet.
    console.log(
      `tenancy invariants OK — RLS armed (enabled+forced+canonical policy expression) on ` +
        `${tenantTables.length + 1} tables: ${[...tenantTables, 'tenants'].join(', ')}; ` +
        `no partition-child grants; no RLS-bypassing views or SECURITY DEFINER functions; ` +
        `isolation behaviourally exercised on tenants, users only`,
    );
  } finally {
    await sql`delete from users where id in (${userA}, ${userB})`.catch(() => {});
    await sql`delete from tenants where id in (${tenantA}, ${tenantB})`.catch(() => {});
    await sql.end();
  }
}
