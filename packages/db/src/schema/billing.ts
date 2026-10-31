import {
  BILLING_CYCLES,
  BILLING_STATES,
  COLLECTION_KINDS,
  SUBSCRIPTION_CAUSES,
  TIERS,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
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
export const tier = pgEnum('tier', TIERS);
export const billingCycle = pgEnum('billing_cycle', BILLING_CYCLES);
export const collectionKind = pgEnum('collection_kind', COLLECTION_KINDS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One tier on one cycle as the gateway sells it (`M12-12`): the mirror of one gateway plan object.
 * Our rows are the truth for entitlements and the gateway's for money. The publish command writes a
 * row when the latest one for its market × tier × cycle × currency collects a different amount, so
 * an unchanged price keeps its plan object across pack revisions; `pack_version` is the revision
 * that first sold it (`F1-11`). A row's amounts never change and no row is deleted — a sent price
 * stands (`M12-57`). Only `gateway_plan_ref` is ever rewritten, when the bound gateway does not hold
 * that plan object (`plan-price.service.ts`): such a ref can open no page.
 *
 * Global: no company owns a price. `app_user` holds no grant; the admin path alone reads and writes.
 */
export const planPrice = pgTable(
  'plan_price',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    marketCode: text('market_code').notNull(),
    packVersion: text('pack_version').notNull(),
    tier: tier('tier').notNull(),
    cycle: billingCycle('cycle').notNull(),
    currencyCode: text('currency_code').notNull(),
    /** The book's price, ex-tax (`BM-40`). */
    listMinor: bigint('list_minor', { mode: 'number' }).notNull(),
    /** What the gateway collects: the list price, plus the platform sale's tax once registered (`F1-29`). */
    collectedMinor: bigint('collected_minor', { mode: 'number' }).notNull(),
    gatewayPlanRef: text('gateway_plan_ref').notNull(),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('plan_price_version_key').on(
      table.marketCode,
      table.tier,
      table.cycle,
      table.currencyCode,
      table.packVersion,
    ),
    /** The current row of a market × tier × cycle × currency: the latest written. */
    index('plan_price_current_idx').on(
      table.marketCode,
      table.tier,
      table.cycle,
      table.currencyCode,
      table.createdAt,
    ),
  ],
);

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
    /**
     * What the company pays for, set by the charge that converted it (`M12-54`). All four are null
     * on a trial that has not paid, and all four are set together after.
     */
    tier: tier('tier'),
    cycle: billingCycle('cycle'),
    planPriceId: uuid('plan_price_id').references(() => planPrice.id),
    /** The gateway's subscription or payment link this row is collected on. */
    gatewayRef: text('gateway_ref'),
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
    /** The reconcile's reads: live rows collected at the gateway by their ref, and recent halts. */
    index('subscription_reconcile_live_idx')
      .on(table.gatewayRef)
      .where(sql`${table.gatewayRef} is not null and ${table.state} in ('active', 'past_due')`),
    index('subscription_reconcile_halted_idx')
      .on(table.stateEnteredAt)
      .where(sql`${table.gatewayRef} is not null and ${table.state} = 'halted'`),
    /** The renewal sweep's queue: live rows whose paid period has ended (`M12-11`). */
    index('subscription_renewal_due_idx')
      .on(table.paidPeriodEnd)
      .where(sql`${table.gatewayRef} is not null and ${table.state} = 'active'`),
    uniqueIndex('subscription_gateway_ref_key')
      .on(table.gatewayRef)
      .where(sql`${table.gatewayRef} is not null`),
    check(
      'subscription_plan_whole',
      sql`(${table.tier} is null) = (${table.cycle} is null) and (${table.tier} is null) = (${table.planPriceId} is null) and (${table.tier} is null) = (${table.gatewayRef} is null)`,
    ),
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
    /** When the overage of the period it pays for was reckoned (`M12-35`); `null` until then. */
    overageReckonedAt: instant('overage_reckoned_at'),
  },
  (table) => [
    uniqueIndex('subscription_payment_charge_ref_key').on(table.gatewayChargeRef),
    /** The overage sweep's queue: periods not yet reckoned, by when they closed. */
    index('subscription_payment_overage_due_idx')
      .on(table.paysThrough)
      .where(sql`${table.overageReckonedAt} is null`),
    /** The latest charge of a subscription, and the billing screen's list. */
    index('subscription_payment_tenant_subscription_idx').on(
      table.tenantId,
      table.subscriptionId,
      table.occurredAt,
    ),
  ],
);

/**
 * A hosted checkout a trial opened (`M12-54`): which plan it buys, on which rail, and the gateway's
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
    /** The hosted page takes no money after this: the trial's end. */
    expiresAt: instant('expires_at').notNull(),
    openedAt: instant('opened_at').notNull(),
    /**
     * Set before the gateway is asked to cancel the page. From then the page is never handed out
     * again, even when the cancel's answer was lost and the row is still open.
     */
    cancelRequestedAt: instant('cancel_requested_at'),
    closedAt: instant('closed_at'),
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
  ],
);

/**
 * Every gateway message the api acted on, by the provider's own event id: the transport dedupe
 * (`forward-compat.md`, webhooks), so a message sent again does nothing and alerts nothing twice.
 * A row is written only once its effect is done; the effects are idempotent on their own keys
 * besides, so a message acted on twice still moves nothing twice.
 *
 * Global: a message names no company until it is read. `app_user` holds no grant.
 */
export const billingGatewayEvent = pgTable(
  'billing_gateway_event',
  {
    provider: text('provider').notNull(),
    eventRef: text('event_ref').notNull(),
    receivedAt: instant('received_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.eventRef] })],
);
