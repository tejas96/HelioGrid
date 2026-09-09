import {
  type Db,
  invitation,
  invitationRole,
  tenant,
  tenantMembership,
  userAccount,
  withTenantTransaction,
} from '@heliogrid/db';
import {
  type InvitationStatus,
  inMatrixOrder,
  invitationExpiresAt,
  invitationsSince,
  inviteCapReached,
  type RolePreset,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gt, inArray, lte, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { RUNTIME_DB } from '../../common/db/runtime.token';
import { recordAuditEntry } from '../audit/audit.public';

export interface InvitationRow {
  readonly id: string;
  readonly inviteeName: string;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  /** As stored; what it is NOW is domain's reading of this against the clock. */
  readonly status: InvitationStatus;
  readonly inviterUserId: string;
  readonly sentAt: Date;
  readonly expiresAt: Date;
}

/** The invite as the sender composed it; the link's secret arrives already hashed. */
export interface InviteToSend {
  readonly inviteeName: string;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly tokenHash: string;
}

/** What the message needs and only the tenant's own rows know. */
export interface SendFacts {
  readonly inviterName: string;
  readonly companyName: string;
  readonly defaultLanguage: UiLanguage;
}

/**
 * How a send ended (`M01-12`, `M01-04`): the invite as it now stands, or the one reason nothing
 * was sent — the phone is already on this team, a live invite already went to it, or the day's
 * cap is reached.
 */
export type CreateOutcome =
  | { readonly outcome: 'done'; readonly invitation: InvitationRow }
  | { readonly outcome: 'already-member' | 'already-invited' | 'capped' };

export type RevokeOutcome =
  | { readonly outcome: 'done'; readonly invitation: InvitationRow }
  | { readonly outcome: 'not-found' | 'not-pending' };

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The tenant side of an invitation, on the runtime pool inside the tenant transaction: the send,
 * the Team list and the revoke. The landing side, which crosses tenancy, is the admin repository
 * beside this one.
 */
@Injectable()
export class InvitationRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  /**
   * The send, in ONE tenant transaction under the tenant lock: the three checks, the rows, the
   * entry, and the message itself. A carrier that refuses rolls the invite back, so the owner
   * retries and a link that never arrived counts against nothing.
   */
  async create(
    tenantId: string,
    invite: InviteToSend,
    act: Act,
    deliver: (facts: SendFacts) => Promise<void>,
  ): Promise<CreateOutcome> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      if (await isOnTeam(tx, tenantId, invite.phoneE164)) return { outcome: 'already-member' };
      if (await hasLiveInvite(tx, tenantId, invite.phoneE164, act.now)) {
        return { outcome: 'already-invited' };
      }
      if (inviteCapReached(await sentSince(tx, tenantId, invitationsSince(act.now)))) {
        return { outcome: 'capped' };
      }
      const [row] = await tx
        .insert(invitation)
        .values({
          tenantId,
          inviterUserId: act.actorUserId,
          inviteeName: invite.inviteeName,
          inviteePhoneE164: invite.phoneE164,
          tokenHash: invite.tokenHash,
          status: 'pending',
          sentAt: new Date(act.now),
          expiresAt: new Date(invitationExpiresAt(act.now)),
        })
        .returning(invitationColumns());
      if (!row) throw new Error('invitation insert returned no row');
      // The wire carries a list; the table holds a SET, one row per preset, in matrix order.
      const roles = inMatrixOrder(invite.roles);
      await tx
        .insert(invitationRole)
        .values(roles.map((rolePreset) => ({ tenantId, invitationId: row.id, rolePreset })));
      await recordAuditEntry(tx, inviteAct('team.invite_sent', tenantId, row.id, act));
      await deliver(await sendFacts(tx, tenantId, act.actorUserId));
      return { outcome: 'done', invitation: { ...row, roles } };
    });
  }

  /** The Team list, newest first; the count runs over the SAME where. */
  async list(
    tenantId: string,
    filter: { status?: InvitationStatus },
    page: { limit: number; offset: number },
    now: number,
  ): Promise<{ items: InvitationRow[]; totalCount: number }> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const where = and(eq(invitation.tenantId, tenantId), statusPredicate(filter.status, now));
      const rows = await tx
        .select(invitationColumns())
        .from(invitation)
        .where(where)
        .orderBy(desc(invitation.sentAt), desc(invitation.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ n: count() }).from(invitation).where(where);
      return { items: await withRoles(tx, tenantId, rows), totalCount: total?.n ?? 0 };
    });
  }

  /**
   * Withdraws an invitation the store still holds as pending, run out or not: the link stops
   * landing and the record stays (`M01-12`). Anything already answered has nothing to withdraw.
   */
  async revoke(tenantId: string, id: string, act: Act): Promise<RevokeOutcome> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const [row] = await tx
        .update(invitation)
        .set({ status: 'revoked', revokedAt: new Date(act.now) })
        .where(
          and(
            eq(invitation.tenantId, tenantId),
            eq(invitation.id, id),
            eq(invitation.status, 'pending'),
          ),
        )
        .returning(invitationColumns());
      if (!row) return { outcome: await refusalFor(tx, tenantId, id) };
      await recordAuditEntry(tx, inviteAct('team.invite_revoked', tenantId, id, act));
      const [revoked] = await withRoles(tx, tenantId, [row]);
      if (!revoked) throw new Error('the invitation vanished inside its own transaction');
      return { outcome: 'done', invitation: revoked };
    });
  }
}

