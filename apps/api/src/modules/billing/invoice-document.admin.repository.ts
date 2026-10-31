import {
  businessProfile,
  type Db,
  invoiceLine,
  invoiceLineTax,
  overageAddOn,
  planPrice,
  subscriptionInvoice,
  tenant,
} from '@heliogrid/db';
import {
  type BasisPoints,
  type BilledLedgerMeter,
  type BillingCycle,
  basisPoints,
  isBilledMeter,
  type LedgerMeter,
  type MinorUnits,
  minorUnits,
  type Tier,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** What one line sells: the plan on its cycle, or one overage add-on at its fixed rate. */
export type DocumentLineSells =
  | { readonly kind: 'plan'; readonly tier: Tier; readonly cycle: BillingCycle }
  | {
      readonly kind: 'overage';
      readonly meter: BilledLedgerMeter;
      readonly quantity: number;
      readonly unitRate: MinorUnits;
    };

export interface DocumentLine {
  readonly sells: DocumentLineSells;
  readonly taxableAmount: MinorUnits;
  readonly rateBasisPoints: BasisPoints | null;
  readonly components: readonly { readonly code: string; readonly amount: MinorUnits }[];
}

/** An invoice as it was stored at issue, with the company it was issued to as it stands now. */
export interface InvoiceForDocument {
  readonly marketCode: string;
  readonly number: string;
  readonly issuedAt: Date;
  readonly paysThrough: Date;
  readonly supplierRegistration: { readonly type: string; readonly value: string } | null;
  readonly recipientRegistration: { readonly type: string; readonly value: string } | null;
  readonly recipientPlace: string | null;
  readonly serviceCode: string | null;
  readonly company: {
    readonly name: string;
    readonly address: string | null;
    readonly postalCode: string | null;
    readonly city: string;
    readonly language: UiLanguage;
    readonly timeZone: string;
  };
  readonly lines: readonly DocumentLine[];
}

/**
 * The invoice PDF's two reads and its one write, across companies: the step runs from a workflow,
 * never a request, so it holds no tenant session. Every read still names the invoice's tenant.
 */
@Injectable()
export class InvoiceDocumentAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The invoice to print; `null` when it already has its PDF, or no such invoice exists. */
  async invoiceForDocument(
    tenantId: string,
    invoiceId: string,
  ): Promise<InvoiceForDocument | null> {
    const [invoice] = await this.db
      .select({
        marketCode: subscriptionInvoice.marketCode,
        number: subscriptionInvoice.number,
        issuedAt: subscriptionInvoice.issuedAt,
        paysThrough: subscriptionInvoice.paysThrough,
        supplierRegistrationType: subscriptionInvoice.supplierRegistrationType,
        supplierRegistration: subscriptionInvoice.supplierRegistration,
        recipientRegistrationType: subscriptionInvoice.recipientRegistrationType,
        recipientRegistration: subscriptionInvoice.recipientRegistration,
        recipientPlace: subscriptionInvoice.recipientPlace,
        serviceCode: subscriptionInvoice.serviceCode,
        name: tenant.companyName,
        city: tenant.city,
        language: tenant.defaultLanguage,
        timeZone: tenant.timezone,
        address: businessProfile.address,
        postalCode: businessProfile.postalCode,
      })
      .from(subscriptionInvoice)
      .innerJoin(tenant, eq(tenant.id, subscriptionInvoice.tenantId))
      .leftJoin(businessProfile, eq(businessProfile.tenantId, subscriptionInvoice.tenantId))
      .where(
        and(
          eq(subscriptionInvoice.tenantId, tenantId),
          eq(subscriptionInvoice.id, invoiceId),
          isNull(subscriptionInvoice.pdfFileId),
        ),
      )
      .limit(1);
    if (invoice === undefined) return null;
    return {
      marketCode: invoice.marketCode,
      number: invoice.number,
      issuedAt: invoice.issuedAt,
      paysThrough: invoice.paysThrough,
      supplierRegistration: registration(
        invoice.supplierRegistrationType,
        invoice.supplierRegistration,
      ),
      recipientRegistration: registration(
        invoice.recipientRegistrationType,
        invoice.recipientRegistration,
      ),
      recipientPlace: invoice.recipientPlace,
      serviceCode: invoice.serviceCode,
      company: {
        name: invoice.name,
        address: invoice.address,
        postalCode: invoice.postalCode,
        city: invoice.city,
        language: invoice.language,
        timeZone: invoice.timeZone,
      },
      lines: await this.linesOf(tenantId, invoiceId),
    };
  }

  /** Points the invoice at its PDF, once: `false` when an earlier run already had. */
  async attachPdf(tenantId: string, invoiceId: string, fileId: string): Promise<boolean> {
    const attached = await this.db
      .update(subscriptionInvoice)
      .set({ pdfFileId: fileId })
      .where(
        and(
          eq(subscriptionInvoice.tenantId, tenantId),
          eq(subscriptionInvoice.id, invoiceId),
          isNull(subscriptionInvoice.pdfFileId),
        ),
      )
      .returning({ id: subscriptionInvoice.id });
    return attached.length > 0;
  }

  /** The lines in their order, each with what it sells and its tax in the order it was written. */
  private async linesOf(tenantId: string, invoiceId: string): Promise<DocumentLine[]> {
    const lines = await this.db
      .select({
        id: invoiceLine.id,
        taxable: invoiceLine.taxableMinor,
        rate: invoiceLine.rateBasisPoints,
        tier: planPrice.tier,
        cycle: planPrice.cycle,
        meter: overageAddOn.meter,
        quantity: overageAddOn.quantity,
        unitRate: overageAddOn.unitRateMinor,
      })
      .from(invoiceLine)
      .leftJoin(planPrice, eq(planPrice.id, invoiceLine.planPriceId))
      .leftJoin(overageAddOn, eq(overageAddOn.id, invoiceLine.overageAddOnId))
      .where(and(eq(invoiceLine.tenantId, tenantId), eq(invoiceLine.invoiceId, invoiceId)))
      .orderBy(asc(invoiceLine.position));
    const taxes = await this.db
      .select({
        lineId: invoiceLineTax.lineId,
        code: invoiceLineTax.code,
        amount: invoiceLineTax.amountMinor,
      })
      .from(invoiceLineTax)
      .innerJoin(invoiceLine, eq(invoiceLine.id, invoiceLineTax.lineId))
      .where(and(eq(invoiceLineTax.tenantId, tenantId), eq(invoiceLine.invoiceId, invoiceId)))
      .orderBy(asc(invoiceLineTax.id));
    return lines.map((line) => ({
      sells: sellsOf(line),
      taxableAmount: minorUnits(line.taxable),
      rateBasisPoints: line.rate === null ? null : basisPoints(line.rate),
      components: taxes
        .filter((tax) => tax.lineId === line.id)
        .map((tax) => ({ code: tax.code, amount: minorUnits(tax.amount) })),
    }));
  }
}

function registration(type: string | null, value: string | null) {
  return type === null || value === null ? null : { type, value };
}

/** A line sells exactly one thing (`invoice_line_sells_one`); a line that sells none is a broken table. */
function sellsOf(line: {
  readonly tier: Tier | null;
  readonly cycle: BillingCycle | null;
  readonly meter: LedgerMeter | null;
  readonly quantity: number | null;
  readonly unitRate: number | null;
}): DocumentLineSells {
  if (line.tier !== null && line.cycle !== null) {
    return { kind: 'plan', tier: line.tier, cycle: line.cycle };
  }
  if (
    line.meter !== null &&
    isBilledMeter(line.meter) &&
    line.quantity !== null &&
    line.unitRate !== null
  ) {
    return {
      kind: 'overage',
      meter: line.meter,
      quantity: line.quantity,
      unitRate: minorUnits(line.unitRate),
    };
  }
  throw new Error('an invoice line sells neither a plan nor an add-on');
}
