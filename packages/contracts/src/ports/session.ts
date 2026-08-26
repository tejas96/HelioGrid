import type { SessionProjection } from '../session';

/**
 * The port the deny-by-default guard resolves a request's identity through.
 *
 * It lives in contracts, not in the auth module, for the reason `common/` may never import a
 * module: the guard is framework plumbing beneath the modules, so it depends on this
 * INTERFACE and the auth module provides the implementation. Declaring the guard's dependency
 * on a service class instead is what made the previous attempt fail at boot.
 *
 * Returning `null` means "no valid session", never "an anonymous one" — there is no anonymous
 * actor in this product. A route that genuinely needs no session is marked public explicitly;
 * silence is denial.
 *
 * STATUS: no implementation and no consumer yet. The M01 slice lands the guard, the resolver
 * and the tables together.
 */
export interface SessionResolver {
  /** Resolve the CURRENT request's session. Implementations must not cache across requests. */
  resolve(request: unknown): Promise<SessionProjection | null>;
}

/**
 * A DI token, and a `symbol` on purpose: a string token collides silently across modules,
 * and the collision surfaces as the wrong provider being injected rather than as an error.
 */
export const SESSION_RESOLVER = Symbol.for('heliogrid.SessionResolver');
