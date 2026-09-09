import { randomUUID } from 'node:crypto';
import {
  auditLogEntry,
  createDb,
  type Db,
  marketPack,
  membershipRole,
  session,
  tenant,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import { type RolePreset, sessionExpiresAt } from '@heliogrid/domain';
import { loadInvariantsEnv } from '@heliogrid/env/server';
import { inArray } from 'drizzle-orm';

/**
 * The real-database fixture every `apps/api` proof seeds: two companies, the people in them and
 * the devices they sign in on. Written once here because two proofs that each build their own
 * "a company with an owner" drift apart, and the second one to drift is the one that lies.
 *
 * Nothing here asserts. A proof states WHICH rows it needs; this puts them there and takes them
 * away again, in dependency order, so a failure mid-run leaves the database as it was found.
 */

/** Enough digits to keep one run's phone numbers clear of every other run's. */
const PHONE_SUFFIX_DIGITS = 6;
const env = loadInvariantsEnv();
export const databaseUrl = env.DATABASE_URL ?? env.DATABASE_ADMIN_URL ?? '';
export const adminUrl = env.DATABASE_ADMIN_URL ?? databaseUrl;

/**
 * Fail CLOSED under CI, as the invariants do: a skipped proof that reports success is worse than
 * no proof. CI migrates the database before these run; a local run gets its `.env.local` from
 * `vitest.config.mts`. Returns whether the suite must skip.
 */
export function skipWithoutDatabase(proof: string, unproven: string): boolean {
  if (databaseUrl !== '') return false;
  if (env.CI) {
    throw new Error(`${proof} NOT RUN: DATABASE_URL/DATABASE_ADMIN_URL missing under CI.`);
  }
  console.warn(`SKIP ${proof}: no DATABASE_URL/DATABASE_ADMIN_URL. ${unproven}`);
  return true;
}

export interface Company {
  readonly tenantId: string;
  readonly companyName: string;
}

export interface Person {
  readonly userId: string;
  readonly name: string;
}

export interface Membership {
  readonly membershipId: string;
  readonly of: Company;
  readonly held: Person;
  readonly roles: readonly RolePreset[];
}

export interface Device {
  readonly sessionId: string;
  readonly of: Person;
  readonly under: Company;
}

export const aCompany = (companyName: string): Company => ({
  tenantId: randomUUID(),
  companyName,
});
export const aPerson = (name: string): Person => ({ userId: randomUUID(), name });
export const aMembership = (
  of: Company,
  held: Person,
  roles: readonly RolePreset[],
): Membership => ({ membershipId: randomUUID(), of, held, roles });
export const aDevice = (of: Person, under: Company): Device => ({
  sessionId: randomUUID(),
  of,
  under,
});

export interface Fixture {
  readonly companies: readonly Company[];
  readonly people: readonly Person[];
  readonly memberships: readonly Membership[];
  readonly devices?: readonly Device[];
}

/** Both pools a proof drives: the runtime role under RLS, and the admin role that seeds and reads. */
export function openPools() {
  const runtime = createDb(databaseUrl, { max: 1 });
  const admin = createDb(adminUrl, { max: 1 });
  return {
    runtime,
    admin,
    close: () => Promise.all([runtime.client.end(), admin.client.end()]),
  };
}

export async function seed(db: Db, fixture: Fixture): Promise<void> {
  const now = new Date();
  // The suffix keeps this run's phones clear of a concurrent run's, since the number is unique
  // globally and every proof seeds the same handful of people.
  const suffix = (fixture.companies[0]?.tenantId ?? randomUUID())
    .replace(/\D/g, '')
    .slice(0, PHONE_SUFFIX_DIGITS)
    .padEnd(PHONE_SUFFIX_DIGITS, '0');
  await db.insert(marketPack).values({ marketCode: 'IN' }).onConflictDoNothing();
  await db.insert(tenant).values(
    fixture.companies.map((company) => ({
      id: company.tenantId,
      companyName: company.companyName,
      city: 'Pune',
      marketCode: 'IN',
      currencyCode: 'INR',
      defaultLanguage: 'en' as const,
      timezone: 'Asia/Kolkata',
      createdAt: now,
    })),
  );
  await db.insert(userAccount).values(
    fixture.people.map((person, index) => ({
      id: person.userId,
      phoneE164: `+9198${suffix}${index}`,
      name: person.name,
      interfaceLanguage: 'en' as const,
      unitPreference: 'metric' as const,
      createdAt: now,
    })),
  );
  await db.insert(tenantMembership).values(
    fixture.memberships.map((membership) => ({
      id: membership.membershipId,
      tenantId: membership.of.tenantId,
      userAccountId: membership.held.userId,
      status: 'active' as const,
      lastActiveAt: now,
      coachMarksDismissed: 0,
      authorizationVersion: 0,
      createdAt: now,
    })),
  );
  const roles = fixture.memberships.flatMap((membership) =>
    membership.roles.map((rolePreset) => ({
      tenantId: membership.of.tenantId,
      membershipId: membership.membershipId,
      rolePreset,
    })),
  );
  if (roles.length > 0) await db.insert(membershipRole).values(roles);
  if (fixture.devices?.length) {
    await db.insert(session).values(
      fixture.devices.map((device) => ({
        id: device.sessionId,
        userAccountId: device.of.userId,
        tokenHash: randomUUID(),
        platformKind: 'mobile' as const,
        activeTenantId: device.under.tenantId,
        // The real policy, so a seeded device lives exactly as long as a signed-in one does.
        expiresAt: new Date(sessionExpiresAt('mobile', now.getTime())),
        lastForegroundActivityAt: now,
        createdAt: now,
      })),
    );
  }
}

/** In dependency order, so a failure mid-run still leaves the database as it was found. */
export async function unseed(db: Db, fixture: Fixture): Promise<void> {
  const companies = fixture.companies.map((company) => company.tenantId);
  const people = fixture.people.map((person) => person.userId);
  await db.delete(auditLogEntry).where(inArray(auditLogEntry.tenantId, companies));
  await db.delete(membershipRole).where(inArray(membershipRole.tenantId, companies));
  await db.delete(session).where(inArray(session.userAccountId, people));
  await db.delete(tenantMembership).where(inArray(tenantMembership.tenantId, companies));
  await db.delete(userAccount).where(inArray(userAccount.id, people));
  await db.delete(tenant).where(inArray(tenant.id, companies));
}
