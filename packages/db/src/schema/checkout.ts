import { CHECKOUT_PURPOSES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
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
export const checkoutPurpose = pgEnum('checkout_purpose', CHECKOUT_PURPOSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A hosted checkout a trial or a dead row opened (`M12-54`, `M12-08`): which plan it buys, on which rail, and the gateway's
 * page. The gateway's message names its `gateway_ref`, so the charge it collected finds the plan
 * the company chose. Open until a charge converts the subscription or a new pick replaces it; one
 * open checkout per subscription, so two pages can never both collect.
 *
 * Tenant-scoped, all four; `app_user` holds SELECT alone — the gateway's messages cross tenants,
 * so the admin path writes it.
 */
export const billingCheckout = pgTable(
  'billing_checkout',
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
    planPriceId: uuid('plan_price_id')
      .notNull()
      .references(() => planPrice.id),
    collection: collectionKind('collection').notNull(),
    gatewayRef: text('gateway_ref').notNull(),
    hostedUrl: text('hosted_url').notNull(),
    /** The hosted page takes no money after this: the trial's end, or a reactivation's window. */
    expiresAt: instant('expires_at').notNull(),
    /**
     * When the paid period it collects begins, for a page a cancelled row still running opened: its
     * period end, so no day is paid twice (`M12-08`). Null: the period begins at the charge.
     */
    startsAt: instant('starts_at'),
    openedAt: instant('opened_at').notNull(),
    /**
     * Set before the gateway is asked to cancel the page. From then the page is never handed out
     * again, even when the cancel's answer was lost and the row is still open.
     */
    cancelRequestedAt: instant('cancel_requested_at'),
    closedAt: instant('closed_at'),
    /** The Owner who opened it: the reactivation its charge makes is their act (`M12-58`). */
    openedBy: uuid('opened_by').references(() => userAccount.id),
    /** A conversion or reactivation, or an upgrade's part-cycle charge (`M12-48`). */
    purpose: checkoutPurpose('purpose').notNull().default('conversion'),
    /** An upgrade's page alone: the charge for the days left, ex-tax, and the plan it pays toward. */
    chargeMinor: bigint('charge_minor', { mode: 'number' }),
    /**
     * An upgrade's page alone: the plan its charge was priced from. A payment landing after the row
     * moved off it is refused, never applied on a stale charge.
     */
    fromPlanPriceId: uuid('from_plan_price_id').references(() => planPrice.id),
  },
  (table) => [
    uniqueIndex('billing_checkout_gateway_ref_key').on(table.gatewayRef),
    index('billing_checkout_tenant_subscription_idx').on(
      table.tenantId,
      table.subscriptionId,
      table.openedAt,
    ),
    /** The reconcile's read of the pages still able to take money, by when they stop. */
    index('billing_checkout_open_idx').on(table.expiresAt).where(sql`${table.closedAt} is null`),
    uniqueIndex('billing_checkout_one_open')
      .on(table.tenantId, table.subscriptionId)
      .where(sql`${table.closedAt} is null`),
    /** An upgrade's page carries its charge and the plan it was priced from; a conversion neither. */
    check(
      'billing_checkout_plan_change_priced',
      sql`(${table.fromPlanPriceId} is null) = (${table.purpose} = 'conversion') and (${table.chargeMinor} is null) = (${table.purpose} = 'conversion')`,
    ),
  ],
);
