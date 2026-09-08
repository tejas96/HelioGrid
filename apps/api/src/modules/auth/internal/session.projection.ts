import type { SessionClaims, SessionProjection } from '@heliogrid/contracts';
import type { RolePreset, SessionLife } from '@heliogrid/domain';
import type { AccountRow, MembershipRow, SessionRow } from './auth.admin.repository';

/** The active membership as a claim; a membership that is not active is no claim at all. */
export function claimsOf(
  sub: string,
  sid: string,
  membership: MembershipRow | null,
): SessionClaims {
  return {
    sub,
    sid,
    membership:
      membership !== null && membership.status === 'active'
        ? {
            tenantId: membership.tenantId,
            roles: membership.roles as RolePreset[],
            authorizationVersion: membership.authorizationVersion,
          }
        : null,
  };
}

/** The projection every screen sees (`session.ts`), from the rows the session acts on. */
export function projectionOf(
  account: AccountRow,
  membership: MembershipRow | null,
  row: SessionRow,
): SessionProjection {
  return {
    actor: { userId: account.id, phoneE164: account.phoneE164, displayName: account.name ?? '' },
    membership: claimsOf(account.id, row.id, membership).membership,
    expiry: {
      expiresAt: row.expiresAt.toISOString(),
      lastForegroundActivityAt: row.lastForegroundActivityAt?.toISOString() ?? null,
    },
  };
}

export function lifeOf(row: SessionRow): SessionLife {
  return { expiresAt: row.expiresAt.getTime(), revokedAt: row.revokedAt?.getTime() ?? null };
}
