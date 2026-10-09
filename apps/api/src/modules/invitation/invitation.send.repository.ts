import {
  invitation,
  type TenantScopedDb,
  tenant,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import { type InvitationStatus, invitationStatus, type UiLanguage } from '@heliogrid/domain';
import { and, count, eq, gt, lte } from 'drizzle-orm';

/**
 * The reads a send makes before it writes, inside the send's own tenant transaction
 * (`invitation.repository.ts`): who is already on the team, how many sends the cap's window
 * holds, a live invite to the phone — with the status reading the Team list filters by, which the
 * live-invite check shares — and, for the text the worker's run sends later, what it needs.
 */

/** What the text needs and only the tenant's own rows know. */
export interface MessageFacts {
  readonly phoneE164: string;
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

/**
 * The text's facts for an invite still pending NOW, as domain reads it; withdrawn, answered, run
 * out or never stored, none is owed.
 */
export async function messageFacts(
  tx: TenantScopedDb,
  tenantId: string,
  invitationId: string,
  now: number,
): Promise<MessageFacts | null> {
  const [row] = await tx
    .select({
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      phoneE164: invitation.inviteePhoneE164,
      inviterName: userAccount.name,
      companyName: tenant.companyName,
      defaultLanguage: tenant.defaultLanguage,
    })
    .from(invitation)
    .innerJoin(tenant, eq(tenant.id, invitation.tenantId))
    .innerJoin(userAccount, eq(userAccount.id, invitation.inviterUserId))
    .where(and(eq(invitation.tenantId, tenantId), eq(invitation.id, invitationId)))
    .limit(1);
  if (!row) return null;
  const { status, expiresAt, inviterName, ...facts } = row;
  if (invitationStatus({ status, expiresAt: expiresAt.getTime() }, now) !== 'pending') return null;
  return { ...facts, inviterName: inviterName ?? '' };
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
