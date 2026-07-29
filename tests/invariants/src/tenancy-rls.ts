import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

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

    // Seed two tenants + one user each (admin context)
    await sql`insert into tenants (id, name, slug) values
      (${tenantA}, 'Invariant A', ${`inv-a-${suffix}`}),
      (${tenantB}, 'Invariant B', ${`inv-b-${suffix}`})`;
    await sql`insert into users (id, tenant_id, name, phone_e164) values
      (${userA}, ${tenantA}, 'User A', ${`+91900000${suffix.slice(0, 4)}1`}),
      (${userB}, ${tenantB}, 'User B', ${`+91900000${suffix.slice(0, 4)}2`})`;

    const tenantTables = (
      await sql`select table_name from information_schema.columns
        where table_schema = 'public' and column_name = 'tenant_id'
          and table_name not like 'audit_log_%' and table_name not like 'usage_events_%'
        order by table_name`
    ).map((r) => r.table_name as string);
    assert(
      tenantTables.length >= 7,
      `schema scan found tenant tables (got ${tenantTables.length})`,
    );

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

    // Append-only: app_user has no UPDATE grant on the ledgers
    for (const ledger of ['audit_log', 'usage_events', 'sync_mutations']) {
      await expectFail(
        sql.begin(async (tx) => {
          await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
          await tx`set local role app_user`;
          await tx.unsafe(`update ${ledger} set tenant_id = tenant_id`);
        }),
        `${ledger}: UPDATE denied for app_user (append-only)`,
      );
    }

    console.log(
      `tenancy invariants OK — ${tenantTables.length} tenant tables scanned: ${tenantTables.join(', ')}`,
    );
  } finally {
    await sql`delete from users where id in (${userA}, ${userB})`.catch(() => {});
    await sql`delete from tenants where id in (${tenantA}, ${tenantB})`.catch(() => {});
    await sql.end();
  }
}
