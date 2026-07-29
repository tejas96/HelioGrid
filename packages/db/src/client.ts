import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = ReturnType<typeof createDb>['db'];

export function createDb(databaseUrl: string, options: { max?: number } = {}) {
  const client = postgres(databaseUrl, { max: options.max ?? 10, prepare: false });
  const db = drizzle(client, { schema });
  return { db, client };
}

/**
 * RLS backstop plumbing (packages/db/CLAUDE.md tenancy §3): every tenant-scoped request runs in a
 * transaction that pins `app.tenant_id` via SET LOCAL. The repository layer is the
 * primary scoping; this setting is what the row-level policies check. Fail-closed: with
 * no setting, policies see NULL and match zero rows.
 */
/** Cheap connectivity probe for readiness checks. */
export async function ping(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

/**
 * Refuses to let an app start on a connection that can bypass tenancy (docs/08 §124).
 *
 * RLS silently no-ops for superusers and for any role holding BYPASSRLS — no error, no log,
 * just every tenant's rows. That failure is invisible in testing precisely because
 * everything "works". This turns it into a boot failure instead.
 *
 * It is checked against `current_user` on a REAL connection rather than inferred from the
 * URL, because the connection string tells you the name, not the privileges behind it.
 */
export async function assertRuntimeRoleIsNotPrivileged(db: Db): Promise<void> {
  const rows = (await db.execute(sql`
    select current_user as role, rolsuper, rolbypassrls
    from pg_roles where rolname = current_user
  `)) as unknown as Array<{ role: string; rolsuper: boolean; rolbypassrls: boolean }>;

  const row = rows[0];
  if (!row) throw new Error('tenancy check: could not resolve current_user in pg_roles');
  if (row.rolsuper || row.rolbypassrls) {
    const why = [row.rolsuper && 'SUPERUSER', row.rolbypassrls && 'BYPASSRLS']
      .filter(Boolean)
      .join(' + ');
    throw new Error(
      `Refusing to start: the runtime database role "${row.role}" has ${why}, so row-level ` +
        'security is silently inactive and every query can read across tenants. Point ' +
        'DATABASE_URL at the app_runtime role (packages/db/migrations/0004_login_roles.sql).',
    );
  }
}

export async function withTenantTransaction<T>(
  db: Db,
  tenantId: string,
  fn: (tx: Parameters<Parameters<Db['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}
