import { randomUUID } from 'node:crypto';
import {
  auditLogEntry,
  brandingSettings,
  businessProfile,
  createDb,
  type Db,
  invitation,
  invitationRole,
  marketPack,
  membershipRole,
  notification,
  notificationPreference,
  notificationSettings,
  onboardingProgress,
  proposalTemplateSettings,
  session,
  taxRegistration,
  tenant,
  tenantHoliday,
  tenantMembership,
  tenantPool,
  timelineTemplate,
  trancheTemplate,
  trancheTemplateLine,
  userAccount,
} from '@heliogrid/db';
import {
  type InvitationStatus,
  invitationExpiresAt,
  type RolePreset,
  sessionExpiresAt,
} from '@heliogrid/domain';
import { eq, inArray } from 'drizzle-orm';
import { adminUrl, databaseUrl } from './preconditions';

export { adminUrl, databaseUrl, skipUnless, skipWithoutDatabase } from './preconditions';

/**
 * The real-database fixture every `apps/api` proof seeds: two companies, the people in them and
 * the devices they sign in on. Written once here because two proofs that each build their own
 * "a company with an owner" drift apart, and the second one to drift is the one that lies.
 *
 * Nothing here asserts. A proof states WHICH rows it needs; this puts them there and takes them
 * away again, in dependency order, so a failure mid-run leaves the database as it was found.
 */

/** Enough digits to keep one run's phone numbers clear of every other run's. */
const PHONE_SUFFIX_DIGITS = 8;

export interface Company {
  readonly tenantId: string;
  readonly companyName: string;
}

