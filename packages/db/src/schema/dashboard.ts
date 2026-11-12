import { sql } from 'drizzle-orm';
import { bigint, check, date, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { userAccount } from './identity';
import { tenant } from './tenant';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * The company's monthly target (`M13-17`): the goal only, one per company and month, set inline on
 * the owner dashboard; actuals derive at read time. Clearing the target deletes the row.
 *
 * Tenant-scoped, all four always. SELECT, INSERT, UPDATE and DELETE for `app_user`.
 */
export const monthlyTarget = pgTable(
  'monthly_target',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** The month's first day on the tenant's clock. */
    month: date('month', { mode: 'string' }).notNull(),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    setAt: instant('set_at').notNull(),
    setBy: uuid('set_by')
      .notNull()
      .references(() => userAccount.id),
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.month] }),
    check('monthly_target_month_first_day', sql`extract(day from ${table.month}) = 1`),
    check('monthly_target_amount_not_negative', sql`${table.amountMinor} >= 0`),
  ],
);

/**
 * The month one company's summary was written (`M13-21`). The row is the claim: the step inserts
 * it in the transaction that writes the summary, so a second run finds it and does nothing.
 *
 * Tenant-scoped, all four always. SELECT and INSERT alone for `app_user`: a claim never changes.
 */
export const monthlySummary = pgTable(
  'monthly_summary',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** The summarised month's first day on the tenant's clock. */
    month: date('month', { mode: 'string' }).notNull(),
    writtenAt: instant('written_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.month] })],
);
