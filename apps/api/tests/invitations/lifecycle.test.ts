import { randomUUID } from 'node:crypto';
import { auditLogEntry, invitation } from '@heliogrid/db';
import {
  FOUNDER_ROLE,
  INVITATION_EXPIRY_DAYS,
  INVITATIONS_PER_TENANT_PER_DAY,
  invitationExpiresAt,
  ROLE_PRESETS,
  type RolePreset,
} from '@heliogrid/domain';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InvitationAdminRepository } from '../../src/modules/invitation/invitation.admin.repository';
import {
  type CreateOutcome,
  InvitationRepository,
  type SendFacts,
} from '../../src/modules/invitation/invitation.repository';
import {
  aCompany,
  aMembership,
  anInvite,
  aPerson,
  aPhone,
  type Fixture,
  type Invite,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The invite lifecycle against REAL state (`M01-12`, `M01-04`): the send with its three refusals
 * and the message inside the transaction, the Team list by state, the revoke, the decline and the
 * one-tap ask for a fresh link — each transition at its edges. What an invite IS now is domain's
 * pure decision; what only a database can show is that the send rolls back when the carrier
 * refuses, that the cap counts every send of the day, and that a state once left is not re-entered.
 */

const OWNER = FOUNDER_ROLE;
const [SALES, SURVEY] = ROLE_PRESETS.filter((preset) => preset !== OWNER) as [
  RolePreset,
  RolePreset,
];
const MS_PER_SECOND = 1_000;
const MINUTE = 60 * MS_PER_SECOND;
const DAY = 24 * 60 * MINUTE;
const NOW = Date.now();
/** Sent one day before the window opened, so the link ran out yesterday; the other, the day before. */
const RAN_OUT_YESTERDAY = NOW - (INVITATION_EXPIRY_DAYS + 1) * DAY;
const RAN_OUT_EARLIER = RAN_OUT_YESTERDAY - DAY;
const WHOLE_LIST = { limit: 100, offset: 0 };

const here = aCompany('Inviting EPC');
const crowded = aCompany('Busy EPC');
const elsewhere = aCompany('Neighbour EPC');
const owner = aPerson('Rajesh Sharma');
const spare = aPerson('Priya Kulkarni');
const busyOwner = aPerson('Sunil Deshmukh');
const ownerHere = aMembership(here, owner, [OWNER]);
const spareHere = aMembership(here, spare, [SALES]);
const busyOwnerCrowded = aMembership(crowded, busyOwner, [OWNER]);
const ownerElsewhere = aMembership(elsewhere, owner, [OWNER]);

const runOut = anInvite(here, owner, { name: 'Late Link', phoneE164: aPhone() }, [SALES], {
  sentAt: RAN_OUT_YESTERDAY,
});
const runOutToo = anInvite(here, owner, { name: 'Later Link', phoneE164: aPhone() }, [SALES], {
  sentAt: RAN_OUT_EARLIER,
});
const pendingElsewhere = anInvite(elsewhere, owner, { name: 'Far Link', phoneE164: aPhone() }, [
  SALES,
]);
/** Today's cap, already spent — every send counts, whatever became of it. */
const theDaysSends: Invite[] = Array.from({ length: INVITATIONS_PER_TENANT_PER_DAY }, (_, i) =>
  anInvite(crowded, busyOwner, { name: `Crew ${i}`, phoneE164: aPhone() }, [SALES], {
    status: i % 2 === 0 ? 'pending' : 'revoked',
    sentAt: NOW - (i + 1) * MINUTE,
  }),
);

const fixture: Fixture = {
  companies: [here, crowded, elsewhere],
  people: [owner, spare, busyOwner],
  memberships: [ownerHere, spareHere, busyOwnerCrowded, ownerElsewhere],
  invites: [runOut, runOutToo, pendingElsewhere, ...theDaysSends],
};

const skip = skipWithoutDatabase(
  'INVITATION-LIFECYCLE PROOF',
  'The invite lifecycle is UNPROVEN in this run — only its pure decisions are.',
);

describe.skipIf(skip)('the invite lifecycle, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let tenantSide: InvitationRepository;
  let landingSide: InvitationAdminRepository;
  const delivered: SendFacts[] = [];
  const newcomerPhone = aPhone();
  let sentToNewcomer: string;

  beforeAll(async () => {
    pools = openPools();
    tenantSide = new InvitationRepository(pools.runtime.db);
    landingSide = new InvitationAdminRepository(pools.admin.db);
    await seed(pools.admin.db, fixture);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('sends: a pending invite that runs out in seven days, its presets once each in matrix order, its entry, and the message with the tenant’s own facts', async () => {
    const sent = done(
      await send(here.tenantId, owner.userId, newcomerPhone, [SURVEY, SALES, SALES]),
    );
    sentToNewcomer = sent.id;
    expect(sent.status).toBe('pending');
    expect(sent.expiresAt.getTime()).toBe(invitationExpiresAt(NOW));
    expect(sent.roles).toEqual([SALES, SURVEY]);
    expect(delivered).toEqual([
      { inviterName: owner.name, companyName: here.companyName, defaultLanguage: 'en' },
    ]);
    const [entry] = await entriesOf(here.tenantId, 'team.invite_sent');
    expect(entry).toMatchObject({ actorRef: owner.userId, subjectRef: sent.id });
  });

  it.each([
    {
      who: 'a phone already on this team',
      phone: () => spare.phoneE164,
      refusal: 'already-member',
    },
    { who: 'a phone with a live invite', phone: () => newcomerPhone, refusal: 'already-invited' },
  ])('refuses $who as $refusal, and sends nothing', async ({ phone, refusal }) => {
    const before = delivered.length;
    expect((await send(here.tenantId, owner.userId, phone(), [SALES])).outcome).toBe(refusal);
    expect(delivered).toHaveLength(before);
  });

  it('lets a phone whose earlier invite ran out be invited again', async () => {
    expect((await send(here.tenantId, owner.userId, runOut.phoneE164, [SALES])).outcome).toBe(
      'done',
    );
  });

  it('rolls the whole send back when the carrier refuses, so the link that never arrived counts against nothing', async () => {
    const phone = aPhone();
    const before = await sendsOf(here.tenantId);
    await expect(
      tenantSide.create(
        here.tenantId,
        { inviteeName: 'Never Reached', phoneE164: phone, roles: [SALES], tokenHash: randomUUID() },
        { actorUserId: owner.userId, now: NOW },
        async () => {
          throw new Error('carrier refused');
        },
      ),
    ).rejects.toThrow('carrier refused');
    expect(await sendsOf(here.tenantId)).toBe(before);
  });

  it('refuses the next send once the day’s cap is spent, revoked sends included', async () => {
    const refused = await send(crowded.tenantId, busyOwner.userId, aPhone(), [SALES]);
    expect(refused.outcome).toBe('capped');
  });

  it('lists by state — live, run out, every state — newest first, with the count over the same filter', async () => {
    const live = await tenantSide.list(here.tenantId, { status: 'pending' }, WHOLE_LIST, NOW);
    expect(live.items.map((row) => row.phoneE164)).toEqual([runOut.phoneE164, newcomerPhone]);
    expect(live.totalCount).toBe(2);
    const expired = await tenantSide.list(here.tenantId, { status: 'expired' }, WHOLE_LIST, NOW);
    expect(expired.items.map((row) => row.id)).toEqual([
      runOut.invitationId,
      runOutToo.invitationId,
    ]);
    const all = await tenantSide.list(here.tenantId, {}, WHOLE_LIST, NOW);
    expect(all.totalCount).toBe(live.totalCount + expired.totalCount);
    expect(all.items.map((row) => row.id)).not.toContain(pendingElsewhere.invitationId);
  });

  it('revokes a pending invite once, with its entry; a second revoke and an answered invite have nothing to withdraw', async () => {
    const revoked = await tenantSide.revoke(here.tenantId, sentToNewcomer, by(owner.userId));
    expect(revoked.outcome).toBe('done');
    expect(await statusOf(sentToNewcomer)).toBe('revoked');
    const [entry] = await entriesOf(here.tenantId, 'team.invite_revoked');
    expect(entry).toMatchObject({ actorRef: owner.userId, subjectRef: sentToNewcomer });
    expect((await tenantSide.revoke(here.tenantId, sentToNewcomer, by(owner.userId))).outcome).toBe(
      'not-pending',
    );
  });

  it.each([
    { subject: 'nobody at all', id: () => randomUUID() },
    { subject: 'an invite of another company', id: () => pendingElsewhere.invitationId },
  ])('answers not-found on a revoke of $subject — never that the row exists', async ({ id }) => {
    expect((await tenantSide.revoke(here.tenantId, id(), by(owner.userId))).outcome).toBe(
      'not-found',
    );
  });

  it('declines a live invite once; an answered or run-out one is not open to decline', async () => {
    const sent = done(await send(here.tenantId, owner.userId, aPhone(), [SALES]));
    const hash = await tokenHashOf(sent.id);
    expect(await landingSide.decline(hash, NOW)).toEqual({ outcome: 'done' });
    expect(await statusOf(sent.id)).toBe('declined');
    expect(await landingSide.decline(hash, NOW)).toEqual({ outcome: 'not-pending' });
    expect(await landingSide.decline(runOut.tokenHash, NOW)).toEqual({ outcome: 'not-pending' });
    expect(await landingSide.decline(randomUUID(), NOW)).toEqual({ outcome: 'not-found' });
  });

  it('stamps the one-tap re-invite ask once on a run-out invite, and refuses it on a live one', async () => {
    expect(await landingSide.requestReinvite(runOutToo.tokenHash, NOW)).toEqual({
      outcome: 'done',
    });
    const first = await reinviteStampOf(runOutToo.invitationId);
    expect(first).not.toBeNull();
    expect(await landingSide.requestReinvite(runOutToo.tokenHash, NOW + MINUTE)).toEqual({
      outcome: 'done',
    });
    expect(await reinviteStampOf(runOutToo.invitationId)).toEqual(first);
    const live = done(await send(here.tenantId, owner.userId, aPhone(), [SALES]));
    expect(await landingSide.requestReinvite(await tokenHashOf(live.id), NOW)).toEqual({
      outcome: 'not-expired',
    });
    expect(await landingSide.requestReinvite(randomUUID(), NOW)).toEqual({ outcome: 'not-found' });
  });

  function send(tenantId: string, actorUserId: string, phoneE164: string, roles: RolePreset[]) {
    return tenantSide.create(
      tenantId,
      { inviteeName: 'New Person', phoneE164, roles, tokenHash: randomUUID() },
      by(actorUserId),
      async (facts) => {
        delivered.push(facts);
      },
    );
  }

  function by(actorUserId: string) {
    return { actorUserId, now: NOW };
  }

  function done(result: CreateOutcome) {
    if (result.outcome !== 'done') throw new Error(`expected a send, got ${result.outcome}`);
    return result.invitation;
  }

  async function statusOf(invitationId: string): Promise<string> {
    const [row] = await pools.admin.db
      .select({ status: invitation.status })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);
    return row?.status ?? 'gone';
  }

  async function tokenHashOf(invitationId: string): Promise<string> {
    const [row] = await pools.admin.db
      .select({ tokenHash: invitation.tokenHash })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);
    return row?.tokenHash ?? '';
  }

  async function reinviteStampOf(invitationId: string): Promise<Date | null> {
    const [row] = await pools.admin.db
      .select({ at: invitation.reinviteRequestedAt })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);
    return row?.at ?? null;
  }

  async function sendsOf(tenantId: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: invitation.id })
      .from(invitation)
      .where(and(eq(invitation.tenantId, tenantId)));
    return rows.length;
  }

  function entriesOf(tenantId: string, eventType: string) {
    return pools.admin.db
      .select()
      .from(auditLogEntry)
      .where(
        sql`${auditLogEntry.tenantId} = ${tenantId} and ${auditLogEntry.eventType}::text = ${eventType}`,
      )
      .orderBy(auditLogEntry.occurredAt, auditLogEntry.id);
  }
});
