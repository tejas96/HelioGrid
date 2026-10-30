import {
  type DbTransaction,
  invoiceLine,
  invoiceLineTax,
  invoiceSequence,
  planPrice,
  subscriptionInvoice,
  taxRegistration,
} from '@heliogrid/db';
import { type MarketPack, type MinorUnits, minorUnits } from '@heliogrid/domain';
import { fiscalYearOf, invoiceNumber, platformInvoice } from '@heliogrid/domain/server';
import { and, eq, sql } from 'drizzle-orm';
import { type CollectedAddOn, markInvoiced } from './overage-invoicing.admin.repository';

/** The payment an invoice is issued for, inside its charge's transaction. */
export interface InvoiceFor {
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly paymentId: string;
  /** The plan the payment buys: the conversion's, else the subscription's own. */
  readonly planPriceId: string | null;
  readonly paysThrough: number;
  readonly issuedAt: number;
  /** The company's market pack, current when the charge landed. */
  readonly pack: MarketPack;
  /** The overage add-ons the debit collected (`M12-35`), listed after the plan line. */
  readonly addOns: readonly CollectedAddOn[];
}

/**
 * Issues the cycle invoice for one recorded payment (`M12-09`, `M12-44`), in the transaction that
 * recorded it: a payment and its invoice commit together or not at all. The plan line is the
 * plan the payment buys, and each overage add-on the debit collected is a line after it; the company's registration is read here and copied on, so a later edit
 * changes no invoice issued. Answers the invoice's total, which the caller sets beside the charge.
 */
export async function issueInvoice(tx: DbTransaction, payment: InvoiceFor): Promise<MinorUnits> {
  if (payment.planPriceId === null) {
    throw new Error(`payment ${payment.paymentId} buys no plan, so no invoice can be issued`);
  }
  const [plan] = await tx
    .select({ id: planPrice.id, listMinor: planPrice.listMinor })
    .from(planPrice)
    .where(eq(planPrice.id, payment.planPriceId))
    .limit(1);
  if (plan === undefined) throw new Error(`no plan price ${payment.planPriceId}`);
  const { pack } = payment;
  const invoice = platformInvoice(
    pack,
    [minorUnits(plan.listMinor), ...payment.addOns.map((addOn) => addOn.amount)],
    await companyRegistration(tx, payment.tenantId, pack),
  );
  const [fiscalYear, sequence] = await nextInSeries(tx, pack, payment.issuedAt);
  const number = invoiceNumber(fiscalYear, sequence);
  const [issued] = await tx
    .insert(subscriptionInvoice)
    .values({
      tenantId: payment.tenantId,
      subscriptionId: payment.subscriptionId,
      paymentId: payment.paymentId,
      marketCode: pack.market,
      number,
      kind: 'cycle',
      status: 'paid',
      currencyCode: invoice.currency,
      paysThrough: new Date(payment.paysThrough),
      issuedAt: new Date(payment.issuedAt),
      supplierRegistrationType: invoice.supplierRegistration?.registrationType ?? null,
      supplierRegistration: invoice.supplierRegistration?.value ?? null,
      recipientRegistrationType: invoice.recipientRegistration?.registrationType ?? null,
      recipientRegistration: invoice.recipientRegistration?.value ?? null,
      supplierPlace: invoice.supplierPlace,
      recipientPlace: invoice.recipientPlace,
      serviceCode: invoice.serviceCode,
    })
    .returning({ id: subscriptionInvoice.id });
  if (issued === undefined) throw new Error(`invoice for payment ${payment.paymentId} not written`);
  for (const [position, line] of invoice.lines.entries()) {
    const [written] = await tx
      .insert(invoiceLine)
      .values({
        tenantId: payment.tenantId,
        invoiceId: issued.id,
        position,
        ...lineSells(plan.id, payment.addOns, position),
        taxableMinor: line.taxableAmount,
        rateBasisPoints: line.rateBasisPoints,
      })
      .returning({ id: invoiceLine.id });
    if (written === undefined) throw new Error(`line ${position} of ${number} not written`);
    if (line.components.length === 0) continue;
    await tx.insert(invoiceLineTax).values(
      line.components.map((component) => ({
        tenantId: payment.tenantId,
        lineId: written.id,
        code: component.code,
        amountMinor: component.amount,
      })),
    );
  }
  await markInvoiced(
    tx,
    payment.addOns.map((addOn) => addOn.id),
    issued.id,
  );
  return invoice.totalAmount;
}

/** What the line at `position` sells: the plan first, then each add-on in order. */
function lineSells(planPriceId: string, addOns: readonly CollectedAddOn[], position: number) {
  if (position === 0) return { planPriceId, overageAddOnId: null };
  const addOn = addOns[position - 1];
  if (addOn === undefined) throw new Error(`no add-on for invoice line ${position}`);
  return { planPriceId: null, overageAddOnId: addOn.id };
}

/** The company's registration of the type its market asks for; `null` when it gave none. */
async function companyRegistration(tx: DbTransaction, tenantId: string, pack: MarketPack) {
  const [asked] = pack.tax.registrationTypes;
  if (asked === undefined) return null;
  const [held] = await tx
    .select({ registrationType: taxRegistration.registrationType, value: taxRegistration.value })
    .from(taxRegistration)
    .where(
      and(eq(taxRegistration.tenantId, tenantId), eq(taxRegistration.registrationType, asked.type)),
    )
    .limit(1);
  return held ?? null;
}

/**
 * The next number of the market's series in the fiscal year `at` falls in. The counter row is
 * taken in the caller's transaction, so two charges number one after the other and a rollback
 * hands the number back: the series runs without a gap.
 */
async function nextInSeries(
  tx: DbTransaction,
  pack: MarketPack,
  at: number,
): Promise<[fiscalYear: string, sequence: number]> {
  const fiscalYear = fiscalYearOf(at, pack.formats.timeZone, pack.tax.fiscalYearStartMonth);
  const [taken] = await tx
    .insert(invoiceSequence)
    .values({ marketCode: pack.market, fiscalYear, lastNumber: 1 })
    .onConflictDoUpdate({
      target: [invoiceSequence.marketCode, invoiceSequence.fiscalYear],
      set: { lastNumber: sql`${invoiceSequence.lastNumber} + 1` },
    })
    .returning({ lastNumber: invoiceSequence.lastNumber });
  if (taken === undefined) throw new Error(`no invoice number for ${pack.market} ${fiscalYear}`);
  return [fiscalYear, taken.lastNumber];
}
