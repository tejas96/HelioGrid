import { PLAN_CHANGE_STATUSES, SCHEDULED_PLAN_CHANGES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { collectionKind, planPrice, subscription } from './billing';
import { userAccount } from './identity';
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const scheduledPlanChange = pgEnum('scheduled_plan_change', SCHEDULED_PLAN_CHANGES);
export const planChangeStatus = pgEnum('plan_change_status', PLAN_CHANGE_STATUSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A downgrade or a cycle switch the Owner confirmed, waiting for the paid period's end
 * (`M12-49`, `M12-12`). The billing timers apply it then, before the renewal is raised; the
 * Owner can withdraw it until they do. A later pick replaces it, so a row holds at most one
 * `scheduled` change. `preview_digest` names the usage the Owner confirmed on: the timers read
 * the preview again and tell the Owner when the picture changed.
 *
 * Tenant-scoped, all four. `app_user` holds SELECT alone: the acts and the timers write it on the
 * admin path.
 */
export const subscriptionPlanChange = pgTable(
  'subscription_plan_change',
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
    kind: scheduledPlanChange('kind').notNull(),
    toPlanPriceId: uuid('to_plan_price_id')
      .notNull()
      .references(() => planPrice.id),
    toCollection: collectionKind('to_collection').notNull(),
    effectiveAt: instant('effective_at').notNull(),
    status: planChangeStatus('status').notNull(),
    previewDigest: text('preview_digest').notNull(),
    scheduledBy: uuid('scheduled_by')
      .notNull()
      .references(() => userAccount.id),
    createdAt: instant('created_at').notNull(),
    settledAt: instant('settled_at'),
  },
  (table) => [
    index('subscription_plan_change_tenant_idx').on(
      table.tenantId,
      table.subscriptionId,
      table.createdAt,
    ),
    uniqueIndex('subscription_plan_change_one_scheduled')
      .on(table.tenantId, table.subscriptionId)
      .where(sql`${table.status} = 'scheduled'`),
    /** The timers' read: scheduled changes by when they fall due. */
    index('subscription_plan_change_due_idx')
      .on(table.effectiveAt)
      .where(sql`${table.status} = 'scheduled'`),
    check(
      'subscription_plan_change_settled',
      sql`(${table.settledAt} is null) = (${table.status} = 'scheduled')`,
    ),
  ],
);
