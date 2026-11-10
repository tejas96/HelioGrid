import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { userAccount } from './identity';
import { lead } from './lead';
import { tenant } from './tenant';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * The lead-side record of booking a site visit (`M02-46`): when, which surveyor, the confirmed
 * address. A reschedule books a new row naming the booking it replaces, set at the insert, and a
 * booking is replaced at most once. The one reminder a visit may have (`M02-48`) is the moment it was
 * composed, set once where still null. The visit object itself is M04's.
 *
 * Tenant-scoped, all four always. SELECT, INSERT and UPDATE for `app_user` (the reminder, the
 * no-show); a replaced visit is kept.
 */
export const leadVisitBooking = pgTable(
  'lead_visit_booking',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => lead.id),
    scheduledAt: instant('scheduled_at').notNull(),
    surveyorUserId: uuid('surveyor_user_id')
      .notNull()
      .references(() => userAccount.id),
    address: text('address').notNull(),
    rescheduledFromId: uuid('rescheduled_from_id').references(
      (): AnyPgColumn => leadVisitBooking.id,
    ),
    reminderComposedAt: instant('reminder_composed_at'),
    noShowAt: instant('no_show_at'),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    index('lead_visit_booking_tenant_lead_idx').on(
      table.tenantId,
      table.leadId,
      table.scheduledAt.desc(),
    ),
    /** The Assigned scope: leads whose booked visit names me (RFC decision 9). */
    index('lead_visit_booking_tenant_surveyor_idx').on(
      table.tenantId,
      table.surveyorUserId,
      table.scheduledAt,
    ),
    uniqueIndex('lead_visit_booking_tenant_rescheduled_from_key')
      .on(table.tenantId, table.rescheduledFromId)
      .where(sql`${table.rescheduledFromId} is not null`),
    uniqueIndex('lead_visit_booking_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    check('lead_visit_booking_address_given', sql`char_length(btrim(${table.address})) >= 1`),
    check(
      'lead_visit_booking_never_replaces_itself',
      sql`${table.rescheduledFromId} <> ${table.id}`,
    ),
  ],
);
