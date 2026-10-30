import type { TaxRegistration } from '../commerce/effective-settings';
import type { BasisPoints } from '../money/basis-points';
import { type MinorUnits, sumMinorUnits } from '../money/minor-units';
import { type MoneyScheme, type TaxComponentAmount, taxBreakdown } from './breakdown';
import { placeOfRegistration } from './registration';

/** One line of a platform invoice: its ex-tax amount, and the tax on it when the platform charges any. */
export interface PlatformInvoiceLine {
  readonly taxableAmount: MinorUnits;
  /** `null` on a plain invoice: the platform holds no registration, so the line carries no tax. */
  readonly rateBasisPoints: BasisPoints | null;
  readonly components: readonly TaxComponentAmount[];
}

/**
 * The money and the parties of one platform invoice (`M12-44`, `M12-45`), worked out once at
 * issue and stored as it stands, so a later pack never changes a document already issued.
 */
export interface PlatformInvoice {
  readonly currency: string;
  readonly lines: readonly PlatformInvoiceLine[];
  /** The platform's registration; `null` on a plain invoice (`F1-29`). */
  readonly supplierRegistration: TaxRegistration | null;
  /** The company's registration, captured at conversion; `null` for a company that gave none. */
  readonly recipientRegistration: TaxRegistration | null;
  readonly supplierPlace: string | null;
  readonly recipientPlace: string | null;
  /** The scheme's service code for the sale; `null` on a plain invoice. */
  readonly serviceCode: string | null;
  /** The sum of the lines and their tax: what the gateway collects. */
  readonly totalAmount: MinorUnits;
}

/**
 * The platform invoice for these ex-tax lines sold to this company (`M12-44`). With no registration
 * of its own the platform charges no tax and names no registration: a plain invoice. With one, the
 * scheme's components split by place — the company's place read off its registration, and the
 * supplier's for a company that gave none, since its address names no place (`F1-29`): the split
 * moves, the total never does.
 */
export function platformInvoice(
  scheme: MoneyScheme,
  listPrices: readonly MinorUnits[],
  company: TaxRegistration | null,
): PlatformInvoice {
  const supplier = scheme.tax.platformRegistration;
  if (supplier === null) {
    return {
      currency: scheme.formats.currency,
      lines: listPrices.map((taxableAmount) => ({
        taxableAmount,
        rateBasisPoints: null,
        components: [],
      })),
      supplierRegistration: null,
      recipientRegistration: company,
      supplierPlace: null,
      recipientPlace: null,
      serviceCode: null,
      totalAmount: sumMinorUnits(listPrices),
    };
  }
  const supplierPlace = placeOfRegistration(scheme.tax, supplier);
  const companyPlace = company === null ? null : placeOfRegistration(scheme.tax, company);
  const recipientPlace = companyPlace ?? supplierPlace;
  const { rateBasisPoints, serviceCode } = scheme.tax.platformSale;
  const breakdown = taxBreakdown(
    scheme,
    listPrices.map((taxableAmount) => ({ taxableAmount, rateBasisPoints })),
    { supplier: supplierPlace ?? '', recipient: recipientPlace ?? '' },
  );
  return {
    currency: breakdown.currency,
    lines: breakdown.lines.map(({ taxableAmount, components }) => ({
      taxableAmount,
      rateBasisPoints,
      components,
    })),
    supplierRegistration: supplier,
    recipientRegistration: company,
    supplierPlace,
    recipientPlace,
    serviceCode,
    totalAmount: breakdown.totalAmount,
  };
}
