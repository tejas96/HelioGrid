import {
  invitation,
  type TenantScopedDb,
  tenant,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import type { InvitationStatus, UiLanguage } from '@heliogrid/domain';
import { and, count, eq, gt, lte } from 'drizzle-orm';

/**
 * The reads a send makes before it writes, inside the send's own tenant transaction
 * (`invitation.repository.ts`): who is already on the team, how many sends the cap's window
 * holds, a live invite to the phone, and the facts the message needs — with the status reading
 * the Team list filters by, which the live-invite check shares.
 */

/** What the message needs and only the tenant's own rows know. */
export interface SendFacts {
  readonly inviterName: string;
  readonly companyName: string;
  readonly defaultLanguage: UiLanguage;
}

/** A phone that already holds a membership here, in any status: a leaver is not re-invited (`F2-20`). */
export async function isOnTeam(
  tx: TenantScopedDb,
  tenantId: string,
  phoneE164: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: tenantMembership.id })
    .from(tenantMembership)
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(and(eq(tenantMembership.tenantId, tenantId), eq(userAccount.phoneE164, phoneE164)))
    .limit(1);
  return row !== undefined;
}

/** Every send in the cap's window, whatever became of it: each cost a message (`M01-04`). */
export async function sentSince(
  tx: TenantScopedDb,
  tenantId: string,
  since: number,
): Promise<number> {
  const [row] = await tx
    .select({ n: count() })
    .from(invitation)
    .where(and(eq(invitation.tenantId, tenantId), gt(invitation.sentAt, new Date(since))));
  return row?.n ?? 0;
}

export async function sendFacts(
  tx: TenantScopedDb,
  tenantId: string,
  inviterUserId: string,
): Promise<SendFacts> {
  const [company] = await tx
    .select({ companyName: tenant.companyName, defaultLanguage: tenant.defaultLanguage })
    .from(tenant)
    .where(eq(tenant.id, tenantId))
    .limit(1);
  const [inviter] = await tx
    .select({ name: userAccount.name })
    .from(userAccount)
    .where(eq(userAccount.id, inviterUserId))
    .limit(1);
  if (!company || !inviter) throw new Error('the company or the inviter vanished inside the send');
  return { ...company, inviterName: inviter.name ?? '' };
}

/** A pending, unexpired invite to this phone; an expired one may be sent again. */
export async function hasLiveInvite(
  tx: TenantScopedDb,
  tenantId: string,
  phoneE164: string,
  now: number,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: invitation.id })
    .from(invitation)
    .where(
      and(
        eq(invitation.tenantId, tenantId),
        eq(invitation.inviteePhoneE164, phoneE164),
        statusPredicate('pending', now),
      ),
    )
    .limit(1);
  return row !== undefined;
}

/**
 * The SQL twin of domain's `invitationStatus`, for the listing alone: `expired` is a pending row
 * past its expiry, and the (tenant_id, status, expires_at) index is built for exactly this read.
 * Every write reads the row and asks domain instead.
 */
export function statusPredicate(status: InvitationStatus | undefined, now: number) {
  if (status === undefined) return undefined;
  if (status === 'pending') {
    return and(eq(invitation.status, 'pending'), gt(invitation.expiresAt, new Date(now)));
  }
  if (status === 'expired') {
    return and(eq(invitation.status, 'pending'), lte(invitation.expiresAt, new Date(now)));
  }
  return eq(invitation.status, status);
}
