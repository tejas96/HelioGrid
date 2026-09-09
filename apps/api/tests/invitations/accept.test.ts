import { auditLogEntry, invitation, tenantMembership, userAccount } from '@heliogrid/db';
import {
  FOUNDER_ROLE,
  INVITATION_EXPIRY_DAYS,
  ROLE_PRESETS,
  type RolePreset,
} from '@heliogrid/domain';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  acceptInvitation,
  InvitationAdminRepository,
} from '../../src/modules/invitation/invitation.admin.repository';
import {
  aCompany,
  aMembership,
  anInvite,
  aPerson,
  aPhone,
  type Fixture,
  openPools,
  rolesHeldBy,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The one-step join against REAL state (`M01-13`, `M01-17`): what only a database can show is
 * that the membership, its roles, the invitation's flip, the name and the entry are ONE
 * transaction — a failure after them leaves nothing — that a person who already holds an account
 * gains a membership and never a second account, and that a link which has run out, been
 * withdrawn or already answered admits nobody. The person's account exists before the join, as
 * at signup: the code they verified made it, on the front door's own path.
 */

const OWNER = FOUNDER_ROLE;
const [SALES, SURVEY] = ROLE_PRESETS.filter((preset) => preset !== OWNER) as [
  RolePreset,
  RolePreset,
];
const MS_PER_SECOND = 1_000;
const DAY = 24 * 60 * 60 * MS_PER_SECOND;
const NOW = Date.now();
/** Sent one day before the window opened, so the link ran out yesterday. */
const RAN_OUT_YESTERDAY = NOW - (INVITATION_EXPIRY_DAYS + 1) * DAY;

const here = aCompany('Joining EPC');
const elsewhere = aCompany('Neighbour EPC');
const owner = aPerson('Rajesh Sharma');
const newcomer = aPerson('Priya Kulkarni');
const veteran = aPerson('Nitin Pawar');
const latecomer = aPerson('Asha Patil');
const ownerHere = aMembership(here, owner, [OWNER]);
const veteranElsewhere = aMembership(elsewhere, veteran, [OWNER]);

const toNewcomer = anInvite(here, owner, newcomer, [SURVEY, SALES]);
const toVeteran = anInvite(here, owner, { name: 'N. Pawar', phoneE164: veteran.phoneE164 }, [
  SALES,
]);
const toLatecomer = anInvite(here, owner, latecomer, [SALES]);
const toOwner = anInvite(here, owner, owner, [SALES]);
const runOut = anInvite(here, owner, { name: 'Late Link', phoneE164: aPhone() }, [SALES], {
  sentAt: RAN_OUT_YESTERDAY,
});
const withdrawn = anInvite(here, owner, { name: 'Gone Link', phoneE164: aPhone() }, [SALES], {
  status: 'revoked',
});

const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, newcomer, veteran, latecomer],
  memberships: [ownerHere, veteranElsewhere],
  invites: [toNewcomer, toVeteran, toLatecomer, toOwner, runOut, withdrawn],
};

const skip = skipWithoutDatabase(
  'INVITATION-ACCEPT PROOF',
  'The atomic join is UNPROVEN in this run — only its pure decisions are.',
);

