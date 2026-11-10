import { date, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenant } from './tenant';

/**
 * The day one company's 09:00 CRM sweep ran (`M02-49`, RFC decision 7). The row is the claim: the
 * sweep inserts it in the transaction that does the day's work, so a second run that day finds it
 * and does nothing, and a failed sweep leaves no row and runs again. The pair is the key.
 *
 * Tenant-scoped, all four always. SELECT and INSERT alone for `app_user`: a claim never changes.
 */
export const crmDailySweep = pgTable(
  'crm_daily_sweep',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** `YYYY-MM-DD` on the tenant's clock. */
    localDate: date('local_date', { mode: 'string' }).notNull(),
    ranAt: timestamp('ran_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.localDate] })],
);
