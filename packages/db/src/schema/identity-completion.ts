import {
  bigint,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { rolePreset } from './enums';
import { tenants, users } from './identity';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const inviteStatus = pgEnum('invite_status', ['pending', 'accepted', 'expired', 'revoked']);

/** TENANT — phone-based invites; raw token never stored, only its hash (docs/04 §1). */
export const invites = pgTable(
  'invites',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    phoneE164: text('phone_e164').notNull(),
    roles: rolePreset('roles').array().notNull(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id),
    tokenHash: text('token_hash').notNull().unique(),
    status: inviteStatus('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index('invites_tenant_status_idx').on(t.tenantId, t.status)],
);

/** TENANT — one row per tenant; sections are read-whole config documents (docs/04 §1). */
export const tenantSettings = pgTable('tenant_settings', {
  id: uuid('id').primaryKey().$defaultFn(uuidv7),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id)
    .unique(),
  branding: jsonb('branding'),
  proposalDefaults: jsonb('proposal_defaults'),
  leadSources: jsonb('lead_sources'),
  capture: jsonb('capture'),
  locale: jsonb('locale'),
  ...timestamps,
});

/** TENANT — server-assigned business numbers; allocate with SELECT … FOR UPDATE only. */
export const tenantCounters = pgTable(
  'tenant_counters',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    counterKey: text('counter_key').notNull(),
    nextValue: bigint('next_value', { mode: 'number' }).notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.counterKey] })],
);
