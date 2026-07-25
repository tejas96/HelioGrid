import {
  index,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { rolePreset, tenantSegment, tenantStatus, uiLanguage, unitPref, userStatus } from './enums';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** PLATFORM — the multi-tenant root; `tenants.id` IS the Better Auth organization.id. */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().$defaultFn(uuidv7),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  segment: tenantSegment('segment'),
  typicalSystemKw: numeric('typical_system_kw', { precision: 8, scale: 2 }),
  gstin: text('gstin'),
  address: jsonb('address'),
  bankDetails: jsonb('bank_details'),
  logoFileId: uuid('logo_file_id'),
  countryCode: text('country_code').notNull().default('IN'),
  stateCode: text('state_code'),
  status: tenantStatus('status').notNull().default('active'),
  ...timestamps,
});

/** TENANT — domain profile, 1:1 with the Better Auth user (same id). */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().$defaultFn(uuidv7),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    name: text('name').notNull(),
    phoneE164: text('phone_e164').notNull().unique(),
    language: uiLanguage('language').notNull().default('en'),
    unitsPref: unitPref('units_pref').notNull().default('m'),
    photoFileId: uuid('photo_file_id'),
    status: userStatus('status').notNull().default('invited'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('users_tenant_status_idx').on(t.tenantId, t.status)],
);

/** TENANT — six presets, OR across held roles (D27/D28); no per-user overrides, on purpose. */
export const userRoles = pgTable(
  'user_roles',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: rolePreset('role').notNull(),
    grantedBy: uuid('granted_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.userId, t.role] })],
);
