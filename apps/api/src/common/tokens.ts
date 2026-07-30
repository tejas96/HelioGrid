/** Cross-cutting DI tokens — PORTS that modules implement (apps/api/CLAUDE.md §Local conventions). */

/** Implemented by `modules/auth`; consumed by `common/guards/session.guard.ts`. */
export const SESSION_RESOLVER = Symbol('SESSION_RESOLVER');
