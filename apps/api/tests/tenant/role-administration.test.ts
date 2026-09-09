import { randomUUID } from 'node:crypto';
import { membershipRole, session, tenantMembership } from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthAdminRepository } from '../../src/modules/auth/internal/auth.admin.repository';
import {
  TenantRepository,
  type TransitionOutcome,
} from '../../src/modules/tenant/tenant.repository';
import {
  aCompany,
  aDevice,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The guarded transitions against REAL state (`F2-19`, `F2-20`). The decision itself is proven
 * pure in `packages/domain/tests/authz/administration.test.ts`; what only a database can show is
 * the transaction around it — that a refusal writes nothing, that a role set is REPLACED rather
 * than added to, that every change moves the authorization version on, and that ending someone's
 * access ends their sessions in THIS company and no other. The entry each transition writes is
 * `apps/api/tests/audit/audit-log.test.ts`'s.
 *
 * The repositories are driven directly, as `tenant.service.ts` composes them. Migration 0003's
 * grants are what let the runtime role write these rows at all; the policy over them is the
 * tenancy invariant's.
 */

/**
 * The presets by their PART in the law rather than by name: the one the guard protects, and two
 * others in the order the matrix fixes them (`F2-25`). Derived from the model's own tuple, so a
 * preset renamed there renames it here and this file never becomes a second copy of the twelve.
 */
const OWNER = FOUNDER_ROLE;
const [EARLIER, LATER] = twoPresetsBesidesTheOwner();

function twoPresetsBesidesTheOwner(): readonly [RolePreset, RolePreset] {
  const [earlier, later] = ROLE_PRESETS.filter((preset) => preset !== OWNER);
  if (earlier === undefined || later === undefined) {
    throw new Error('the matrix holds fewer presets than this proof needs');
  }
  return [earlier, later];
}

/**
 * Two companies. One holds an owner and a second person it can spare; the other holds that same
 * person again, so the session sweep has something it must NOT touch.
 */
const here = aCompany('Guarded EPC');
const elsewhere = aCompany('Neighbour EPC');
const owner = aPerson('Rajesh Sharma');
const spare = aPerson('Priya Kulkarni');
const ownerHere = aMembership(here, owner, [OWNER]);
const spareHere = aMembership(here, spare, [LATER]);
const spareElsewhere = aMembership(elsewhere, spare, [OWNER]);
const deviceHere = aDevice(spare, here);
const deviceElsewhere = aDevice(spare, elsewhere);

const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, spare],
  memberships: [ownerHere, spareHere, spareElsewhere],
  devices: [deviceHere, deviceElsewhere],
};

const skip = skipWithoutDatabase(
  'ROLE-ADMINISTRATION PROOF',
  'The guarded transitions are UNPROVEN in this run — only their pure decision is.',
);

