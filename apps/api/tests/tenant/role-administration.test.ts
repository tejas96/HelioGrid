import { randomUUID } from 'node:crypto';
import {
  createDb,
  type Db,
  marketPack,
  membershipRole,
  session,
  tenant,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { loadInvariantsEnv } from '@heliogrid/env/server';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthAdminRepository } from '../../src/modules/auth/internal/auth.admin.repository';
import {
  TenantRepository,
  type TransitionOutcome,
} from '../../src/modules/tenant/tenant.repository';

/**
 * The guarded transitions against REAL state (`F2-19`, `F2-20`). The decision itself is proven
 * pure in `packages/domain/tests/authz/administration.test.ts`; what only a database can show is
 * the transaction around it — that a refusal writes nothing, that a role set is REPLACED rather
 * than added to, that every change moves the authorization version on, and that ending someone's
 * access ends their sessions in THIS company and no other.
 *
 * The repositories are driven directly, as `tenant.service.ts` composes them. Migration 0003's
 * grants are what let the runtime role write these rows at all; the policy over them is the
 * tenancy invariant's.
 */
/** Enough digits to keep this run's phone numbers clear of every other run's. */
const PHONE_SUFFIX_DIGITS = 6;
/** One day in milliseconds — a session life long enough that only the sweep can end one. */
const SESSION_LIFE_MS = 86_400_000;

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

const env = loadInvariantsEnv();
const databaseUrl = env.DATABASE_URL ?? env.DATABASE_ADMIN_URL ?? '';
const adminUrl = env.DATABASE_ADMIN_URL ?? databaseUrl;

if (databaseUrl === '') {
  // Fail CLOSED under CI, as the invariants do: a skipped proof that reports success is worse
  // than no proof. CI migrates the database before this runs (.github/workflows/ci.yml), and
  // `vitest.config.mts` hands a local run its `.env.local`.
  if (env.CI) {
    throw new Error(
      'ROLE-ADMINISTRATION PROOF NOT RUN: DATABASE_URL/DATABASE_ADMIN_URL missing under CI.',
    );
  }
  console.warn(
    'SKIP role administration: no DATABASE_URL/DATABASE_ADMIN_URL. The guarded transitions ' +
      'are UNPROVEN in this run — only their pure decision is.',
  );
}