export interface Person {
  readonly userId: string;
  readonly name: string;
  /** The login identity, unique globally (`M01-18`); an invite is keyed to one of these. */
  readonly phoneE164: string;
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

/** A team invite as the store holds it; `expiresAt` follows the policy unless a proof needs it run out. */
export interface Invite {
  readonly invitationId: string;
  readonly of: Company;
  readonly by: Person;
  readonly inviteeName: string;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly tokenHash: string;
  readonly status: InvitationStatus;
  readonly sentAt: number;
  readonly expiresAt: number;
}

export const aCompany = (companyName: string): Company => ({
  tenantId: randomUUID(),
  companyName,
});
/** The phone is minted from the id, so two people in one run — or two runs — never share one. */
export const aPerson = (name: string): Person => {
  const userId = randomUUID();
  return { userId, name, phoneE164: aPhone(userId) };
};
export const aPhone = (seed: string = randomUUID()): string =>
  `+9198${seed.replace(/\D/g, '').slice(0, PHONE_SUFFIX_DIGITS).padEnd(PHONE_SUFFIX_DIGITS, '0')}`;
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
export const anInvite = (
  of: Company,
  by: Person,
  invitee: { name: string; phoneE164: string },
  roles: readonly RolePreset[],
  standing: { status?: InvitationStatus; sentAt?: number } = {},
): Invite => {
  const sentAt = standing.sentAt ?? Date.now();
  return {
    invitationId: randomUUID(),
    of,
    by,
    inviteeName: invitee.name,
    phoneE164: invitee.phoneE164,
    roles,
    tokenHash: randomUUID(),
    status: standing.status ?? 'pending',
    sentAt,
    expiresAt: invitationExpiresAt(sentAt),
  };
};

export interface Fixture {
  readonly companies: readonly Company[];
  readonly people: readonly Person[];
  readonly memberships: readonly Membership[];
  readonly devices?: readonly Device[];
  readonly invites?: readonly Invite[];
}

/** Both pools a proof drives: the runtime role under RLS, and the admin role that seeds and reads. */
export function openPools() {
  const runtime = createDb(databaseUrl, { max: 1 });
  const admin = createDb(adminUrl, { max: 1 });
  return {
    runtime,
    admin,
    // The DOOR a tenant repository takes. `runtime.db` stays beside it for the two callers that
    // legitimately read unpinned — the pack reader and a proof asserting over raw state.
    tenants: tenantPool(runtime.db),
    close: () => Promise.all([runtime.client.end(), admin.client.end()]),
  };
}

export async function seed(db: Db, fixture: Fixture): Promise<void> {
  const now = new Date();
  await db.insert(marketPack).values({ marketCode: 'IN' }).onConflictDoNothing();
  if (fixture.companies.length > 0) {
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
  }
  if (fixture.people.length > 0) {
    await db.insert(userAccount).values(
      fixture.people.map((person) => ({
        id: person.userId,
        phoneE164: person.phoneE164,
        name: person.name,
        interfaceLanguage: 'en' as const,
        unitPreference: 'metric' as const,
        createdAt: now,
      })),
    );
  }
  if (fixture.memberships.length > 0) {
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
  }
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
  if (fixture.invites?.length) {
    await db.insert(invitation).values(
      fixture.invites.map((invite) => ({
        id: invite.invitationId,
        tenantId: invite.of.tenantId,
        inviterUserId: invite.by.userId,
        inviteeName: invite.inviteeName,
        inviteePhoneE164: invite.phoneE164,
        tokenHash: invite.tokenHash,
        status: invite.status,
        sentAt: new Date(invite.sentAt),
        expiresAt: new Date(invite.expiresAt),
      })),
    );
    const carried = fixture.invites.flatMap((invite) =>
      invite.roles.map((rolePreset) => ({
        tenantId: invite.of.tenantId,
        invitationId: invite.invitationId,
        rolePreset,
      })),
    );
    if (carried.length > 0) await db.insert(invitationRole).values(carried);
  }
}

/** In dependency order, so a failure mid-run still leaves the database as it was found. */
export async function unseed(db: Db, fixture: Fixture): Promise<void> {
  const companies = fixture.companies.map((company) => company.tenantId);
  const people = fixture.people.map((person) => person.userId);
  // An empty list is a legitimate fixture — the HTTP harness tears down the companies it created
  // and never the person it signed in as — and `inArray` refuses an empty array, so each half
  // runs only when it has something to remove.
  if (companies.length === 0 && people.length === 0) return;
  if (companies.length === 0) {
    await db.delete(session).where(inArray(session.userAccountId, people));
    await db.delete(userAccount).where(inArray(userAccount.id, people));
    return;
  }
  await db.delete(auditLogEntry).where(inArray(auditLogEntry.tenantId, companies));
  await db.delete(notification).where(inArray(notification.tenantId, companies));
  await db
    .delete(notificationPreference)
    .where(inArray(notificationPreference.tenantId, companies));
  await db.delete(notificationSettings).where(inArray(notificationSettings.tenantId, companies));
  for (const setting of [
    trancheTemplateLine,
    trancheTemplate,
    taxRegistration,
    tenantHoliday,
    businessProfile,
    brandingSettings,
    proposalTemplateSettings,
    timelineTemplate,
    onboardingProgress,
  ]) {
    await db.delete(setting).where(inArray(setting.tenantId, companies));
  }
  await db.delete(invitationRole).where(inArray(invitationRole.tenantId, companies));
  await db.delete(invitation).where(inArray(invitation.tenantId, companies));
  await db.delete(membershipRole).where(inArray(membershipRole.tenantId, companies));
  // UNBOUND, never deleted: a session another suite opened beside this one may point at a company
  // this one created (sign-in binds to a held membership); nulling it keeps that session alive.
  await db
    .update(session)
    .set({ activeTenantId: null })
    .where(inArray(session.activeTenantId, companies));
  if (people.length > 0) await db.delete(session).where(inArray(session.userAccountId, people));
  await db.delete(tenantMembership).where(inArray(tenantMembership.tenantId, companies));
  if (people.length > 0) await db.delete(userAccount).where(inArray(userAccount.id, people));
  await db.delete(tenant).where(inArray(tenant.id, companies));
}

/** The presets one membership holds, in matrix order — read on the ADMIN path, so a read failure is never mistaken for a policy refusal. */
export async function rolesHeldBy(db: Db, membershipId: string): Promise<RolePreset[]> {
  const rows = await db
    .select({ rolePreset: membershipRole.rolePreset })
    .from(membershipRole)
    .where(eq(membershipRole.membershipId, membershipId))
    .orderBy(membershipRole.rolePreset);
  return rows.map((row) => row.rolePreset);
}
