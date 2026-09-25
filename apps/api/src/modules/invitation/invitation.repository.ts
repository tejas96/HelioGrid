import { invitation, invitationRole, type TenantPool, type TenantScopedDb } from '@heliogrid/db';
import {
  type InvitationStatus,
  inMatrixOrder,
  invitationExpiresAt,
  invitationsSince,
  inviteCapReached,
  type RolePreset,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordAuditEntry } from '../audit/audit.public';
import {
  hasLiveInvite,
  isOnTeam,
  type SendFacts,
  sendFacts,
  sentSince,
  statusPredicate,
} from './invitation.send.repository';

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

/**
 * How a send ended (`M01-12`, `M01-04`): the invite as it now stands, or the one reason nothing
 * was sent — the phone is already on this team, a live invite already went to it, or the day's
 * cap is reached.
 */
export type CreateOutcome =
  | Keyed<InvitationRow>
  | { readonly outcome: 'already-member' | 'already-invited' | 'capped' };

export type RevokeOutcome =
  | { readonly outcome: 'done'; readonly invitation: InvitationRow }
  | { readonly outcome: 'not-found' | 'not-pending' };

/**
 * The tenant side of an invitation, on the runtime pool inside the tenant transaction: the send,
 * the Team list and the revoke. The landing side, which crosses tenancy, is the admin repository
 * beside this one.
 */
@Injectable()
export class InvitationRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The send, in ONE tenant transaction under the tenant lock: the three checks, the rows, the
   * entry, and the message itself. A carrier that refuses rolls the invite back, so the owner
   * retries and a link that never arrived counts against nothing. A send retried with its key
   * answers with the invite the first send made, BEFORE the checks — which would otherwise call
   * that invite "already invited" — and sends no second message (`F4-07`).
   */
  async create(
    tenantId: string,
    invite: InviteToSend,
    act: Act,
    key: CreationKey | null,
    deliver: (facts: SendFacts) => Promise<void>,
  ): Promise<CreateOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const earlier = await madeWithKey(tx, tenantId, key);
        if (earlier !== null) return earlier;
      }
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
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
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
      return { outcome: 'created', row: { ...row, roles } };
    });
  }

  /** The Team list, newest first; the count runs over the SAME where. */
  async list(
    tenantId: string,
    filter: { status?: InvitationStatus },
    page: { limit: number; offset: number },
    now: number,
  ): Promise<{ items: InvitationRow[]; totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
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
   * A revoked one is the same act repeated — a retry — and answers the invite, writing nothing
   * (`F4-07`).
   */
  async revoke(tenantId: string, id: string, act: Act): Promise<RevokeOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
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
      if (!row) return refusalFor(tx, tenantId, id);
      await recordAuditEntry(tx, inviteAct('team.invite_revoked', tenantId, id, act));
      const [revoked] = await withRoles(tx, tenantId, [row]);
      if (!revoked) throw new Error('the invitation vanished inside its own transaction');
      return { outcome: 'done', invitation: revoked };
    });
  }
}

/**
 * Why a revoke touched nothing: no such invite in this company, one already revoked — the retry,
 * answered with the invite — or one already answered by the invitee.
 */
async function refusalFor(
  tx: TenantScopedDb,
  tenantId: string,
  id: string,
): Promise<RevokeOutcome> {
  const [row] = await tx
    .select(invitationColumns())
    .from(invitation)
    .where(and(eq(invitation.tenantId, tenantId), eq(invitation.id, id)))
    .limit(1);
  if (!row) return { outcome: 'not-found' };
  if (row.status !== 'revoked') return { outcome: 'not-pending' };
  const [revoked] = await withRoles(tx, tenantId, [row]);
  if (!revoked) throw new Error('the invitation vanished inside its own transaction');
  return { outcome: 'done', invitation: revoked };
}

/** The invite an earlier send with this key made, read as that send's answer — or none. */
async function madeWithKey(
  tx: TenantScopedDb,
  tenantId: string,
  key: CreationKey,
): Promise<Keyed<InvitationRow> | null> {
  const [made] = await tx
    .select({ ...invitationColumns(), fingerprint: invitation.creationFingerprint })
    .from(invitation)
    .where(and(eq(invitation.tenantId, tenantId), eq(invitation.creationKey, key.key)))
    .limit(1);
  if (!made) return null;
  const { fingerprint, ...row } = made;
  const [withItsRoles] = await withRoles(tx, tenantId, [row]);
  if (!withItsRoles) throw new Error('the invitation vanished inside its own transaction');
  return replayOf(withItsRoles, fingerprint, key);
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
  tx: TenantScopedDb,
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
