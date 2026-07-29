/**
 * The auth module's ENTIRE export surface (CLAUDE.md §Structure). Anything outside
 * `modules/auth/` imports from here and nowhere else — dependency-cruiser
 * `api-module-boundary` enforces it. Deliberately no `AuthService`: callers depend on the
 * module, its DI tokens and types, so a service signature change cannot ripple outward.
 */
export { AuthModule } from './auth.module';
/** Ops-script entry point (scripts/auth-migrate.ts) — never used by runtime module code. */
export { type Auth, createAuth } from './internal/better-auth';
export { AUTH } from './tokens';
