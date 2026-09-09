import {
  type Db,
  invitation,
  invitationRole,
  membershipRole,
  tenant,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import { type InvitationStatus, invitationStatus, type RolePreset } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { recordAuditEntry } from '../audit/audit.public';

/** The invite as the invited person opens it — no session, no tenant; the link's secret is the key. */
export interface LandingRow {
  readonly id: string;
  readonly tenantId: string;
  readonly inviterName: string | null;
  readonly companyName: string;
  readonly inviteeName: string;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly status: InvitationStatus;
  readonly expiresAt: Date;
}

/**
 * How a join ended (`M01-13`): the company joined, or the one reason nothing was written — the
 * link no longer lands (answered, withdrawn or run out), or the person is already on this team.
 */
export type AcceptOutcome =
  | { readonly outcome: 'done'; readonly tenantId: string }
  | { readonly outcome: 'not-pending' | 'already-member' };

export type DeclineOutcome = { readonly outcome: 'done' | 'not-found' | 'not-pending' };
export type ReinviteOutcome = { readonly outcome: 'done' | 'not-found' | 'not-expired' };

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * The invited person's side, which crosses tenancy by nature — they hold no membership until the
 * accept writes one — so it rides the admin pool, on the same explicit path as signup. Every
 * write here re-reads the row under a lock and asks domain what the invite is NOW, so a revoke
 * and an accept racing on one link cannot both win.
 */
@Injectable()
export class InvitationAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async byTokenHash(tokenHash: string): Promise<LandingRow | null> {
    const [row] = await this.db
      .select({
        id: invitation.id,
        tenantId: invitation.tenantId,
        inviterName: userAccount.name,
        companyName: tenant.companyName,
        inviteeName: invitation.inviteeName,
        phoneE164: invitation.inviteePhoneE164,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .innerJoin(tenant, eq(tenant.id, invitation.tenantId))
      .innerJoin(userAccount, eq(userAccount.id, invitation.inviterUserId))
      .where(eq(invitation.tokenHash, tokenHash))
      .limit(1);
    if (!row) return null;
    const carried = await this.db
      .select({ rolePreset: invitationRole.rolePreset })
      .from(invitationRole)
      .where(eq(invitationRole.invitationId, row.id))
      .orderBy(invitationRole.rolePreset);
    return { ...row, roles: carried.map((r) => r.rolePreset) };
  }

  /** The join (`M01-13`): one transaction, never a half-joined state. */
  async accept(tokenHash: string, userId: string, now: number): Promise<AcceptOutcome> {
    return this.db.transaction((tx) => acceptInvitation(tx, { tokenHash, userId, now }));
  }

  /** The wrong person got the invite: it is voided, and the record says so (`M01.2` S1.wrong.2). */
  async decline(tokenHash: string, now: number): Promise<DeclineOutcome> {
    return this.db.transaction(async (tx) => {
      const row = await lockedByToken(tx, tokenHash);
      if (!row) return { outcome: 'not-found' };
      if (invitationStatus(lifeOf(row), now) !== 'pending') return { outcome: 'not-pending' };
      await tx
        .update(invitation)
        .set({ status: 'declined', declinedAt: new Date(now) })
        .where(eq(invitation.id, row.id));
      return { outcome: 'done' };
    });
  }

  /**
   * The link ran out: the one-tap ask (`M01.2` S1.wrong.1). Stamped once — a second tap asks
   * nobody twice — and the notification the inviter receives is emitted from that first stamp.
   */
  async requestReinvite(tokenHash: string, now: number): Promise<ReinviteOutcome> {
    return this.db.transaction(async (tx) => {
      const row = await lockedByToken(tx, tokenHash);
      if (!row) return { outcome: 'not-found' };
      if (invitationStatus(lifeOf(row), now) !== 'expired') return { outcome: 'not-expired' };
      if (row.reinviteRequestedAt === null) {
        await tx
          .update(invitation)
          .set({ reinviteRequestedAt: new Date(now) })
          .where(eq(invitation.id, row.id));
      }
      return { outcome: 'done' };
    });
  }
}

/**
 * The join as one step on the caller's transaction, exported so its atomicity can be PROVEN: a
 * failure anywhere after it rolls every row it wrote back — the membership, its roles, the
 * invitation's flip, the name and the entry — and the invitation still lands (`M01-13`).
 */
export async function acceptInvitation(
  tx: Tx,
  input: { tokenHash: string; userId: string; now: number },
): Promise<AcceptOutcome> {
  const row = await lockedByToken(tx, input.tokenHash);
  if (!row || invitationStatus(lifeOf(row), input.now) !== 'pending') {
    return { outcome: 'not-pending' };
  }
  const [existing] = await tx
    .select({ id: tenantMembership.id })
    .from(tenantMembership)
    .where(
      and(
        eq(tenantMembership.tenantId, row.tenantId),
        eq(tenantMembership.userAccountId, input.userId),
      ),
    )
    .limit(1);
  if (existing) return { outcome: 'already-member' };
  const at = new Date(input.now);
  const [membership] = await tx
    .insert(tenantMembership)
    .values({
      tenantId: row.tenantId,
      userAccountId: input.userId,
      status: 'active',
      lastActiveAt: at,
      coachMarksDismissed: 0,
      authorizationVersion: 0,
      createdAt: at,
    })
    .returning({ id: tenantMembership.id });
  if (!membership) throw new Error('tenant_membership insert returned no row');
  const carried = await tx
    .select({ rolePreset: invitationRole.rolePreset })
    .from(invitationRole)
    .where(eq(invitationRole.invitationId, row.id));
  // The contract refuses an empty set before anything sends (F2-21); a row without one is a
  // broken store, not a person to admit with nothing.
  if (carried.length === 0) throw new Error('an invitation carries at least one preset');
  await tx.insert(membershipRole).values(
    carried.map(({ rolePreset }) => ({
      tenantId: row.tenantId,
      membershipId: membership.id,
      rolePreset,
    })),
  );
  await tx
    .update(invitation)
    .set({ status: 'accepted', acceptedAt: at })
    .where(eq(invitation.id, row.id));
  // The inviter's spelling is the first run's pre-fill (`M01-14`); a name the person already chose stays.
  await tx
    .update(userAccount)
    .set({ name: row.inviteeName })
    .where(and(eq(userAccount.id, input.userId), isNull(userAccount.name)));
  await recordAuditEntry(tx, {
    tenantId: row.tenantId,
    eventType: 'team.invite_accepted',
    actorKind: 'tenant_user',
    actorRef: input.userId,
    occurredAt: at,
    blocked: false,
    subjectKind: 'invitation',
    subjectRef: row.id,
    changePayload: null,
  });
  return { outcome: 'done', tenantId: row.tenantId };
}

/** The row behind a link, locked for the write that follows. */
async function lockedByToken(tx: Tx, tokenHash: string) {
  const [row] = await tx
    .select({
      id: invitation.id,
      tenantId: invitation.tenantId,
      inviteeName: invitation.inviteeName,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      reinviteRequestedAt: invitation.reinviteRequestedAt,
    })
    .from(invitation)
    .where(eq(invitation.tokenHash, tokenHash))
    .limit(1)
    .for('update');
  return row ?? null;
}

function lifeOf(row: { status: InvitationStatus; expiresAt: Date }) {
  return { status: row.status, expiresAt: row.expiresAt.getTime() };
}
