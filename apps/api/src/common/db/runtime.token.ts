/**
 * The RUNTIME pool: logs in as a member of `app_user`, so every statement is subject to RLS
 * and `withTenantTransaction`'s `SET LOCAL app.tenant_id`. This is the default — a
 * repository should reach for the admin pool only when it genuinely cannot know a tenant yet.
 */
export const RUNTIME_DB = Symbol('RUNTIME_DB');
