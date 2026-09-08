import {
  MEASUREMENT_SYSTEMS,
  MEMBERSHIP_STATUSES,
  OTP_CHANNELS,
  PLATFORM_KINDS,
  ROLE_PRESETS,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { tenant, uiLanguage } from './tenant';

/** pgEnums hand-mirror domain's tuples (`M17` proves each pair equal). */
export const measurementSystem = pgEnum('measurement_system', MEASUREMENT_SYSTEMS);
export const rolePreset = pgEnum('role_preset', ROLE_PRESETS);
export const membershipStatus = pgEnum('membership_status', MEMBERSHIP_STATUSES);
export const platformKind = pgEnum('platform_kind', PLATFORM_KINDS);
export const otpChannel = pgEnum('otp_channel', OTP_CHANNELS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * The global platform account, keyed by the verified phone (`M01-18`): one account whatever
 * door it enters, never deleted. It carries no status — that is the membership's — and no
 * `tenant_id`. ARMED: RLS with one SELECT policy, the row visible to a session whose tenant
 * holds a membership on it, so the roster and every picker read names under RLS; every write
 * runs on the admin path.
 */
export const userAccount = pgTable('user_account', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  phoneE164: text('phone_e164').notNull().unique(),
  /** Null until the person types a name — at signup, or on the invited first run (`M01-14`). */
  name: text('name'),
  /** The linked Google identity's subject (`M01-02`); bound once, never a second account. */
  googleSubject: text('google_subject').unique(),
  interfaceLanguage: uiLanguage('interface_language').notNull(),
  unitPreference: measurementSystem('unit_preference').notNull(),
  createdAt: instant('created_at').notNull(),
});

/**
 * A single-use sign-in code keyed to a phone before any account exists (`M01-04`, `M01-05`).
 * The code is stored as a hash, never in clear. Caps, the lock and the cooldown are DERIVED
 * from these rows over rolling windows, on the phone, never on a user. UNREACHABLE: the admin
 * path alone reads and writes it.
 */
export const otpChallenge = pgTable(
  'otp_challenge',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    phoneE164: text('phone_e164').notNull(),
    codeHash: text('code_hash').notNull(),
    channel: otpChannel('channel').notNull(),
    issuedAt: instant('issued_at').notNull(),
    failedVerifies: integer('failed_verifies').notNull(),
    verifiedAt: instant('verified_at'),
    invalidatedAt: instant('invalidated_at'),
    /** A CONFIRMED hard delivery failure (`M01-03`); it releases the resend cooldown and nothing else. */
    deliveryFailedAt: instant('delivery_failed_at'),
  },
  (table) => [
    /** The rolling windows: every cap, the lock and the cooldown read this phone's recent rows. */
    index('otp_challenge_phone_issued_idx').on(table.phoneE164, table.issuedAt.desc()),
  ],
);

/**
 * A device session (`M01-07`): the refresh grant the API token is minted from. The cookie
 * carries a random secret; the row stores its hash. Web rolls 30 days; mobile idles 7 days on
 * foreground use. Revoked within one token life. UNREACHABLE: the admin path alone.
 */
export const session = pgTable(
  'session',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userAccountId: uuid('user_account_id')
      .notNull()
      .references(() => userAccount.id),
    tokenHash: text('token_hash').notNull().unique(),
    platformKind: platformKind('platform_kind').notNull(),
    /** The company this session acts under; null until signup or accept gives it one (`M01-10`). */
    activeTenantId: uuid('active_tenant_id').references(() => tenant.id),
    expiresAt: instant('expires_at').notNull(),
    /** Server-authoritative last FOREGROUND use; background work never writes it. */
    lastForegroundActivityAt: instant('last_foreground_activity_at'),
    revokedAt: instant('revoked_at'),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    /** The revocation sweep: every session of one account, in one write. */
    index('session_user_account_idx').on(table.userAccountId),
  ],
);

/**
 * A person inside ONE company (`M01-18`, `F2-10`): the membership their roles stack on. The
 * signup owner membership is written here; the invite-accept membership by `T-M01-028`.
 * `authorization_version` is bumped by every change to what the person may do, so a token is
 * compared, never trusted for its remaining life. Tenant-scoped, all four always.
 */
export const tenantMembership = pgTable(
  'tenant_membership',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    userAccountId: uuid('user_account_id')
      .notNull()
      .references(() => userAccount.id),
    status: membershipStatus('status').notNull(),
    lastActiveAt: instant('last_active_at'),
    /** The first-run coach marks dismissed so far, at most three (`M01-16`). */
    coachMarksDismissed: smallint('coach_marks_dismissed').notNull(),
    authorizationVersion: integer('authorization_version').notNull(),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('tenant_membership_tenant_user_key').on(table.tenantId, table.userAccountId),
    /** The Team screen and every picker that excludes the deactivated. */
    index('tenant_membership_tenant_status_active_idx').on(
      table.tenantId,
      table.status,
      table.lastActiveAt,
    ),
    /** An account's memberships, read on the admin path when a session is resolved. */
    index('tenant_membership_user_account_idx').on(table.userAccountId),
    check('tenant_membership_coach_marks_range', sql`${table.coachMarksDismissed} between 0 and 3`),
  ],
);

/**
 * One preset stacked onto one membership (`F2-10`, `F2-11`): a person's grants OR across
 * their rows, and stacking is the only way to widen access. The last-Owner and last-Manage-team
 * guards are `T-FPLAT-003`'s transitions over this table. Tenant-scoped, all four always.
 */
export const membershipRole = pgTable(
  'membership_role',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => tenantMembership.id),
    rolePreset: rolePreset('role_preset').notNull(),
  },
  (table) => [
    uniqueIndex('membership_role_tenant_membership_preset_key').on(
      table.tenantId,
      table.membershipId,
      table.rolePreset,
    ),
    /** Holder counts per preset, including zero — the guards' question. */
    index('membership_role_tenant_preset_idx').on(table.tenantId, table.rolePreset),
    /** The per-action permission check: every preset one membership holds. */
    index('membership_role_membership_idx').on(table.membershipId),
  ],
);