describe.skipIf(skip)(
  'the guarded transitions of role administration, against a migrated database',
  () => {
    let pools: ReturnType<typeof openPools>;
    let tenants: TenantRepository;
    let sessions: AuthAdminRepository;

    beforeAll(async () => {
      pools = openPools();
      tenants = new TenantRepository(pools.runtime.db);
      sessions = new AuthAdminRepository(pools.admin.db);
      await seed(pools.admin.db, fixture);
    });

    afterAll(async () => {
      await unseed(pools.admin.db, fixture);
      await pools.close();
    });

    it('replaces the whole role set, once per preset, in the matrix order the chips render', async () => {
      const before = await versionOf(spareHere.membershipId);
      const member = done(
        await tenants.assignRoles(
          here.tenantId,
          spareHere.membershipId,
          [LATER, EARLIER, EARLIER],
          by(),
        ),
      );
      expect(member.roles).toEqual([EARLIER, LATER]);
      expect(await versionOf(spareHere.membershipId)).toBe(before + 1);
    });

    it('refuses to remove the only EPC Owner’s preset, and writes nothing at all', async () => {
      const before = await versionOf(ownerHere.membershipId);
      const refused = await tenants.assignRoles(
        here.tenantId,
        ownerHere.membershipId,
        [EARLIER],
        by(),
      );
      expect(refused.outcome).toBe('last-owner');
      expect(await rolesOf(ownerHere.membershipId)).toEqual([OWNER]);
      expect(await versionOf(ownerHere.membershipId)).toBe(before);
    });

    it('accepts the same write once it keeps the owner preset', async () => {
      const member = done(
        await tenants.assignRoles(here.tenantId, ownerHere.membershipId, [EARLIER, OWNER], by()),
      );
      expect(member.roles).toEqual([OWNER, EARLIER]);
    });

    it('refuses to deactivate the only EPC Owner, and leaves them active', async () => {
      const refused = await tenants.deactivate(here.tenantId, ownerHere.membershipId, by());
      expect(refused.outcome).toBe('last-owner');
      expect(await statusOf(ownerHere.membershipId)).toBe('active');
    });

    it('deactivates anyone the company can spare, keeping their name and their presets', async () => {
      const before = await versionOf(spareHere.membershipId);
      const member = done(await tenants.deactivate(here.tenantId, spareHere.membershipId, by()));
      expect(member.status).toBe('deactivated');
      expect(member.name).toBe(spare.name);
      expect(member.roles).toEqual([EARLIER, LATER]);
      expect(await versionOf(spareHere.membershipId)).toBe(before + 1);
    });

    it('ends that person’s sessions in this company and leaves another company’s alone', async () => {
      await sessions.revokeSessionsUnder(spare.userId, here.tenantId, Date.now());
      expect(await revokedAtOf(deviceHere.sessionId)).not.toBeNull();
      expect(await revokedAtOf(deviceElsewhere.sessionId)).toBeNull();
    });

    it.each([
      {
        act: 'a role write',
        run: () => tenants.assignRoles(here.tenantId, spareHere.membershipId, [EARLIER], by()),
      },
      {
        act: 'a second deactivation',
        run: () => tenants.deactivate(here.tenantId, spareHere.membershipId, by()),
      },
    ])('answers not-active to $act on someone already deactivated', async ({ run }) => {
      expect((await run()).outcome).toBe('not-active');
    });

    it.each([
      { subject: 'nobody at all', membershipId: randomUUID() },
      { subject: 'a membership of another company', membershipId: spareElsewhere.membershipId },
    ])('answers not-found for $subject — never that the row exists', async ({ membershipId }) => {
      expect(
        (await tenants.assignRoles(here.tenantId, membershipId, [EARLIER], by())).outcome,
      ).toBe('not-found');
      expect((await tenants.deactivate(here.tenantId, membershipId, by())).outcome).toBe(
        'not-found',
      );
    });

    /** Who is asking, and when — the entry each transition writes is proven in its own file. */
    function by() {
      return { actorUserId: owner.userId, now: Date.now() };
    }

    /** The row a completed transition produced; anything else fails the step by its own reason. */
    function done(result: TransitionOutcome) {
      if (result.outcome !== 'done') {
        throw new Error(`expected a completed transition, got ${result.outcome}`);
      }
      return result.member;
    }

    async function rolesOf(membershipId: string): Promise<RolePreset[]> {
      const rows = await pools.admin.db
        .select({ rolePreset: membershipRole.rolePreset })
        .from(membershipRole)
        .where(eq(membershipRole.membershipId, membershipId))
        .orderBy(membershipRole.rolePreset);
      return rows.map((row) => row.rolePreset);
    }

    async function versionOf(membershipId: string): Promise<number> {
      const [row] = await standingOf(membershipId);
      return row?.authorizationVersion ?? -1;
    }

    async function statusOf(membershipId: string): Promise<string> {
      const [row] = await standingOf(membershipId);
      return row?.status ?? 'gone';
    }

    function standingOf(membershipId: string) {
      return pools.admin.db
        .select({
          status: tenantMembership.status,
          authorizationVersion: tenantMembership.authorizationVersion,
        })
        .from(tenantMembership)
        .where(eq(tenantMembership.id, membershipId))
        .limit(1);
    }

    async function revokedAtOf(sessionId: string): Promise<Date | null> {
      const [row] = await pools.admin.db
        .select({ revokedAt: session.revokedAt })
        .from(session)
        .where(eq(session.id, sessionId))
        .limit(1);
      return row?.revokedAt ?? null;
    }
  },
);
