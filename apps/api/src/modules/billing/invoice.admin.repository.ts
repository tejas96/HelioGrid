import { invoiceDocumentWorkflow } from '@heliogrid/contracts/workflows';
import {
  type DbTransaction,
  invoiceLine,
  invoiceLineTax,
  invoiceSequence,
  planPrice,
  subscriptionInvoice,
  taxRegistration,
  uuidv7,
} from '@heliogrid/db';
import { type MarketPack, type MinorUnits, minorUnits } from '@heliogrid/domain';
import {
  fiscalYearOf,
  invoiceNumber,
  platformInvoice,
  platformSaleTotal,
  sumMinorUnits,
} from '@heliogrid/domain/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';
import {
  type CollectedAddOn,
  markInvoiced,
  markOnLink,
} from './overage-invoicing.admin.repository';

/** What settles an invoice: the payment that landed, or the renewal link that will collect it. */
export type SettledBy =
  | { readonly kind: 'payment'; readonly paymentId: string }
  | {
      readonly kind: 'link';
      readonly invoiceId: string;
      readonly gatewayRef: string;
      readonly hostedUrl: string;
      readonly dueAt: number;
    };

/** The invoice to work out and issue, inside its charge's or its renewal's transaction. */
export interface InvoiceFor {
  readonly tenantId: string;
  readonly subscriptionId: string;
  /** The plan the period buys: the conversion's, else the subscription's own. */
  readonly planPriceId: string | null;
  readonly paysThrough: number;
  readonly issuedAt: number;
  /** The company's market pack, current when the charge landed or the link was raised. */
  readonly pack: MarketPack;
  /** The overage add-ons it bills (`M12-35`), listed after the plan line. */
  readonly addOns: readonly CollectedAddOn[];
}

/** A reader on either pool: the renewal works its total out before its transaction opens. */
type Reader = Pick<DbTransaction, 'select'>;

/**
 * The invoice's lines, registrations and total as the pack works them out now (`M12-44`). The
 * renewal reads it first for the link's amount, then issues it, so the gateway collects exactly
 * what the invoice says.
 */
export async function workOutInvoice(db: Reader, invoice: InvoiceFor) {
  if (invoice.planPriceId === null) {
    throw new Error(`an invoice on ${invoice.subscriptionId} buys no plan, so none can be issued`);
  }
  const [plan] = await db
    .select({ id: planPrice.id, listMinor: planPrice.listMinor })
    .from(planPrice)
    .where(eq(planPrice.id, invoice.planPriceId))
    .limit(1);
  if (plan === undefined) throw new Error(`no plan price ${invoice.planPriceId}`);
  const worked = platformInvoice(
    invoice.pack,
    [minorUnits(plan.listMinor), ...invoice.addOns.map((addOn) => addOn.amount)],
    await companyRegistration(db, invoice.tenantId, invoice.pack),
  );
  return { planPriceId: plan.id, ...worked };
}

/**
 * Issues one cycle invoice (`M12-09`, `M12-44`) in the caller's transaction: settled by a recorded
 * payment, it issues `paid` beside it, so the two commit together or not at all; raised with a
 * renewal link, it issues `issued`, holding the link. The plan line is the plan the period buys,
 * and each overage add-on is a line after it; the company's registration is read here and copied
 * on, so a later edit changes no invoice issued. Answers the invoice's total.
 */