describe.skipIf(skip)('the one-step join, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let invites: InvitationAdminRepository;

  beforeAll(async () => {
    pools = openPools();
    invites = new InvitationAdminRepository(pools.admin.db);
    await seed(pools.admin.db, fixture);
    // A newcomer verified a code and typed nothing yet: the account exists, the name does not.
    await pools.admin.db
      .update(userAccount)
      .set({ name: null })
      .where(eq(userAccount.id, newcomer.userId));
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('writes the membership, its roles in matrix order, the flip, the name and the entry', async () => {
    const joined = await invites.accept(toNewcomer.tokenHash, newcomer.userId, NOW);
    expect(joined).toEqual({ outcome: 'done', tenantId: here.tenantId });
    const membership = await membershipOf(newcomer.userId, here.tenantId);
    expect(membership?.status).toBe('active');
    expect(await rolesHeldBy(pools.admin.db, membership?.id ?? '')).toEqual([SALES, SURVEY]);
    expect(await statusOf(toNewcomer.invitationId)).toBe('accepted');
    expect(await nameOf(newcomer.userId)).toBe(newcomer.name);
    const [entry] = await entriesOf('team.invite_accepted');
    expect(entry).toMatchObject({
      actorRef: newcomer.userId,
      subjectKind: 'invitation',
      subjectRef: toNewcomer.invitationId,
      blocked: false,
    });
  });

  it('is ONE transaction — a failure after the writes leaves no membership, no role, no flip', async () => {
    await expect(
      pools.admin.db.transaction(async (tx) => {
        const joined = await acceptInvitation(tx, {
          tokenHash: toLatecomer.tokenHash,
          userId: latecomer.userId,
          now: NOW,
        });
        expect(joined.outcome).toBe('done');
        throw new Error('the join failed after its rows were written');
      }),
    ).rejects.toThrow();
    expect(await membershipOf(latecomer.userId, here.tenantId)).toBeNull();
    expect(await statusOf(toLatecomer.invitationId)).toBe('pending');
    expect((await entriesOf('team.invite_accepted')).map((e) => e.subjectRef)).not.toContain(
      toLatecomer.invitationId,
    );
  });

  it('gives a person who already holds an account elsewhere a membership here and no second account', async () => {
    const joined = await invites.accept(toVeteran.tokenHash, veteran.userId, NOW);
    expect(joined.outcome).toBe('done');
    expect((await membershipOf(veteran.userId, here.tenantId))?.status).toBe('active');
    expect((await membershipOf(veteran.userId, elsewhere.tenantId))?.id).toBe(
      veteranElsewhere.membershipId,
    );
    expect(await accountsWithPhone(veteran.phoneE164)).toBe(1);
    // A name the person already chose stays; the inviter's spelling fills only an empty one.
    expect(await nameOf(veteran.userId)).toBe(veteran.name);
  });

  it.each([
    { link: 'one already answered', invite: () => toNewcomer },
    { link: 'one that has run out', invite: () => runOut },
    { link: 'one that was withdrawn', invite: () => withdrawn },
  ])('admits nobody through $link', async ({ invite }) => {
    const before = await membershipOf(latecomer.userId, here.tenantId);
    expect(await invites.accept(invite().tokenHash, latecomer.userId, NOW)).toEqual({
      outcome: 'not-pending',
    });
    expect(await membershipOf(latecomer.userId, here.tenantId)).toEqual(before);
  });

  it('refuses a person who is already on this team, and writes nothing', async () => {
    expect(await invites.accept(toOwner.tokenHash, owner.userId, NOW)).toEqual({
      outcome: 'already-member',
    });
    expect(await statusOf(toOwner.invitationId)).toBe('pending');
    expect(await rolesHeldBy(pools.admin.db, ownerHere.membershipId)).toEqual([OWNER]);
  });

  async function membershipOf(userId: string, tenantId: string) {
    const [row] = await pools.admin.db
      .select({ id: tenantMembership.id, status: tenantMembership.status })
      .from(tenantMembership)
      .where(
        and(eq(tenantMembership.userAccountId, userId), eq(tenantMembership.tenantId, tenantId)),
      )
      .limit(1);
    return row ?? null;
  }

  async function statusOf(invitationId: string): Promise<string> {
    const [row] = await pools.admin.db
      .select({ status: invitation.status })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);
    return row?.status ?? 'gone';
  }

  async function nameOf(userId: string): Promise<string | null> {
    const [row] = await pools.admin.db
      .select({ name: userAccount.name })
      .from(userAccount)
      .where(eq(userAccount.id, userId))
      .limit(1);
    return row?.name ?? null;
  }

  async function accountsWithPhone(phoneE164: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: userAccount.id })
      .from(userAccount)
      .where(eq(userAccount.phoneE164, phoneE164));
    return rows.length;
  }

  function entriesOf(eventType: string) {
    return pools.admin.db
      .select()
      .from(auditLogEntry)
      .where(
        sql`${auditLogEntry.tenantId} = ${here.tenantId} and ${auditLogEntry.eventType}::text = ${eventType}`,
      )
      .orderBy(auditLogEntry.occurredAt, auditLogEntry.id);
  }
});
