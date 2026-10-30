import {
  type Db,
  invoiceLine,
  invoiceLineTax,
  subscriptionInvoice,
  subscriptionPayment,
} from '@heliogrid/db';
import { asc, eq, inArray } from 'drizzle-orm';

/** What the invoicing suite reads back: a subscription's invoices, their lines and its payments. */

export async function invoicesOf(db: Db, subscriptionId: string) {
  return db
    .select({
      id: subscriptionInvoice.id,
      paymentId: subscriptionInvoice.paymentId,
      number: subscriptionInvoice.number,
      kind: subscriptionInvoice.kind,
      status: subscriptionInvoice.status,
      currencyCode: subscriptionInvoice.currencyCode,
      paysThrough: subscriptionInvoice.paysThrough,
      issuedAt: subscriptionInvoice.issuedAt,
      supplierRegistrationType: subscriptionInvoice.supplierRegistrationType,
      supplierRegistration: subscriptionInvoice.supplierRegistration,
      recipientRegistrationType: subscriptionInvoice.recipientRegistrationType,
      recipientRegistration: subscriptionInvoice.recipientRegistration,
      supplierPlace: subscriptionInvoice.supplierPlace,
      recipientPlace: subscriptionInvoice.recipientPlace,
      serviceCode: subscriptionInvoice.serviceCode,
    })
    .from(subscriptionInvoice)
    .where(eq(subscriptionInvoice.subscriptionId, subscriptionId))
    .orderBy(asc(subscriptionInvoice.issuedAt));
}

export async function linesOf(db: Db, invoiceId: string) {
  const lines = await db
    .select({
      id: invoiceLine.id,
      position: invoiceLine.position,
      taxableMinor: invoiceLine.taxableMinor,
      rateBasisPoints: invoiceLine.rateBasisPoints,
    })
    .from(invoiceLine)
    .where(eq(invoiceLine.invoiceId, invoiceId))
    .orderBy(asc(invoiceLine.position));
  const taxes =
    lines.length === 0
      ? []
      : await db
          .select({
            lineId: invoiceLineTax.lineId,
            code: invoiceLineTax.code,
            amount: invoiceLineTax.amountMinor,
          })
          .from(invoiceLineTax)
          .where(
            inArray(
              invoiceLineTax.lineId,
              lines.map((line) => line.id),
            ),
          )
          .orderBy(asc(invoiceLineTax.code));
  return lines.map(({ id, ...line }) => ({
    ...line,
    taxes: taxes.filter((tax) => tax.lineId === id).map(({ code, amount }) => ({ code, amount })),
  }));
}

export async function paymentsOf(db: Db, subscriptionId: string) {
  return db
    .select({ id: subscriptionPayment.id })
    .from(subscriptionPayment)
    .where(eq(subscriptionPayment.subscriptionId, subscriptionId));
}
