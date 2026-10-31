import { INVOICE_KINDS, INVOICE_STATUSES, OVERAGE_ADDON_STATUSES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { planPrice, subscription, subscriptionPayment } from './billing';
import { file } from './file';
import { tenant } from './tenant';
import { BILLED_METERS, usageMeter } from './usage';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const invoiceKind = pgEnum('invoice_kind', INVOICE_KINDS);
export const invoiceStatus = pgEnum('invoice_status', INVOICE_STATUSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One platform invoice (`M12-44`, `M12-45`): a frozen document, worked out once when it issues and
 * never recomputed, so a later pack changes no invoice already issued. Its money is its lines;
 * every total is their sum. The parties are copied as they stood: the platform's registration
 * (none on a plain invoice, `F1-29`) and the company's, with the place each names.
 *
 * Most issue `paid`, naming the payment that landed. A renewal's issues first, with the payment
 * link that collects it (`M12-11`), and names its payment once the link is paid; only `status`
 * and `payment_id` ever change, and `pdf_file_id` once, from null.
 *
 * Tenant-scoped, all four; `app_user` holds SELECT alone — the charge crosses tenants, so the
 * admin path writes it.
 */
export const subscriptionInvoice = pgTable(
  'subscription_invoice',
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
    /** The payment it is paid by; set exactly while the invoice is `paid`. */
    paymentId: uuid('payment_id').references(() => subscriptionPayment.id),
    /** The market whose series numbers it: the platform's one series per market per fiscal year. */
    marketCode: text('market_code').notNull(),
    number: text('number').notNull(),
    kind: invoiceKind('kind').notNull(),
    status: invoiceStatus('status').notNull(),
    currencyCode: text('currency_code').notNull(),
    /** The end of the period the payment pays for. */
    paysThrough: instant('pays_through').notNull(),
    issuedAt: instant('issued_at').notNull(),
    supplierRegistrationType: text('supplier_registration_type'),
    supplierRegistration: text('supplier_registration'),
    recipientRegistrationType: text('recipient_registration_type'),
    recipientRegistration: text('recipient_registration'),
    supplierPlace: text('supplier_place'),
    recipientPlace: text('recipient_place'),
    /** The scheme's service code for the sale; `null` on a plain invoice. */
    serviceCode: text('service_code'),
    /** A renewal's payment link at the gateway, and the page the company pays on. */
    gatewayRef: text('gateway_ref'),
    hostedUrl: text('hosted_url'),
    /** When a renewal still unpaid is a failed charge (`M12-05`). */
    dueAt: instant('due_at'),
    /** Its PDF, made once after it issues and never again; null until then (`M12-44`). */
    pdfFileId: uuid('pdf_file_id').references(() => file.id),
  },
  (table) => [
    uniqueIndex('subscription_invoice_payment_key').on(table.tenantId, table.paymentId),
    uniqueIndex('subscription_invoice_number_key').on(table.marketCode, table.number),
    /** A company's invoices in order: the billing screen's list and export. */
    index('subscription_invoice_tenant_issued_idx').on(table.tenantId, table.issuedAt),
    check(
      'subscription_invoice_supplier_whole',
      sql`(${table.supplierRegistrationType} is null) = (${table.supplierRegistration} is null)`,
    ),
    /** A gateway ref collects for one invoice; a renewal is raised once per period. */
    uniqueIndex('subscription_invoice_gateway_ref_key')
      .on(table.gatewayRef)
      .where(sql`${table.gatewayRef} is not null`),
    uniqueIndex('subscription_invoice_renewal_key')
      .on(table.tenantId, table.subscriptionId, table.paysThrough)
      .where(sql`${table.gatewayRef} is not null`),
    /** The timers' queue: renewals still unpaid, by the moment they fail. */
    index('subscription_invoice_due_idx').on(table.dueAt).where(sql`${table.status} = 'issued'`),
    /**
     * The reconcile's set: renewal links that can still take money. Keyed on the due moment, so a
     * run reads only the links of the last grace, never every renewal a halted row left `failed`.
     */
    index('subscription_invoice_open_link_idx')
      .on(table.dueAt)
      .where(sql`${table.status} in ('issued', 'failed')`),
    check(
      'subscription_invoice_paid_by_payment',
      sql`(${table.paymentId} is not null) = (${table.status} = 'paid')`,
    ),
    check(
      'subscription_invoice_link_whole',
      sql`(${table.gatewayRef} is null) = (${table.hostedUrl} is null) and (${table.gatewayRef} is null) = (${table.dueAt} is null)`,
    ),
    check(
      'subscription_invoice_recipient_whole',
      sql`(${table.recipientRegistrationType} is null) = (${table.recipientRegistration} is null)`,
    ),
  ],
);

/**
 * One line of an invoice: what it sells — a plan, or one overage add-on — and its ex-tax amount,
 * with the rate it carries — `null` on a plain invoice. Append-only with its invoice. Tenant-scoped, all four; SELECT alone.
 */
export const invoiceLine = pgTable(
  'invoice_line',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => subscriptionInvoice.id),
    /** Its order on the invoice, from zero. */
    position: smallint('position').notNull(),
    /** A plan line: the tier on its cycle it sells, as the gateway sold it. */
    planPriceId: uuid('plan_price_id').references(() => planPrice.id),
    /** An add-on line: the overage it bills, whose meter, quantity and rate it shows (`M12-35`). */
    overageAddOnId: uuid('overage_addon_id').references(() => overageAddOn.id),
    taxableMinor: bigint('taxable_minor', { mode: 'number' }).notNull(),
    rateBasisPoints: integer('rate_basis_points'),
  },
  (table) => [
    uniqueIndex('invoice_line_position_key').on(table.tenantId, table.invoiceId, table.position),
    check(
      'invoice_line_sells_one',
      sql`(${table.planPriceId} is null) <> (${table.overageAddOnId} is null)`,
    ),
  ],
);

