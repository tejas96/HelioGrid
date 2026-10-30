import { INVOICE_KINDS, INVOICE_STATUSES } from '@heliogrid/domain';
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
import { tenant } from './tenant';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const invoiceKind = pgEnum('invoice_kind', INVOICE_KINDS);
export const invoiceStatus = pgEnum('invoice_status', INVOICE_STATUSES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One platform invoice (`M12-44`, `M12-45`): a frozen document, worked out once when the payment it
 * names lands and never recomputed, so a later pack changes no invoice already issued. Its money
 * is its lines; every total is their sum. The parties are copied as they stood: the platform's
 * registration (none on a plain invoice, `F1-29`) and the company's, with the place each names.
 *
 * Tenant-scoped, all four; `app_user` holds SELECT alone — the charge crosses tenants, so the
 * admin path writes it. Only `status` will ever change, as a later slice grows its vocabulary.
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
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => subscriptionPayment.id),
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
    check(
      'subscription_invoice_recipient_whole',
      sql`(${table.recipientRegistrationType} is null) = (${table.recipientRegistration} is null)`,
    ),
  ],
);

/**
 * One line of an invoice: what it sells and its ex-tax amount, with the rate it carries — `null`
 * on a plain invoice. Append-only with its invoice. Tenant-scoped, all four; SELECT alone.
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
    /** The tier on its cycle the line sells, as the gateway sold it. */
    planPriceId: uuid('plan_price_id')
      .notNull()
      .references(() => planPrice.id),
    taxableMinor: bigint('taxable_minor', { mode: 'number' }).notNull(),
    rateBasisPoints: integer('rate_basis_points'),
  },
  (table) => [
    uniqueIndex('invoice_line_position_key').on(table.tenantId, table.invoiceId, table.position),
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
