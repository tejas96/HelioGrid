/**
 * The ELEVATED pool: connects as the owner role, so it is NOT subject to RLS. It exists for
 * the handful of paths that legitimately cross tenancy — signup (no tenant yet), invite
 * redemption, and the guard's tenant resolution.
 *
 * This token lives ALONE in its own file so the fence can be mechanical: dependency-cruiser
 * `admin-pool-fenced` permits importing this path only from `*.admin.repository.ts` and
 * `common/db/`. Anything else that wants cross-tenant data has to justify itself by adding
 * an admin repository, which is exactly the review conversation we want to force.
 */
export const ADMIN_DB = Symbol('ADMIN_DB');
