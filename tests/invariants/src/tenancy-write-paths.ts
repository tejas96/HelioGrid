import { randomUUID } from 'node:crypto';
import type postgres from 'postgres';

/**
 * The write paths a slice's migration opens, driven as `app_user` under one tenant's pin: the
 * own-tenant write is accepted FIRST, so a missing grant can never pass as a policy refusal,
 * and the same write aimed at the other tenant is refused by WITH CHECK. `tenancy-rls.ts` runs
 * these after the catalog shape is proven canonical; a table these never touch is still isolated
 * by that shape, but over rows it holds, not over an empty table.
 */

export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`tenancy: ${msg}`);
}

/** The write MUST be refused; any thrown error counts, so the acceptance is always proven first. */
export async function expectFail(p: Promise<unknown>, msg: string): Promise<void> {
  let failed = false;
  try {
    await p;
  } catch {
    failed = true;
  }
  assert(failed, msg);
}

/** Migration 0006 — the settings tables, by their money-adjacent member (`M01-54`). */
export async function assertSettingsWritePath(
  sql: postgres.Sql,
  ids: { readonly tenantA: string; readonly tenantB: string; readonly templateB: string },
): Promise<void> {
  const { tenantA, tenantB, templateB } = ids;
  await sql.begin(async (tx) => {
    await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
    await tx`set local role app_user`;
    const added = await tx`insert into tranche_template (id, tenant_id, name, is_default,
      archived, created_at) values
    (${randomUUID()}, ${tenantA}, '{"en":"Invariant split A2"}'::jsonb, false, false, now())
    returning id`;
    assert(added.length === 1, 'tranche_template: own-tenant insert accepted under RLS');
    const renamed = await tx`update tranche_template set name = '{"en":"Renamed"}'::jsonb
    where id = ${templateB} returning id`;
    assert(
      renamed.length === 0,
      "tranche_template: an edit aimed at tenant B's template touches zero rows",
    );
  });
  await expectFail(
    sql.begin(async (tx) => {
      await tx`select set_config('app.tenant_id', ${tenantA}, true)`;
      await tx`set local role app_user`;
      await tx`insert into tranche_template (id, tenant_id, name, is_default, archived,
      created_at) values
      (${randomUUID()}, ${tenantB}, '{"en":"Invariant split B2"}'::jsonb, false, false, now())`;
    }),
    'inserting a tenant B tranche template from a tenant A session must fail',
  );
}
