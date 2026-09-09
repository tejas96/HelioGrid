import { randomUUID } from 'node:crypto';
import { auditLogEntry, tenantMembership, withTenantTransaction } from '@heliogrid/db';
import { FOUNDER_ROLE, ROLE_PRESETS, type RolePreset, sessionExpiresAt } from '@heliogrid/domain';
import { eq, inArray, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recordAuditEntry } from '../../src/modules/audit/audit.public';
import { AuditRepository } from '../../src/modules/audit/audit.repository';
import { AuthAdminRepository } from '../../src/modules/auth/internal/auth.admin.repository';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  rolesHeldBy,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The append-only log against REAL state (`F2-22`, `F2-23`, `F2-24`). What only a database can
 * show: that an entry is written INSIDE the transaction that caused it, that a refused act still
 * records itself while changing nothing, that one company's export carries no other company's
 * rows, and that a platform-staff actor needs no membership in the company whose log they
 * appear in.
 *
 * The repositories are driven directly, as the services compose them. That NO role may edit or
 * remove an entry is NOT proven here: it is a property of the system read from the catalog over
 * every RLS-subject role, which `tests/invariants` owns and this file must not restate. Asked
 * here it would also be a lie in CI, where the connecting role is a superuser that bypasses RLS
 * and holds every privilege — the attempt would succeed, and the DELETE would empty the table.
 */

/** A page wide enough that every entry one case writes is on it. */
const WHOLE_LOG = { limit: 50, offset: 0 };

const OWNER = FOUNDER_ROLE;
const SPARE = ROLE_PRESETS.find((preset) => preset !== OWNER) as RolePreset;

/**
 * Two companies, each keeping its own owner so neither guard fires by accident, plus one account
 * that is a member of neither — the platform-staff actor.
 */
const here = aCompany('Logged EPC');
const elsewhere = aCompany('Neighbour EPC');
const owner = aPerson('Rajesh Sharma');
const spare = aPerson('Priya Kulkarni');
const staff = aPerson('Platform Support');
const ownerHere = aMembership(here, owner, [OWNER]);
const spareHere = aMembership(here, spare, []);
const ownerElsewhere = aMembership(elsewhere, spare, [OWNER]);

const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, spare, staff],
  memberships: [ownerHere, spareHere, ownerElsewhere],
};

const skip = skipWithoutDatabase('AUDIT-LOG PROOF', 'The append-only log is UNPROVEN in this run.');

