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
 * RLS backstop plumbing (rules/api.md tenancy §3): every tenant-scoped request runs in a
 * transaction that pins `app.tenant_id` via SET LOCAL. The repository layer is the
 * primary scoping; this setting is what the row-level policies check. Fail-closed: with
 * no setting, policies see NULL and match zero rows.
 */
/** Cheap connectivity probe for readiness checks. */
export async function ping(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
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
