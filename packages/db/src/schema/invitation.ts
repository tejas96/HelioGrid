import { INVITATION_STATUSES } from '@heliogrid/domain';
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { rolePreset, userAccount } from './identity';
import { tenant } from './tenant';

/** pgEnum hand-mirrors domain's tuple (`M17` proves the pair equal). `expired` is never written. */
export const invitationStatus = pgEnum('invitation_status', INVITATION_STATUSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A phone-keyed team invite (`M01-12`, `M01-13`): who was asked by whom, for how long, and where
 * it stands. Revocation and decline are states, never deletes; expiry is a reading of a pending
 * row past `expires_at`, so the row and the clock cannot disagree. The link's secret is stored
 * as a hash, never in clear, and its unique key is deliberately global: the landing resolves a
 * link before any tenant is known. Tenant-scoped, all four always.
 */
export const invitation = pgTable(
  'invitation',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** Attribution survives the inviter's deactivation: an account is never deleted (`F2-20`). */
    inviterUserId: uuid('inviter_user_id')
      .notNull()
      .references(() => userAccount.id),
    inviteeName: text('invitee_name').notNull(),
    inviteePhoneE164: text('invitee_phone_e164').notNull(),
    tokenHash: text('token_hash').notNull(),
    status: invitationStatus('status').notNull(),
    sentAt: instant('sent_at').notNull(),
    expiresAt: instant('expires_at').notNull(),
    acceptedAt: instant('accepted_at'),
    declinedAt: instant('declined_at'),
    revokedAt: instant('revoked_at'),
    /** The one-tap ask an expired invite offers; stamped once, so a second tap asks nobody twice. */
    reinviteRequestedAt: instant('reinvite_requested_at'),
  },
  (table) => [
    uniqueIndex('invitation_token_hash_key').on(table.tokenHash),
    /** The pending and expired listings, and the HR home (`PS-30`). */
    index('invitation_tenant_status_expires_idx').on(table.tenantId, table.status, table.expiresAt),
    /** The already-invited check before a send. */
    index('invitation_tenant_phone_idx').on(table.tenantId, table.inviteePhoneE164),
    /** The daily cap: every send in the last day, whatever became of it (`M01-04`). */
    index('invitation_tenant_sent_idx').on(table.tenantId, table.sentAt.desc()),
  ],
);

/**
 * One preset carried by one invitation (`F2-21`), at least one per invite — the empty set is
 * refused at the contract, before anything sends. Accept materialises each row as a
 * `membership_role`. Never a foreign key to a role table: presets are code. Tenant-scoped, all
 * four always.
 */
export const invitationRole = pgTable(
  'invitation_role',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitation.id),
    rolePreset: rolePreset('role_preset').notNull(),
  },
  (table) => [
    uniqueIndex('invitation_role_tenant_invitation_preset_key').on(
      table.tenantId,
      table.invitationId,
      table.rolePreset,
    ),
    /** Every preset one invitation carries — the landing and the accept. */
    index('invitation_role_invitation_idx').on(table.invitationId),
  ],
);
