import { CONTACT_ROLE_SEEDS } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  customType,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { userAccount } from './identity';
import { tenant, uiLanguage } from './tenant';

/** pgEnum hand-mirrors domain's tuple (invariant `enum-parity`). */
export const contactRoleSeed = pgEnum('contact_role_seed', CONTACT_ROLE_SEEDS);

/** A full-text document, written only by the database: a generated column never takes a value. */
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A phone-identified person or organisation, the dedupe anchor (`M02-02`). The number is the
 * identity, not a unique key: *Keep both* lands a second row with the same number (`M02-12`), so
 * `(tenant_id, phone_e164)` is a plain index — `text_pattern_ops`, so it answers the dedupe's exact
 * match and search's national-number prefix (the tenant's calling code plus the digits typed).
 *
 * Only the number is required (`M02-03`): a missing name or city is a named gap. Do-not-call and the
 * wrong-number block are the moment each was set — set is on, null is off (`M02-37`, `M02-44`).
 * `primary_contact_id` null means the customer is their own primary; set, the key holds it to one of
 * THEIR contacts, so a merge clears the loser's before re-pointing its contacts. A merged customer is
 * a tombstone: `merged_into`, `merged_at` and `merged_by` are set together and the row stays.
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user`; never deleted.
 */
export const customer = pgTable(
  'customer',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** Normalised by the market pack (`M02-02`). */
    phoneE164: text('phone_e164').notNull(),
    name: text('name'),
    city: text('city'),
    /** The product addresses a customer only in a language it has. */
    preferredLanguage: uiLanguage('preferred_language'),
    doNotCallSetAt: instant('do_not_call_set_at'),
    doNotCallSetBy: uuid('do_not_call_set_by').references(() => userAccount.id),
    /** Set, no dial is offered for this number (`M02-44`). */
    wrongNumberAt: instant('wrong_number_at'),
    primaryContactId: uuid('primary_contact_id'),
    mergedInto: uuid('merged_into').references((): AnyPgColumn => customer.id),
    mergedAt: instant('merged_at'),
    mergedBy: uuid('merged_by').references(() => userAccount.id),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
    /** Name and city as `simple` terms — search's document (`F6-24`); the database writes it. */
    search: tsvector('search').generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("city", ''))`,
    ),
  },
  (table) => [
    index('customer_tenant_phone_idx').on(table.tenantId, table.phoneE164.op('text_pattern_ops')),
    /** The survivor's stream reads every customer merged into it (RFC decision 17). */
    index('customer_tenant_merged_into_idx')
      .on(table.tenantId, table.mergedInto)
      .where(sql`${table.mergedInto} is not null`),
    // GIN cannot lead with tenant_id without btree_gin, which the migration role cannot create.
    index('customer_search_idx').using('gin', table.search),
    foreignKey({
      name: 'customer_primary_contact_is_own_fk',
      columns: [table.tenantId, table.id, table.primaryContactId],
      foreignColumns: [contact.tenantId, contact.customerId, contact.id],
    }),
    check(
      'customer_do_not_call_names_its_setter',
      sql`(${table.doNotCallSetAt} is null) = (${table.doNotCallSetBy} is null)`,
    ),
    check(
      'customer_merge_is_whole',
      sql`(${table.mergedInto} is null) = (${table.mergedAt} is null) and (${table.mergedAt} is null) = (${table.mergedBy} is null)`,
    ),
    check('customer_never_merged_into_itself', sql`${table.mergedInto} <> ${table.id}`),
  ],
);

/**
 * A role a contact is given (`M02-34`): one of the three seeds every company starts with — stored by
 * its key, because its words are catalog copy — or a company's own plain text, never both. Seeded
 * for each company at its creation.
 *
 * Tenant-scoped, all four always. SELECT and INSERT for `app_user`: no rename or retirement exists.
 */
export const contactRoleLabel = pgTable(
  'contact_role_label',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    seedKey: contactRoleSeed('seed_key'),
    label: text('label'),
    createdAt: instant('created_at').notNull(),
    /** Null on a seeded label: no person made it. */
    createdBy: uuid('created_by').references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    uniqueIndex('contact_role_label_tenant_seed_key')
      .on(table.tenantId, table.seedKey)
      .where(sql`${table.seedKey} is not null`),
    uniqueIndex('contact_role_label_tenant_label_key')
      .on(table.tenantId, table.label)
      .where(sql`${table.label} is not null`),
    uniqueIndex('contact_role_label_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check(
      'contact_role_label_seed_or_text',
      sql`(${table.seedKey} is null) <> (${table.label} is null)`,
    ),
    check('contact_role_label_text_given', sql`char_length(btrim(${table.label})) >= 1`),
  ],
);

/**
 * Another person on a customer — the decision-maker, the landlord, a spouse (`M02-34`). Their number
 * joins the dedupe, so a capture of it meets this customer (`M02-02`). The unique key on
 * (tenant, customer, id) is what the customer's primary-contact key points at.
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user` (a merge re-points
 * contacts to the survivor); never deleted.
 */
export const contact = pgTable(
  'contact',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    customerId: uuid('customer_id')
      .notNull()
      .references((): AnyPgColumn => customer.id),
    name: text('name').notNull(),
    phoneE164: text('phone_e164').notNull(),
    roleLabelId: uuid('role_label_id').references(() => contactRoleLabel.id),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    unique('contact_tenant_customer_id_key').on(table.tenantId, table.customerId, table.id),
    index('contact_tenant_phone_idx').on(table.tenantId, table.phoneE164.op('text_pattern_ops')),
    uniqueIndex('contact_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
  ],
);

/**
 * Two customers kept apart on purpose despite one number (`M02-12`): only *Keep both* writes one,
 * with its mandatory reason, and a merge resolves it (T-M02-008's grain: customers, never leads).
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user`; never deleted.
 */
export const duplicateLink = pgTable(
  'duplicate_link',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    customerAId: uuid('customer_a_id')
      .notNull()
      .references(() => customer.id),
    customerBId: uuid('customer_b_id')
      .notNull()
      .references(() => customer.id),
    reason: text('reason').notNull(),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
    resolvedAt: instant('resolved_at'),
  },
  (table) => [
    index('duplicate_link_tenant_customer_a_idx').on(table.tenantId, table.customerAId),
    index('duplicate_link_tenant_customer_b_idx').on(table.tenantId, table.customerBId),
    check('duplicate_link_two_customers', sql`${table.customerAId} <> ${table.customerBId}`),
    check('duplicate_link_reason_given', sql`char_length(btrim(${table.reason})) >= 1`),
  ],
);
