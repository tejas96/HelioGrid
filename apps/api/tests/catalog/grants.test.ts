import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openPools, skipWithoutDatabase } from '../support/fixture';

/**
 * The one catalog grant no invariant holds (`T-M01-027` AC-2): no catalog table grants DELETE or
 * TRUNCATE to any role under `app_user` — a product is archived, never deleted (`M01-42`). The
 * ledgers' append-only grants are `tenancy-rls`'s (`append-only-ledgers.ts`) and the platform
 * tables' SELECT-alone is `table-tenancy-scan`'s, so neither is asked twice here. Asked the way
 * those ask: every RLS-subject role, table-level for the two privileges that delete rows.
 */

const TENANT_TABLES = [
  'tenant_catalog_item',
  'tenant_catalog_override',
  'catalog_rate_entry',
  'catalog_release',
  'catalog_release_line',
] as const;
const PLATFORM_TABLES = [
  'catalog_item',
  'catalog_item_market_availability',
  'catalog_item_certification',
] as const;

const skip = skipWithoutDatabase(
  'CATALOG GRANTS PROOF',
  'The catalog grants are UNPROVEN in this run — only the migration text says what they are.',
);

describe.skipIf(skip)('the catalog grants, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;

  beforeAll(() => {
    pools = openPools();
  });

  afterAll(async () => {
    await pools.close();
  });

  /** The roles under `app_user` that hold the privilege on the table — empty is the pass. */
  const grantees = async (table: string, privilege: string): Promise<string[]> => {
    const rows = await pools.admin.db.execute<{ rolname: string }>(sql`
      select r.rolname from pg_roles r
      where pg_has_role(r.rolname, 'app_user', 'MEMBER')
        and not r.rolbypassrls and not r.rolsuper and r.rolname not like 'pg\\_%'
        and case when ${privilege} in ('DELETE', 'TRUNCATE')
                 then has_table_privilege(r.rolname, ${table}::regclass, ${privilege})
                 else has_any_column_privilege(r.rolname, ${table}::regclass, ${privilege}) end
      order by r.rolname`);
    return rows.map((row) => row.rolname);
  };

  it.each([...TENANT_TABLES, ...PLATFORM_TABLES])(
    'no catalog table grants DELETE or TRUNCATE to a role under app_user (%s)',
    async (table) => {
      expect(await grantees(table, 'DELETE')).toEqual([]);
      expect(await grantees(table, 'TRUNCATE')).toEqual([]);
    },
  );

  it.each(TENANT_TABLES)('a tenant table grants SELECT and INSERT (%s)', async (table) => {
    expect(await grantees(table, 'SELECT')).toContain('app_user');
    expect(await grantees(table, 'INSERT')).toContain('app_user');
  });
});
