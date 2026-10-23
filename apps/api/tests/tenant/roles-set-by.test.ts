import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditLogEntry, tenantMembership } from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InvitationAdminRepository } from '../../src/modules/invitation/invitation.admin.repository';
import { MyMembershipRepository } from '../../src/modules/tenant/tenant.my-membership.repository';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository';
import {
  aCompany,
  aMembership,
  anInvite,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * Who last set a person's roles (`SCR-M01-10` ruling 15), against REAL state: the join writes the
 * inviter in the same transaction as the roles, a role change writes the person who made it, the
 * founder has none, and migration 0028's backfill reads the same answer out of the audit log.
 */

const OWNER = FOUNDER_ROLE;
/** Two working presets; which two does not matter, only that a change moves between them. */
const [FIRST_PRESET, SECOND_PRESET] = ROLE_PRESETS.filter((preset) => preset !== OWNER) as [
  RolePreset,
  RolePreset,
];
const NOW = Date.now();
const MINUTE = 60_000;
/** Each act a minute after the one before, so the audit log's order is the story's. */
const CHANGED = NOW + MINUTE;
const UNCHANGED = CHANGED + MINUTE;
const LATER_CHANGE = UNCHANGED + MINUTE;
const BLOCKED_LAST = LATER_CHANGE + MINUTE;

const here = aCompany('Credit Line EPC');
const owner = aPerson('Rajesh Sharma');
const second = aPerson('Meera Shah');
const newcomer = aPerson('Priya Kulkarni');
const latecomer = aPerson('Kavita Joshi');
const veteran = aPerson('Asha Patil');
const ownerHere = aMembership(here, owner, [OWNER]);
const secondHere = aMembership(here, second, [OWNER]);
const veteranHere = aMembership(here, veteran, [FIRST_PRESET]);
const toNewcomer = anInvite(here, owner, newcomer, [FIRST_PRESET]);
const toLatecomer = anInvite(here, second, latecomer, [FIRST_PRESET]);

const fixture: Fixture = {
  companies: [here],
  people: [owner, second, newcomer, latecomer, veteran],
  memberships: [ownerHere, secondHere, veteranHere],
  invites: [toNewcomer, toLatecomer],
};

const skip = skipWithoutDatabase(
  'ROLES-SET-BY PROOF',
  'Who set a person roles is UNPROVEN in this run — only the card words are.',
);

/** Migration 0028's backfill, held to the rows this proof owns: the suites share one database. */
function backfillOf(membershipIds: readonly string[]) {
  const file = readFileSync(
    join(__dirname, '../../../../packages/db/migrations/0028_membership_roles_set_by.sql'),
    'utf8',
  );
  const update = file.slice(file.indexOf('UPDATE "tenant_membership"'), file.lastIndexOf(';'));
  const ids = membershipIds.map((id) => `'${id}'`).join(', ');
  return sql.raw(`${update} WHERE m."id" IN (${ids})`);
}

describe.skipIf(skip)('who last set a person’s roles, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let invites: InvitationAdminRepository;
  let tenants: TenantRepository;
  let mine: MyMembershipRepository;

  const membershipOf = async (userId: string) => {
    const [row] = await pools.admin.db
      .select({ id: tenantMembership.id, setter: tenantMembership.rolesSetByUserId })
      .from(tenantMembership)
      .where(
        and(
          eq(tenantMembership.tenantId, here.tenantId),
          eq(tenantMembership.userAccountId, userId),
        ),
      );
    if (!row) throw new Error('no membership for this person here');
    return row;
  };

  beforeAll(async () => {
    pools = openPools();
    invites = new InvitationAdminRepository(pools.admin.db);
    tenants = new TenantRepository(pools.tenants);
    mine = new MyMembershipRepository(pools.tenants);
    await seed(pools.admin.db, fixture);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('the join names the inviter, in the same write as the roles', async () => {
    await invites.accept(toNewcomer.tokenHash, newcomer.userId, NOW);
    expect((await membershipOf(newcomer.userId)).setter).toBe(owner.userId);
    expect((await mine.read(here.tenantId, newcomer.userId))?.rolesSetByName).toBe(owner.name);
  });

  it('a role change names who made it', async () => {
    const { id } = await membershipOf(newcomer.userId);
    await tenants.assignRoles(here.tenantId, id, [FIRST_PRESET, SECOND_PRESET], {
      actorUserId: second.userId,
      now: CHANGED,
    });
    expect((await membershipOf(newcomer.userId)).setter).toBe(second.userId);
    expect((await mine.read(here.tenantId, newcomer.userId))?.rolesSetByName).toBe(second.name);
  });

  it('a role change that changes nothing names nobody new', async () => {
    const { id } = await membershipOf(newcomer.userId);
    await tenants.assignRoles(here.tenantId, id, [SECOND_PRESET, FIRST_PRESET], {
      actorUserId: owner.userId,
      now: UNCHANGED,
    });
    expect((await membershipOf(newcomer.userId)).setter).toBe(second.userId);
  });

  it('the founder has none', async () => {
    expect(await mine.read(here.tenantId, owner.userId)).toEqual({
      coachMarksDismissed: 0,
      rolesSetByName: null,
    });
  });

  it('the backfill takes the latest written change (a blocked one skipped), else the inviter, else null', async () => {
    await invites.accept(toLatecomer.tokenHash, latecomer.userId, NOW);
    const changed = await membershipOf(newcomer.userId);
    const joined = await membershipOf(latecomer.userId);
    await pools.admin.db.insert(auditLogEntry).values(
      [
        { actor: owner.userId, at: LATER_CHANGE, blocked: false },
        { actor: second.userId, at: BLOCKED_LAST, blocked: true },
      ].map(({ actor, at, blocked }) => ({
        tenantId: here.tenantId,
        eventType: 'team.roles_changed' as const,
        actorKind: 'tenant_user' as const,
        actorRef: actor,
        occurredAt: new Date(at),
        blocked,
        subjectKind: 'tenant_membership' as const,
        subjectRef: veteranHere.membershipId,
        changePayload: { from: [FIRST_PRESET], to: [FIRST_PRESET, SECOND_PRESET] },
      })),
    );
    const ids = [changed.id, joined.id, veteranHere.membershipId, ownerHere.membershipId];
    await pools.admin.db
      .update(tenantMembership)
      .set({ rolesSetByUserId: null })
      .where(inArray(tenantMembership.id, ids));

    await pools.admin.db.execute(backfillOf(ids));

    expect((await membershipOf(newcomer.userId)).setter).toBe(second.userId);
    expect((await membershipOf(latecomer.userId)).setter).toBe(second.userId);
    expect((await membershipOf(veteran.userId)).setter).toBe(owner.userId);
    expect((await membershipOf(owner.userId)).setter).toBeNull();
  });
});