describe.skipIf(skip)('the append-only audit log, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let tenants: TenantRepository;
  let sessions: AuthAdminRepository;
  let log: AuditRepository;

  beforeAll(async () => {
    pools = openPools();
    tenants = new TenantRepository(pools.runtime.db);
    sessions = new AuthAdminRepository(pools.admin.db);
    log = new AuditRepository(pools.runtime.db);
    await seed(pools.admin.db, fixture);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('records a role change with its actor, its subject, its time and the old → new set', async () => {
    const at = Date.now();
    await tenants.assignRoles(here.tenantId, spareHere.membershipId, [SPARE], {
      actorUserId: owner.userId,
      now: at,
    });
    const [entry] = await entriesOf('team.roles_changed');
    expect(entry).toMatchObject({
      actorKind: 'tenant_user',
      actorRef: owner.userId,
      blocked: false,
      subjectKind: 'tenant_membership',
      subjectRef: spareHere.membershipId,
      changePayload: { from: [], to: [SPARE] },
    });
    expect(entry?.occurredAt.getTime()).toBe(at);
  });

  it("joins the caller's transaction — a change that fails after its entry leaves no entry", async () => {
    const before = await countOfEntries();
    await expect(
      withTenantTransaction(pools.runtime.db, here.tenantId, async (tx) => {
        await recordAuditEntry(tx, staffRead());
        throw new Error('the change failed after its entry was written');
      }),
    ).rejects.toThrow();
    // The writer opened no connection of its own, so the rollback took the entry with it: an
    // entry is written WITH the change that caused it, never reconstructed after the fact.
    expect(await countOfEntries()).toBe(before);
  });

  it('records a REFUSED last-Owner attempt as a blocked entry, with the set that was attempted', async () => {
    const rolesBefore = await rolesHeldBy(pools.admin.db, ownerHere.membershipId);
    const refused = await tenants.assignRoles(here.tenantId, ownerHere.membershipId, [SPARE], {
      actorUserId: owner.userId,
      now: Date.now(),
    });
    expect(refused.outcome).toBe('last-owner');
    // The change wrote nothing — but the attempt is on the record.
    expect(await rolesHeldBy(pools.admin.db, ownerHere.membershipId)).toEqual(rolesBefore);
    const blocked = (await entriesOf('team.roles_changed')).filter((entry) => entry.blocked);
    expect(blocked).toHaveLength(1);
    expect(blocked[0]).toMatchObject({
      subjectRef: ownerHere.membershipId,
      changePayload: { from: [OWNER], to: [SPARE] },
    });
  });

  it('records a deactivation, whose event name is the whole change', async () => {
    await tenants.deactivate(here.tenantId, spareHere.membershipId, {
      actorUserId: owner.userId,
      now: Date.now(),
    });
    const [entry] = await entriesOf('team.member_deactivated');
    expect(entry).toMatchObject({
      blocked: false,
      subjectRef: spareHere.membershipId,
      changePayload: null,
    });
  });

  it('records a sign-in under the company the session acts under', async () => {
    await openSession(here.tenantId);
    const [entry] = await entriesOf('auth.signed_in');
    expect(entry).toMatchObject({
      actorRef: owner.userId,
      subjectKind: 'user_account',
      subjectRef: owner.userId,
    });
  });

  it('records the founding sign-in at the moment the session adopts the company', async () => {
    // The signer verified their code BEFORE the company existed, so the sign-in wrote nothing
    // then. Without this the company's log would open with a sign-OUT that has no sign-in.
    const opened = await openSession(null);
    const before = (await entriesOf('auth.signed_in')).length;
    await sessions.setActiveTenant(opened.id, here.tenantId, Date.now());
    const after = await entriesOf('auth.signed_in');
    expect(after).toHaveLength(before + 1);
    expect(after.at(-1)).toMatchObject({ actorRef: owner.userId, subjectRef: owner.userId });
  });

  it('records nothing for a sign-in that belongs to no company — there is no tenant to own it', async () => {
    const before = await countOfEntries();
    await openSession(null);
    expect(await countOfEntries()).toBe(before);
  });

  it("gives a company its own entries and no other company's, newest first", async () => {
    await tenants.assignRoles(elsewhere.tenantId, ownerElsewhere.membershipId, [OWNER, SPARE], {
      actorUserId: spare.userId,
      now: Date.now(),
    });
    const ours = await log.entries(here.tenantId, WHOLE_LOG);
    const theirs = await log.entries(elsewhere.tenantId, WHOLE_LOG);
    expect(ours.items.length).toBeGreaterThan(0);
    expect(theirs.items).toHaveLength(1);
    expect(theirs.items[0]?.subjectRef).toBe(ownerElsewhere.membershipId);
    expect(ours.items.map((entry) => entry.subjectRef)).not.toContain(ownerElsewhere.membershipId);
    const times = ours.items.map((entry) => Date.parse(entry.occurredAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(ours.totalCount).toBe(ours.items.length);
  });

  it('carries a platform-staff actor who holds no membership in the company logged', async () => {
    await withTenantTransaction(pools.runtime.db, here.tenantId, (tx) =>
      recordAuditEntry(tx, staffRead()),
    );
    const staffEntries = (await log.entries(here.tenantId, WHOLE_LOG)).items.filter(
      (entry) => entry.actorKind === 'platform_staff',
    );
    expect(staffEntries).toHaveLength(1);
    expect(staffEntries[0]?.actorRef).toBe(staff.userId);
    const memberships = await pools.admin.db
      .select({ id: tenantMembership.id })
      .from(tenantMembership)
      .where(eq(tenantMembership.userAccountId, staff.userId));
    expect(memberships).toHaveLength(0);
  });

  /**
   * Platform staff reading this company's data (`F2-24`): an account holding no membership here,
   * recorded under the company whose log it is. The read path itself has no surface yet —
   * `docs/tasks/deferred.md` owns it — so the ENTRY is what this file proves.
   */
  function staffRead() {
    return {
      tenantId: here.tenantId,
      eventType: 'auth.signed_in' as const,
      actorKind: 'platform_staff' as const,
      actorRef: staff.userId,
      occurredAt: new Date(),
      blocked: false,
      subjectKind: 'user_account' as const,
      subjectRef: owner.userId,
      changePayload: null,
    };
  }

  /** A session opened the way sign-in opens one; the company is what decides whether it is logged. */
  function openSession(activeTenantId: string | null) {
    return sessions.createSession({
      userAccountId: owner.userId,
      tokenHash: randomUUID(),
      platformKind: 'mobile',
      activeTenantId,
      expiresAt: sessionExpiresAt('mobile', Date.now()),
      foreground: true,
      now: Date.now(),
    });
  }

  /** Read on the ADMIN path, so a read failure can never be mistaken for a policy refusal. */
  function entriesOf(eventType: string) {
    return pools.admin.db
      .select()
      .from(auditLogEntry)
      .where(
        sql`${auditLogEntry.tenantId} = ${here.tenantId} and ${auditLogEntry.eventType}::text = ${eventType}`,
      )
      .orderBy(auditLogEntry.occurredAt, auditLogEntry.id);
  }

  /** Only THIS fixture's companies: another suite's rows must not move a count this one owns. */
  async function countOfEntries(): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: auditLogEntry.id })
      .from(auditLogEntry)
      .where(inArray(auditLogEntry.tenantId, [here.tenantId, elsewhere.tenantId]));
    return rows.length;
  }
});