export async function issueInvoice(
  tx: DbTransaction,
  invoice: InvoiceFor,
  settledBy: SettledBy,
): Promise<MinorUnits> {
  const { pack } = invoice;
  const worked = await workOutInvoice(tx, invoice);
  const [fiscalYear, sequence] = await nextInSeries(tx, pack, invoice.issuedAt);
  const number = invoiceNumber(fiscalYear, sequence);
  const [issued] = await tx
    .insert(subscriptionInvoice)
    .values({
      tenantId: invoice.tenantId,
      subscriptionId: invoice.subscriptionId,
      marketCode: pack.market,
      number,
      kind: 'cycle',
      currencyCode: worked.currency,
      paysThrough: new Date(invoice.paysThrough),
      issuedAt: new Date(invoice.issuedAt),
      supplierRegistrationType: worked.supplierRegistration?.registrationType ?? null,
      supplierRegistration: worked.supplierRegistration?.value ?? null,
      recipientRegistrationType: worked.recipientRegistration?.registrationType ?? null,
      recipientRegistration: worked.recipientRegistration?.value ?? null,
      supplierPlace: worked.supplierPlace,
      recipientPlace: worked.recipientPlace,
      serviceCode: worked.serviceCode,
      ...(settledBy.kind === 'payment'
        ? { status: 'paid' as const, paymentId: settledBy.paymentId }
        : {
            id: settledBy.invoiceId,
            status: 'issued' as const,
            gatewayRef: settledBy.gatewayRef,
            hostedUrl: settledBy.hostedUrl,
            dueAt: new Date(settledBy.dueAt),
          }),
    })
    .returning({ id: subscriptionInvoice.id });
  if (issued === undefined) throw new Error(`invoice ${number} not written`);
  for (const [position, line] of worked.lines.entries()) {
    const [written] = await tx
      .insert(invoiceLine)
      .values({
        tenantId: invoice.tenantId,
        invoiceId: issued.id,
        position,
        ...lineSells(worked.planPriceId, invoice.addOns, position),
        taxableMinor: line.taxableAmount,
        rateBasisPoints: line.rateBasisPoints,
      })
      .returning({ id: invoiceLine.id });
    if (written === undefined) throw new Error(`line ${position} of ${number} not written`);
    if (line.components.length === 0) continue;
    await tx.insert(invoiceLineTax).values(
      line.components.map((component) => ({
        tenantId: invoice.tenantId,
        lineId: written.id,
        code: component.code,
        amountMinor: component.amount,
      })),
    );
  }
  // Its PDF is made after this commits, never inside it; the outbox sweep starts the run (`M12-44`).
  await recordOutboxEvent(tx, invoice.tenantId, invoiceDocumentWorkflow, {
    eventId: uuidv7(),
    tenantId: invoice.tenantId,
    invoiceId: issued.id,
  });
  if (settledBy.kind === 'payment') {
    await markInvoiced(tx, invoice.addOns, issued.id);
  } else {
    await markOnLink(tx, invoice.addOns, issued.id, {
      gatewayRef: settledBy.gatewayRef,
      at: invoice.issuedAt,
      collectedOf: (amount) => platformSaleTotal(pack, amount),
    });
  }
  return worked.totalAmount;
}

/**
 * A renewal link's payment: its invoice, `issued` or `failed`, turns `paid` naming the payment.
 * Answers the invoice's total; `null` when it is no longer payable — a second payment on a link
 * already paid, which the caller invoices on its own.
 */
export async function payRenewalInvoice(
  tx: DbTransaction,
  invoiceId: string,
  paymentId: string,
): Promise<MinorUnits | null> {
  const [paid] = await tx
    .update(subscriptionInvoice)
    .set({ status: 'paid', paymentId })
    .where(
      and(
        eq(subscriptionInvoice.id, invoiceId),
        inArray(subscriptionInvoice.status, ['issued', 'failed']),
      ),
    )
    .returning({ id: subscriptionInvoice.id });
  if (paid === undefined) return null;
  const taxable = sql<number>`coalesce(sum(${invoiceLine.taxableMinor}), 0)`.mapWith(Number);
  const [lines] = await tx
    .select({ taxable })
    .from(invoiceLine)
    .where(eq(invoiceLine.invoiceId, invoiceId));
  const [taxes] = await tx
    .select({
      tax: sql<number>`coalesce(sum(${invoiceLineTax.amountMinor}), 0)`.mapWith(Number),
    })
    .from(invoiceLineTax)
    .innerJoin(invoiceLine, eq(invoiceLine.id, invoiceLineTax.lineId))
    .where(eq(invoiceLine.invoiceId, invoiceId));
  return sumMinorUnits([minorUnits(lines?.taxable ?? 0), minorUnits(taxes?.tax ?? 0)]);
}

/** The plan row an invoice bills: its first line's. `null` for an invoice with no plan line. */
export async function planBilledBy(
  tx: DbTransaction,
  tenantId: string,
  invoiceId: string,
): Promise<string | null> {
  const [line] = await tx
    .select({ planPriceId: invoiceLine.planPriceId })
    .from(invoiceLine)
    .where(
      and(
        eq(invoiceLine.tenantId, tenantId),
        eq(invoiceLine.invoiceId, invoiceId),
        eq(invoiceLine.position, 0),
      ),
    );
  return line?.planPriceId ?? null;
}

/** What the line at `position` sells: the plan first, then each add-on in order. */
function lineSells(planPriceId: string, addOns: readonly CollectedAddOn[], position: number) {
  if (position === 0) return { planPriceId, overageAddOnId: null };
  const addOn = addOns[position - 1];
  if (addOn === undefined) throw new Error(`no add-on for invoice line ${position}`);
  return { planPriceId: null, overageAddOnId: addOn.id };
}

/** The company's registration of the type its market asks for; `null` when it gave none. */
async function companyRegistration(db: Reader, tenantId: string, pack: MarketPack) {
  const [asked] = pack.tax.registrationTypes;
  if (asked === undefined) return null;
  const [held] = await db
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
