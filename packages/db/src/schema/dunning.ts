import { BILLING_NOTICES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { subscription, subscriptionPayment } from './billing';
import { tenant } from './tenant';

/** pgEnum hand-mirrors domain's tuple (invariant `enum-parity` proves the pair equal). */
export const billingNotice = pgEnum('billing_notice', BILLING_NOTICES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One fired notice of a subscription's dunning ladder or trial (`M12-39`, `M12-42`): the record its
 * notifications name as their subject, and what a payment clears (`M12-09`). One row per notice per
 * moment it fell due: `(tenant, subscription, notice, due_at)` is the key, so a retried or overlapping
 * sweep tells a notice once.
 *
 * Tenant-scoped, all four; `app_user` holds SELECT alone — the sweep and the charge cross tenants,
 * so the admin path writes it.
 */
export const dunningEvent = pgTable(
  'dunning_event',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscription.id),
    notice: billingNotice('notice').notNull(),
    /** The ladder's moment for this notice; it may be told later, never earlier. */
    dueAt: instant('due_at').notNull(),
    firedAt: instant('fired_at').notNull(),
    /** It told a company inside its price-protection horizon what a halt costs it (`M12-41`). */
    forfeitureDisclosed: boolean('forfeiture_disclosed').notNull(),
    /** When the sweep looks at this ladder again; `null` once the next notice took it over, or it ended. */
    nextDueAt: instant('next_due_at'),
    clearedAt: instant('cleared_at'),
    clearedByPayment: uuid('cleared_by_payment').references(() => subscriptionPayment.id),
  },
  (table) => [
    uniqueIndex('dunning_event_notice_key').on(
      table.tenantId,
      table.subscriptionId,
      table.notice,
      table.dueAt,
    ),
    /** A subscription's ladder in order: the billing screen's list and the last notice told. */
    index('dunning_event_tenant_subscription_idx').on(
      table.tenantId,
      table.subscriptionId,
      table.dueAt,
    ),
    /** The sweep's read: the ladders whose next look has come. */
    index('dunning_event_next_due_idx')
      .on(table.nextDueAt)
      .where(sql`${table.nextDueAt} is not null`),
  ],
);