describe.skipIf(databaseUrl === '')(
  'the guarded transitions of role administration, against a migrated database',
  () => {
    const tenantId = randomUUID();
    const otherTenantId = randomUUID();
    const ownerUserId = randomUUID();
    const memberUserId = randomUUID();
    const ownerMembershipId = randomUUID();
    const memberMembershipId = randomUUID();
    const otherMembershipId = randomUUID();
    const sessionHere = randomUUID();
    const sessionElsewhere = randomUUID();
    const suffix = tenantId
      .replace(/\D/g, '')
      .slice(0, PHONE_SUFFIX_DIGITS)
      .padEnd(PHONE_SUFFIX_DIGITS, '0');

    let runtime: ReturnType<typeof createDb>;
    let admin: ReturnType<typeof createDb>;
    let tenants: TenantRepository;
    let sessions: AuthAdminRepository;

    beforeAll(async () => {
      runtime = createDb(databaseUrl, { max: 1 });
      admin = createDb(adminUrl, { max: 1 });
      tenants = new TenantRepository(runtime.db);
      sessions = new AuthAdminRepository(admin.db);
      await seed(admin.db);
    });

    afterAll(async () => {
      await unseed(admin.db);
      await Promise.all([runtime.client.end(), admin.client.end()]);
    });

    it('replaces the whole role set, once per preset, in the matrix order the chips render', async () => {
      const before = await versionOf(memberMembershipId);
      const member = done(
        await tenants.assignRoles(tenantId, memberMembershipId, [LATER, EARLIER, EARLIER]),
      );
      expect(member.roles).toEqual([EARLIER, LATER]);
      expect(await versionOf(memberMembershipId)).toBe(before + 1);
    });

    it('refuses to remove the only EPC Owner’s preset, and writes nothing at all', async () => {
      const before = await versionOf(ownerMembershipId);
      const refused = await tenants.assignRoles(tenantId, ownerMembershipId, [EARLIER]);
      expect(refused.outcome).toBe('last-owner');
      expect(await rolesOf(ownerMembershipId)).toEqual([OWNER]);
      expect(await versionOf(ownerMembershipId)).toBe(before);
    });

    it('accepts the same write once it keeps the owner preset', async () => {
      const member = done(await tenants.assignRoles(tenantId, ownerMembershipId, [EARLIER, OWNER]));
      expect(member.roles).toEqual([OWNER, EARLIER]);
    });

    it('refuses to deactivate the only EPC Owner, and leaves them active', async () => {
      const refused = await tenants.deactivate(tenantId, ownerMembershipId);
      expect(refused.outcome).toBe('last-owner');
      expect(await statusOf(ownerMembershipId)).toBe('active');
    });

    it('deactivates anyone the company can spare, keeping their name and their presets', async () => {
      const before = await versionOf(memberMembershipId);
      const member = done(await tenants.deactivate(tenantId, memberMembershipId));
      expect(member.status).toBe('deactivated');
      expect(member.name).toBe('Priya Kulkarni');
      expect(member.roles).toEqual([EARLIER, LATER]);
      expect(await versionOf(memberMembershipId)).toBe(before + 1);
    });

    it('ends that person’s sessions in this company and leaves another company’s alone', async () => {
      await sessions.revokeSessionsUnder(memberUserId, tenantId, Date.now());
      expect(await revokedAtOf(sessionHere)).not.toBeNull();
      expect(await revokedAtOf(sessionElsewhere)).toBeNull();
    });

    it.each([
      {
        act: 'a role write',
        run: () => tenants.assignRoles(tenantId, memberMembershipId, [EARLIER]),
      },
      { act: 'a second deactivation', run: () => tenants.deactivate(tenantId, memberMembershipId) },
    ])('answers not-active to $act on someone already deactivated', async ({ run }) => {
      expect((await run()).outcome).toBe('not-active');
    });

    it.each([
      { subject: 'nobody at all', membershipId: randomUUID() },
      { subject: 'a membership of another company', membershipId: otherMembershipId },
    ])('answers not-found for $subject — never that the row exists', async ({ membershipId }) => {
      expect((await tenants.assignRoles(tenantId, membershipId, [EARLIER])).outcome).toBe(
        'not-found',
      );
      expect((await tenants.deactivate(tenantId, membershipId)).outcome).toBe('not-found');
    });

    /** The row a completed transition produced; anything else fails the step by its own reason. */
    function done(result: TransitionOutcome) {
      if (result.outcome !== 'done') {
        throw new Error(`expected a completed transition, got ${result.outcome}`);
      }
      return result.member;
    }

    async function rolesOf(membershipId: string): Promise<RolePreset[]> {
      const rows = await admin.db
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
      return admin.db
        .select({
          status: tenantMembership.status,
          authorizationVersion: tenantMembership.authorizationVersion,
        })
        .from(tenantMembership)
        .where(eq(tenantMembership.id, membershipId))
        .limit(1);
    }

    async function revokedAtOf(sessionId: string): Promise<Date | null> {
      const [row] = await admin.db
        .select({ revokedAt: session.revokedAt })
        .from(session)
        .where(eq(session.id, sessionId))
        .limit(1);
      return row?.revokedAt ?? null;
    }

    /**
     * Two companies. One holds an owner and a second person the company can spare; the other
     * holds the same person again, so the session sweep has something it must NOT touch.
     */
    async function seed(db: Db) {
      const now = new Date();
      const company = (id: string, companyName: string) => ({
        id,
        companyName,
        city: 'Pune',
        marketCode: 'IN',
        currencyCode: 'INR',
        defaultLanguage: 'en' as const,
        timezone: 'Asia/Kolkata',
        createdAt: now,
      });
      const person = (id: string, name: string, last: string) => ({
        id,
        phoneE164: `+9198${suffix}${last}`,
        name,
        interfaceLanguage: 'en' as const,
        unitPreference: 'metric' as const,
        createdAt: now,
      });
      const membership = (id: string, ofTenant: string, ofUser: string) => ({
        id,
        tenantId: ofTenant,
        userAccountId: ofUser,
        status: 'active' as const,
        lastActiveAt: now,
        coachMarksDismissed: 0,
        authorizationVersion: 0,
        createdAt: now,
      });
      const device = (id: string, activeTenantId: string) => ({
        id,
        userAccountId: memberUserId,
        tokenHash: randomUUID(),
        platformKind: 'mobile' as const,
        activeTenantId,
        expiresAt: new Date(now.getTime() + SESSION_LIFE_MS),
        lastForegroundActivityAt: now,
        createdAt: now,
      });
      await db.insert(marketPack).values({ marketCode: 'IN' }).onConflictDoNothing();
      await db
        .insert(tenant)
        .values([company(tenantId, 'Guarded EPC'), company(otherTenantId, 'Neighbour EPC')]);
      await db
        .insert(userAccount)
        .values([
          person(ownerUserId, 'Rajesh Sharma', '1'),
          person(memberUserId, 'Priya Kulkarni', '2'),
        ]);
      await db
        .insert(tenantMembership)
        .values([
          membership(ownerMembershipId, tenantId, ownerUserId),
          membership(memberMembershipId, tenantId, memberUserId),
          membership(otherMembershipId, otherTenantId, memberUserId),
        ]);
      await db.insert(membershipRole).values([
        { tenantId, membershipId: ownerMembershipId, rolePreset: OWNER },
        { tenantId, membershipId: memberMembershipId, rolePreset: LATER },
        { tenantId: otherTenantId, membershipId: otherMembershipId, rolePreset: OWNER },
      ]);
      await db
        .insert(session)
        .values([device(sessionHere, tenantId), device(sessionElsewhere, otherTenantId)]);
    }

    /** In dependency order, so a failure mid-run still leaves the database as it was found. */
    async function unseed(db: Db) {
      const companies = [tenantId, otherTenantId];
      const people = [ownerUserId, memberUserId];
      await db.delete(membershipRole).where(inArray(membershipRole.tenantId, companies));
      await db.delete(session).where(inArray(session.userAccountId, people));
      await db.delete(tenantMembership).where(inArray(tenantMembership.tenantId, companies));
      await db.delete(userAccount).where(inArray(userAccount.id, people));
      await db.delete(tenant).where(inArray(tenant.id, companies));
    }
  },
);
