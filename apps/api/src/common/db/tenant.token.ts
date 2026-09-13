/**
 * The tenant DOOR, on the runtime pool: a member of `app_user`, so every statement is subject to
 * RLS. What it provides is a `TenantPool` and not a database — the handle carries no query of its
 * own, so a repository holding this cannot read anything without first naming the tenant whose
 * rows it wants (`mechanisms.md` M11).
 *
 * The same socket is reachable RAW through `reference.token.ts`, for the tables no tenant owns
 * and for the boot check that reads the role's own privileges. A token is a permission, not a
 * pool: these two differ in what the holder may do, never in what they connect to.
 */
export const TENANT_DB = Symbol('TENANT_DB');
