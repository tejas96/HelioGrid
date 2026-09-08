import type { MembershipStatus } from '../tenancy/membership';

/**
 * Whether a token's claims are still true of the membership they were minted from
 * (`M01-07`, `F2-17`). A token is compared, never trusted for its remaining life: every change
 * to what a person may do — a role granted or removed, a deactivation — bumps the membership's
 * `authorizationVersion`, and a token carrying the previous number is refused on its next call.
 */
export interface TokenClaims {
  readonly authorizationVersion: number;
}

export interface MembershipStanding {
  readonly status: MembershipStatus;
  readonly authorizationVersion: number;
}

export type Admission =
  | { readonly admitted: true }
  | { readonly admitted: false; readonly reason: 'no-membership' | 'not-active' | 'stale-claims' };

export function admit(claims: TokenClaims, membership: MembershipStanding | null): Admission {
  if (membership === null) return { admitted: false, reason: 'no-membership' };
  if (membership.status !== 'active') return { admitted: false, reason: 'not-active' };
  if (claims.authorizationVersion !== membership.authorizationVersion) {
    return { admitted: false, reason: 'stale-claims' };
  }
  return { admitted: true };
}
