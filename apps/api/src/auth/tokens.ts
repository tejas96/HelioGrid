/** DI tokens for the auth module (constructor injection only — rules/api.md). */
export const AUTH = Symbol('BETTER_AUTH');
/** RLS-subject runtime pool (login role member of app_user). */
export const RUNTIME_DB = Symbol('RUNTIME_DB');
/** Elevated pool for the explicit admin paths: signup + accept-invite (audited). */
export const ADMIN_DB = Symbol('ADMIN_DB');
