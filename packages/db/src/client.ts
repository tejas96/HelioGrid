import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './schema';

export type Db = ReturnType<typeof createDb>['db'];

/** The pool factory. `schema` is what lets a repository query through the Drizzle mirror. */
export function createDb(databaseUrl: string, options: { max?: number } = {}) {
  const client = postgres(databaseUrl, { max: options.max ?? 10, prepare: false });
  const db = drizzle(client, { schema });
  return { db, client };
}

/**
 * RLS backstop plumbing (packages/db/CLAUDE.md §Local conventions · docs/engineering/08 §4 Layer 3): every tenant-scoped request runs in a
 * transaction that pins `app.tenant_id` via SET LOCAL. The repository layer is the
 * primary scoping; this setting is what the row-level policies check. Fail-closed: with
 * no setting, policies see NULL and match zero rows.
 */
/** Cheap connectivity probe for readiness checks. */
export async function ping(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

/**
 * Refuses to let an app start on a connection that can bypass tenancy (docs/engineering/08 §4, BYPASSRLS warning).
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
        'DATABASE_URL at the app_runtime role (infra/postgres/init/01-roles.sql).',
    );
  }
}

/**
 * Any transaction, on either pool. One name, so a repository never re-derives it — eight files
 * each spelled `Parameters<Parameters<Db['transaction']>[0]>[0]` by hand, which is the second
 * copy of a shape that CLAUDE.md §8 calls a defect even when every copy is correct.
 */
export type DbTransaction = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The brand, minted here and exported NOWHERE. A type outside this file cannot name this symbol,
 * so it cannot describe a `TenantScopedDb` structurally: the only way to hold one is to be handed
 * it, and the only thing that hands one out is `TenantPool.withTenantTransaction` below.
 */
declare const tenantScoped: unique symbol;

/**
 * A transaction that has PINNED `app.tenant_id`. Take this, not `DbTransaction`, wherever a read
 * must be a tenant's own: the parameter then states the requirement instead of trusting the
 * caller to have met it, and a transaction from the admin pool no longer fits.
 */
export type TenantScopedDb = DbTransaction & { readonly [tenantScoped]: true };

/**
 * The runtime pool as a tenant repository sees it: it carries NO query of its own. The door to a
 * tenant's rows is the transaction that pins them, and there is no second door — `this.db.select()`
 * does not compile, which is the whole point (mechanisms.md M11). Before this, a repository held
 * the entire database and was merely EXPECTED to wrap each read; a forgotten wrapper read every
 * company's rows and only review or RLS stood behind it.
 */
export interface TenantPool {
  withTenantTransaction<T>(tenantId: string, run: (db: TenantScopedDb) => Promise<T>): Promise<T>;
}

/**
 * The one place a `TenantScopedDb` is made. The cast is the single hole a brand has, and it lives
 * inside the owning package exactly as CLAUDE.md §8 requires — everywhere else, `as TenantScopedDb`
 * is a defect.
 */
export function tenantPool(db: Db): TenantPool {
  return {
    withTenantTransaction: (tenantId, run) =>
      db.transaction(async (tx) => {
        await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
        return run(tx as TenantScopedDb);
      }),
  };
}