/** Why a revoke touched nothing: no such invite in this company, or one already answered. */
async function refusalFor(
  tx: Tx,
  tenantId: string,
  id: string,
): Promise<'not-found' | 'not-pending'> {
  const [row] = await tx
    .select({ id: invitation.id })
    .from(invitation)
    .where(and(eq(invitation.tenantId, tenantId), eq(invitation.id, id)))
    .limit(1);
  return row ? 'not-pending' : 'not-found';
}

/** A phone that already holds a membership here, in any status: a leaver is not re-invited (`F2-20`). */
async function isOnTeam(tx: Tx, tenantId: string, phoneE164: string): Promise<boolean> {
  const [row] = await tx
    .select({ id: tenantMembership.id })
    .from(tenantMembership)
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(and(eq(tenantMembership.tenantId, tenantId), eq(userAccount.phoneE164, phoneE164)))
    .limit(1);
  return row !== undefined;
}

/** A pending, unexpired invite to this phone; an expired one may be sent again. */
async function hasLiveInvite(
  tx: Tx,
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

/** Every send in the cap's window, whatever became of it: each cost a message (`M01-04`). */
async function sentSince(tx: Tx, tenantId: string, since: number): Promise<number> {
  const [row] = await tx
    .select({ n: count() })
    .from(invitation)
    .where(and(eq(invitation.tenantId, tenantId), gt(invitation.sentAt, new Date(since))));
  return row?.n ?? 0;
}

async function sendFacts(tx: Tx, tenantId: string, inviterUserId: string): Promise<SendFacts> {
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

/**
 * The SQL twin of domain's `invitationStatus`, for the listing alone: `expired` is a pending row
 * past its expiry, and the (tenant_id, status, expires_at) index is built for exactly this read.
 * Every write reads the row and asks domain instead.
 */
function statusPredicate(status: InvitationStatus | undefined, now: number) {
  if (status === undefined) return undefined;
  if (status === 'pending') {
    return and(eq(invitation.status, 'pending'), gt(invitation.expiresAt, new Date(now)));
  }
  if (status === 'expired') {
    return and(eq(invitation.status, 'pending'), lte(invitation.expiresAt, new Date(now)));
  }
  return eq(invitation.status, status);
}

function inviteAct(
  eventType: 'team.invite_sent' | 'team.invite_revoked',
  tenantId: string,
  invitationId: string,
  act: Act,
) {
  return {
    tenantId,
    eventType,
    actorKind: 'tenant_user' as const,
    actorRef: act.actorUserId,
    occurredAt: new Date(act.now),
    blocked: false,
    subjectKind: 'invitation' as const,
    subjectRef: invitationId,
    changePayload: null,
  };
}

/** Every preset each invitation carries, in one read over the invitation index, in matrix order. */
async function withRoles(
  tx: Tx,
  tenantId: string,
  rows: readonly Omit<InvitationRow, 'roles'>[],
): Promise<InvitationRow[]> {
  const ids = rows.map((row) => row.id);
  const carried =
    ids.length === 0
      ? []
      : await tx
          .select({
            invitationId: invitationRole.invitationId,
            rolePreset: invitationRole.rolePreset,
          })
          .from(invitationRole)
          .where(
            and(eq(invitationRole.tenantId, tenantId), inArray(invitationRole.invitationId, ids)),
          )
          .orderBy(invitationRole.rolePreset);
  return rows.map((row) => ({
    ...row,
    roles: carried.filter((r) => r.invitationId === row.id).map((r) => r.rolePreset),
  }));
}

function invitationColumns() {
  return {
    id: invitation.id,
    inviteeName: invitation.inviteeName,
    phoneE164: invitation.inviteePhoneE164,
    status: invitation.status,
    inviterUserId: invitation.inviterUserId,
    sentAt: invitation.sentAt,
    expiresAt: invitation.expiresAt,
  };
}
