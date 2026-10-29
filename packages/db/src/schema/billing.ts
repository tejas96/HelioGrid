import { BILLING_STATES, SUBSCRIPTION_CAUSES } from '@heliogrid/domain';
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
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const billingState = pgEnum('billing_state', BILLING_STATES);
export const subscriptionCause = pgEnum('subscription_cause', SUBSCRIPTION_CAUSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * A company's subscription — the one lifecycle machine (`M12-04`). The edges and the timers are
 * domain's (`commerce/lifecycle.ts`); this stores where the machine stands. The phase is never
 * stored: the clock settles it from these columns.
 *
 * Reactivation starts a NEW row (`M12-08`), so `expired` and `cancelled` are final for their row,
 * and `halted` is left only by a charge made inside its grace (`commerce/charges.ts`). A company
 * holds at most one row in a live state — the partial unique key.
 *
 * Tenant-scoped, all four always. `app_user` holds SELECT alone: signup and the timers write it
 * on the admin path, since both cross tenants.
 */
export const subscription = pgTable(
  'subscription',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    state: billingState('state').notNull(),
    /** When the row entered its state — the day count of `past_due` runs from here (`M12-06`). */
    stateEnteredAt: instant('state_entered_at').notNull(),
    /** Set on a row that began as a trial (`M12-52`); null on one that never trialled. */
    trialEndsAt: instant('trial_ends_at'),
    /** The end of the paid period, from conversion onward (`M12-05`, `M12-50`). */
    paidPeriodEnd: instant('paid_period_end'),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    /** `M12-04` — at most one live subscription per company. */
    uniqueIndex('subscription_one_live_per_tenant')
      .on(table.tenantId)
      .where(sql`${table.state} in ('trialing', 'active', 'past_due')`),
    index('subscription_tenant_created_idx').on(table.tenantId, table.createdAt),
    /** The timers' two reads: trials by their end, `past_due` rows by when they entered it. */
    index('subscription_trial_due_idx')
      .on(table.trialEndsAt)
      .where(sql`${table.state} = 'trialing'`),
    index('subscription_grace_due_idx')
      .on(table.stateEnteredAt)
      .where(sql`${table.state} = 'past_due'`),
    /** A trial without an end would never expire. */
    check(
      'subscription_trial_has_end',
      sql`${table.state} <> 'trialing' or ${table.trialEndsAt} is not null`,
    ),
  ],
);

/**
 * Every state a subscription entered, when and why (`M12-04`, §M12.2). Read it in `id` order —
 * the order rows were written: `entered_at` is when the state took effect, so a halt undone by a
 * charge made inside its grace records an `entered_at` before the halt's. Append-only: no role under
 * `app_user` holds UPDATE, DELETE or TRUNCATE (`append-only-ledgers.ts`). Whether a transition was
 * the tenant's act or the clock's follows from its cause, so it is not stored.
 */
export const subscriptionStateHistory = pgTable(
  'subscription_state_history',
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
    state: billingState('state').notNull(),
    cause: subscriptionCause('cause').notNull(),
    enteredAt: instant('entered_at').notNull(),
  },
  (table) => [
    index('subscription_state_history_tenant_subscription_idx').on(
      table.tenantId,
      table.subscriptionId,
      table.enteredAt,
    ),
  ],
);

/**
 * Every charge the gateway collected (`M12-09`): the payment a successful charge writes, the
 * entitlement truth. Append-only: no role under `app_user` holds UPDATE, DELETE or TRUNCATE
 * (`append-only-ledgers.ts`). Only successful charges are rows; a failure is a state move.
 *
 * The gateway's charge reference is the one idempotency key: the same charge told twice is one
 * row. Tenant-scoped, all four; `app_user` holds SELECT alone — the gateway's messages cross
 * tenants, so the admin path writes it.
 */
export const subscriptionPayment = pgTable(
  'subscription_payment',
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
    gatewayChargeRef: text('gateway_charge_ref').notNull(),
    /** Whole minor units of the company's one currency, stamped beside it (`F1-07`). */
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    currencyCode: text('currency_code').notNull(),
    /** The end of the period this charge pays for. */
    paysThrough: instant('pays_through').notNull(),
    /** When the gateway collected it — the order charges are judged in. */
    occurredAt: instant('occurred_at').notNull(),
    recordedAt: instant('recorded_at').notNull(),
  },
  (table) => [
    uniqueIndex('subscription_payment_charge_ref_key').on(table.gatewayChargeRef),
    /** The latest charge of a subscription, and the billing screen's list. */
    index('subscription_payment_tenant_subscription_idx').on(
      table.tenantId,
      table.subscriptionId,
      table.occurredAt,
    ),
  ],
);
