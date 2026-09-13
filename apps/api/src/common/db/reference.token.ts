/**
 * The RLS-SUBJECT pool, UNPINNED: the same `app_user` connection the tenant path uses, handed
 * over without a tenant, for the tables no tenant owns — the market pack, readable global
 * reference data every tenant reads and none owns (`F1-12`). The role holds SELECT there and no
 * write privilege, and with no `app.tenant_id` set every tenant policy sees NULL and matches
 * zero rows, so this pool cannot read another company's data even by mistake.
 *
 * A token is a PERMISSION, not a pool: this one names the same `pools.runtime` the tenant path
 * opens, and lives ALONE in its own file so the fence can be mechanical — dependency-cruiser
 * `reference-pool-fenced` permits importing this path only from `*.reference.repository.ts` and
 * `common/db/`. Anything else that wants an unpinned read has to justify itself by adding a
 * reference repository, which is exactly the review conversation we want to force.
 */
export const REFERENCE_DB = Symbol('REFERENCE_DB');
