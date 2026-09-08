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
  const membershipA = randomUUID();
  const membershipB = randomUUID();
  const suffix = tenantA.slice(0, 8);

  try {
    // TENANT tables — those carrying tenant_id — identified from the catalog, never by name.
    // Partition children are excluded STRUCTURALLY via pg_inherits: a `not like 'audit_log_%'`
    // filter was a guess about naming, and a real tenant table called `usage_events_rollup`
    // matched the prefix, dropped out of this list, and escaped BOTH the arming check and the
    // leak loop below while table-tenancy-scan vouched for it as tenant-scoped. relkind
    // ('r','p') also keeps views out, which information_schema.columns did not.
    //
    // This count, not the count of every public table, is what the greenfield guards below
    // read: global reference data (the market pack) is migrated before any tenant table, and
    // proving nothing about it here is correct — table-tenancy-scan holds its grants.
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

    const roleRow =
      await sql`select rolbypassrls, rolsuper from pg_roles where rolname = 'app_user'`;

    /*
     * Fires when NO `app_user` role exists. Every db-backed check below names that role, so
     * postgres raises 42704 and they cannot run at all rather than running vacuously. Roles are
     * cluster objects from `infra/postgres/init/01-roles.sql`, which CI runs before it
     * migrates and `pnpm infra:up` runs on first boot.
     *
     * Fail CLOSED where it still means something: tenant tables without the role is a broken
     * database, not an unprovisioned one.
     */
    if (roleRow.length === 0) {
      assert(
        tenantTables.length === 0,
        'app_user role exists (tenant tables are present, so the role must be too)',
      );
      console.warn(
        'tenancy invariants VACUOUS — no tenant table and no app_user role: the database was ' +
          'never provisioned. NOTHING about tenancy is proven.',
      );
      return;
    }

    // The role exists, so its properties are still worth proving.
    assert(
      !roleRow[0]?.rolbypassrls && !roleRow[0]?.rolsuper,
      'app_user has no BYPASSRLS/superuser',
    );

    // This whole suite proves RLS by BECOMING app_user, so the connecting role must be able to
    // `set local role app_user`. app_admin — which .env.example mandates for
    // DATABASE_ADMIN_URL, and which infra/README tells operators to run this command with —
    // gets that membership from infra/postgres/init/01-roles.sql. Any other role
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
            'qualify (infra/postgres/init/01-roles.sql); a role created outside that file ' +
            'will not.',
        );
      });

    /*
     * GREENFIELD GUARD. Until the identity spine lands, no table carries tenant_id, so
     * nothing below can seed or exercise one — and the catalog half would still "pass" over
     * zero tenant tables, which is worse than useless: it would report tenancy as proven when
     * nothing was proven at all. Keyed on TENANT tables: the market pack tables exist before
     * this returns, and they are readable global reference data with nothing to isolate.
     */
    if (tenantTables.length === 0) {
      console.warn(
        'tenancy invariants VACUOUS — no table carries tenant_id (only global reference data ' +
          'is migrated). Verified only that app_user exists without BYPASSRLS/superuser and ' +
          'that the connecting role can SET ROLE app_user. CROSS-TENANT ISOLATION IS UNPROVEN ' +
          "until the identity spine's migration lands (T-M01-025).",
      );
      return;
    }

    /*
     * Seed two tenants, one account each, one active owner membership each — admin context.
     * The market row the tenant references is the real market code; a bare registry row is
     * harmless reference data and needs no cleanup.
     */
    await sql`insert into market_pack (market_code) values ('IN') on conflict do nothing`;
    await sql`insert into tenant (id, company_name, city, market_code, currency_code,
        default_language, timezone, created_at) values
      (${tenantA}, 'Invariant A', 'Pune', 'IN', 'INR', 'en', 'Asia/Kolkata', now()),
      (${tenantB}, 'Invariant B', 'Pune', 'IN', 'INR', 'en', 'Asia/Kolkata', now())`;
    await sql`insert into user_account (id, phone_e164, name, interface_language,
        unit_preference, created_at) values
      (${userA}, ${`+91900000${suffix.slice(0, 4)}1`}, 'User A', 'en', 'metric', now()),
      (${userB}, ${`+91900000${suffix.slice(0, 4)}2`}, 'User B', 'en', 'metric', now())`;
    await sql`insert into tenant_membership (id, tenant_id, user_account_id, status,
        coach_marks_dismissed, authorization_version, created_at) values
      (${membershipA}, ${tenantA}, ${userA}, 'active', 0, 0, now()),
      (${membershipB}, ${tenantB}, ${userB}, 'active', 0, 0, now())`;
    await sql`insert into membership_role (id, tenant_id, membership_id, role_preset) values
      (${randomUUID()}, ${tenantA}, ${membershipA}, 'epc_owner'),
      (${randomUUID()}, ${tenantB}, ${membershipB}, 'epc_owner')`;

    assert(
      tenantTables.length >= 2,
      `schema scan found the membership and role tables (got ${tenantTables.length})`,
    );

    // `tenant` and `user_account` carry no tenant_id, so the scan above never returns them —
    // but both are ARMED and must prove it like the rest: enabled, forced, a canonical policy.
    const armed = [...tenantTables, 'tenant', 'user_account'];
    await assertRlsArmed(sql, armed);
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
      const visible = await tx`select count(*)::int as n from tenant_membership`;
      assert(visible[0]?.n >= 1, 'tenant A sees its own memberships');
      const tenantsVisible = await tx`select id from tenant`;
      assert(
        tenantsVisible.length === 1 && tenantsVisible[0]?.id === tenantA,
        'tenant: only own row visible',
      );
      // The account policy: a member's account is readable, a stranger's is not.
      const accountsVisible = await tx`select id from user_account
        where id in (${userA}, ${userB})`;
      assert(
        accountsVisible.length === 1 && accountsVisible[0]?.id === userA,
        'user_account: only the accounts of own members visible',
      );
    });

    // Cross-tenant WRITE must fail (WITH CHECK): moving a row to tenant B under tenant A's pin
    // is refused by the policy itself — UPDATE is granted, so the refusal is RLS and nothing else.
    await expectFail(
      sql.begin(async (tx) => {
        await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
        await tx`set local role app_user`;
        await tx`update tenant_membership set tenant_id = ${tenantB} where id = ${membershipA}`;
      }),
      'moving a membership into tenant B from tenant A session must fail',
    );

    // Cross-tenant UPDATE touches zero rows
    await sql.begin(async (tx) => {
      await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
      await tx`set local role app_user`;
      const updated = await tx`update tenant_membership set coach_marks_dismissed = 1
        where id = ${membershipB} returning id`;
      assert(updated.length === 0, 'update of tenant B membership affects zero rows');
    });

    // Fail closed: no app.tenant_id set → zero rows everywhere, the armed tables included
    await sql.begin(async (tx) => {
      await tx`set local role app_user`;
      for (const table of armed) {
        const rows = await tx`select count(*)::int as n from ${tx(table)}`;
        assert(rows[0]?.n === 0, `${table}: no tenant context → zero rows (fail closed)`);
      }
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
        `${armed.length} tables: ${armed.join(', ')}; ` +
        `no partition-child grants; no RLS-bypassing views or SECURITY DEFINER functions; ` +
        `isolation behaviourally exercised on tenant, user_account, tenant_membership, membership_role`,
    );
  } finally {
    // The seed rows go, in dependency order, on the admin path; a failure mid-run leaves nothing.
    const tenants = [tenantA, tenantB];
    await sql`delete from membership_role where tenant_id in ${sql(tenants)}`.catch(() => {});
    await sql`delete from tenant_membership where tenant_id in ${sql(tenants)}`.catch(() => {});
    await sql`delete from user_account where id in (${userA}, ${userB})`.catch(() => {});
    await sql`delete from tenant where id in ${sql(tenants)}`.catch(() => {});
    await sql.end();
  }
}