/**
 * One tax component on one line, in the scheme's own code (`CGST`): the invoice's breakdown is the
 * sum of these by code. Append-only. Tenant-scoped, all four; SELECT alone.
 */
export const invoiceLineTax = pgTable(
  'invoice_line_tax',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    lineId: uuid('line_id')
      .notNull()
      .references(() => invoiceLine.id),
    code: text('code').notNull(),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('invoice_line_tax_code_key').on(table.tenantId, table.lineId, table.code),
  ],
);

/**
 * The last number of each market's invoice series in each fiscal year. Taken in the transaction
 * that issues the invoice, so a rolled-back issue hands its number back and the series runs
 * without a gap, as the tax scheme asks.
 *
 * Global: the series is the platform's, across every company. `app_user` holds no grant.
 */
export const invoiceSequence = pgTable(
  'invoice_sequence',
  {
    marketCode: text('market_code').notNull(),
    fiscalYear: text('fiscal_year').notNull(),
    lastNumber: integer('last_number').notNull(),
  },
  (table) => [primaryKey({ columns: [table.marketCode, table.fiscalYear] })],
);

/** Hand-mirrors domain's tuple (invariant `enum-parity`). */
export const overageAddOnStatus = pgEnum('overage_addon_status', OVERAGE_ADDON_STATUSES);

/**
 * One meter's overage in one closed paid period (`M12-35`): reckoned from the usage ledger past
 * the company's allowance at the book's published rate, added to the company's mandate so a later
 * debit collects it, and then a line on that debit's invoice. Its meter, quantity and rate are
 * fixed at reckoning; the invoice line points here rather than copying them.
 *
 * One row per subscription, meter and period start, so a period is never billed twice. Tenant-
 * scoped, all four; `app_user` holds SELECT alone — the sweep crosses tenants, so the admin path
 * writes it.
 */
export const overageAddOn = pgTable(
  'overage_addon',
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
    /** The payment whose period this measures. */
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => subscriptionPayment.id),
    meter: usageMeter('meter').notNull(),
    windowFrom: instant('window_from').notNull(),
    windowTo: instant('window_to').notNull(),
    /** Billed units used, the allowance they ran past, and the units billed — all billed units. */
    used: bigint('used', { mode: 'number' }).notNull(),
    allowance: bigint('allowance', { mode: 'number' }).notNull(),
    quantity: bigint('quantity', { mode: 'number' }).notNull(),
    unitRateMinor: bigint('unit_rate_minor', { mode: 'number' }).notNull(),
    /** `quantity × unit_rate_minor`, ex-tax: the invoice line's taxable amount. */
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    status: overageAddOnStatus('status').notNull(),
    reckonedAt: instant('reckoned_at').notNull(),
    /** When a run last tried it and left it `pending` (it waited, or was refused): the queue's turn. */
    triedAt: instant('tried_at'),
    /** The mandate it was added to, the gateway's id for it, what the gateway collects, and when. */
    gatewayRef: text('gateway_ref'),
    gatewayAddOnRef: text('gateway_addon_ref'),
    gatewayAmountMinor: bigint('gateway_amount_minor', { mode: 'number' }),
    addedAt: instant('added_at'),
    invoiceId: uuid('invoice_id').references(() => subscriptionInvoice.id),
  },
  (table) => [
    uniqueIndex('overage_addon_period_key').on(
      table.tenantId,
      table.subscriptionId,
      table.meter,
      table.windowFrom,
    ),
    /** The sweep's queue: rows never tried first, then the longest untried, oldest first. */
    index('overage_addon_pending_idx')
      .on(table.triedAt.asc().nullsFirst(), table.reckonedAt)
      .where(sql`${table.status} = 'pending'`),
    /** What already waits on one mandate's next debit, for the cap. */
    index('overage_addon_on_mandate_idx')
      .on(table.gatewayRef)
      .where(sql`${table.status} in ('adding', 'added')`),
    check('overage_addon_billed_meter', sql`${table.meter} in (${BILLED_METERS})`),
    check('overage_addon_bills_something', sql`${table.quantity} > 0 and ${table.amountMinor} > 0`),
    check(
      'overage_addon_sent_whole',
      sql`(${table.status} in ('adding', 'added', 'invoiced')) = (${table.gatewayRef} is not null and ${table.gatewayAmountMinor} is not null and ${table.addedAt} is not null)`,
    ),
    /** A link's add-on rides the link itself, so only a mandate's carries a gateway add-on ref. */
    check(
      'overage_addon_added_whole',
      sql`${table.status} <> 'added' or ${table.gatewayAddOnRef} is not null`,
    ),
    check(
      'overage_addon_invoiced_whole',
      sql`(${table.status} = 'invoiced') = (${table.invoiceId} is not null)`,
    ),
  ],
);
