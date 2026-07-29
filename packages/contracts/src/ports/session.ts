import type { SessionClaims } from '../common';

/**
 * PORT — the session guard lives in `apps/api/src/common/` and may never import a module
 * (dependency-cruiser `common-imports-no-modules`). It therefore depends on THIS interface;
 * `modules/auth` provides the implementation. Swapping the identity provider touches the
 * adapter and one `provide:` line, never the guard.
 *
 * Implementations verify the request's credentials and resolve tenancy in one call, so a
 * caller can never get a verified user without the tenant/role claims that authorize them.
 * Returns null when there is no valid session — the guard turns that into UNAUTHENTICATED.
 */
export interface SessionResolver {
  resolve(headers: Record<string, string>): Promise<SessionClaims | null>;
}
