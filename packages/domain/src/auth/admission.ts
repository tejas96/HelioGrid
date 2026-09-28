import type { MembershipStatus } from '../tenancy/membership';
import { isSessionLive, type SessionLife } from './session-policy';

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

/**
 * What the refresh answers (`M01-07`, `S1.wrong.4`). A DEACTIVATED membership of the company the
 * session acts for wins over the session's own life: the deactivation revokes the sessions it
 * ends, so reading the life first would call every removal a plain sign-out — and a sweep that
 * failed after the flip would leave a live session renewing with no company at all. Anything
 * else that cannot renew is `signed-out`, never "removed".
 */
export type RefreshVerdict = 'renew' | 'access-removed' | 'signed-out';

export function refreshVerdict(
  life: SessionLife,
  membership: Pick<MembershipStanding, 'status'> | null,
  now: number,
): RefreshVerdict {
  if (membership?.status === 'deactivated') return 'access-removed';
  return isSessionLive(life, now) ? 'renew' : 'signed-out';
}
