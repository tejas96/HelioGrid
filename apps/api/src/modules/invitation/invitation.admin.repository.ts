import {
  type Db,
  type DbTransaction,
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
import { memberAct, recordAuditEntry } from '../audit/audit.public';

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
 * How a join ended (`M01-13`): the company joined — or joined already by this same person, whose
 * repeat answers as the join did (`F4-07`) — or the one reason nothing was written: the link no
 * longer lands (answered, withdrawn or run out), or the person is already on this team.
 */
export type AcceptOutcome =
  | { readonly outcome: 'done'; readonly tenantId: string }
  | { readonly outcome: 'not-pending' | 'already-member' };

/**
 * The invited person's way in, which crosses tenancy by nature — they hold no membership until the
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
}

/**
 * The join as one step on the caller's transaction, exported so its atomicity can be PROVEN: a
 * failure anywhere after it rolls every row it wrote back — the membership, its roles, the
 * invitation's flip, the name and the entry — and the invitation still lands (`M01-13`).
 */
export async function acceptInvitation(
  tx: DbTransaction,
  input: { tokenHash: string; userId: string; now: number },
): Promise<AcceptOutcome> {
  const row = await lockedByToken(tx, input.tokenHash);
  // A lost answer retried: the join landed, so it answers again and writes nothing more.
  if (row?.status === 'accepted' && (await joinedThrough(tx, row, input.userId))) {
    return { outcome: 'done', tenantId: row.tenantId };
  }
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
  await recordAuditEntry(
    tx,
    memberAct(
      'team.invite_accepted',
      row.tenantId,
      { kind: 'invitation', ref: row.id },
      { actorUserId: input.userId, now: input.now },
    ),
  );
  return { outcome: 'done', tenantId: row.tenantId };
}

/** The row behind a link, locked for the write that follows. */
export async function lockedByToken(tx: DbTransaction, tokenHash: string) {
  const [row] = await tx
    .select({
      id: invitation.id,
      tenantId: invitation.tenantId,
      inviteeName: invitation.inviteeName,
      inviterUserId: invitation.inviterUserId,
      phoneE164: invitation.inviteePhoneE164,
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

/**
 * Whether this person is the one an accepted invite let in: the invite's own phone, still active in
 * its company. Anyone else — a teammate there included — finds the answered link landing nowhere.
 */
async function joinedThrough(
  tx: DbTransaction,
  row: { tenantId: string; phoneE164: string },
  userId: string,
): Promise<boolean> {
  const [joined] = await tx
    .select({ id: tenantMembership.id })
    .from(tenantMembership)
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(
      and(
        eq(tenantMembership.tenantId, row.tenantId),
        eq(tenantMembership.userAccountId, userId),
        eq(tenantMembership.status, 'active'),
        eq(userAccount.phoneE164, row.phoneE164),
      ),
    )
    .limit(1);
  return joined !== undefined;
}

export function lifeOf(row: { status: InvitationStatus; expiresAt: Date }) {
  return { status: row.status, expiresAt: row.expiresAt.getTime() };
}
