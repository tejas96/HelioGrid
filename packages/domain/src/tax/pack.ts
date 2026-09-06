import { type BasisPoints, basisPoints } from '../money/basis-points';
import { type MinorUnits, minorUnits } from '../money/minor-units';

/**
 * `pack.tax` — the market's tax scheme as scheme-neutral structure (`F1-08`, `F1-13`). The
 * product stores and renders percentages, a components breakdown and tenant registrations; the
 * scheme's own words (`GST`, `CGST`, `IN_GST`, `998434`) appear only as VALUES here, never as a
 * field, a column or a line of copy anywhere else. `tax/breakdown.ts` is the maths that reads
 * this; `M12` reads it for the platform invoice, `M05`/`M06`/`M11` for the tenant's money path,
 * `M01` for registration capture, and `pack.data-rights` for the retention period.
 */

/**
 * How rates attach (`F1-08`). `per_line_rate`: every catalog, proposal and invoice line carries
 * its own rate and the document breakdown is the sum of the lines. `document_level`: one rate on
 * the document's taxable total — vocabulary today, since no authored market declares it; its
 * maths lands with the first pack that does, because which rate a document carries is that
 * scheme's fact.
 */
export const TAX_STRATEGIES = ['per_line_rate', 'document_level'] as const;
export type TaxStrategy = (typeof TAX_STRATEGIES)[number];

/** One component of the tax a line carries, and the part of the line's rate it takes. */
export interface TaxComponentShare {
  /** The scheme's own code — `CGST`. Printed as is: a statutory name is never translated (`F3-08`). */
  readonly code: string;
  /** Parts of the rate, out of the sum of parts in its list. CGST and SGST take 1 each of 2. */
  readonly parts: number;
}

/**
 * Where the scheme splits tax by place (`F1-13`): the components a line carries when the
 * supplier and the recipient sit in the same place, and when they do not. A scheme that never
 * splits declares the same single component on both sides.
 */
export interface PlaceOfSupplyRule {
  readonly samePlace: readonly TaxComponentShare[];
  readonly differentPlace: readonly TaxComponentShare[];
}

/** A tenant registration the scheme knows, and when the product asks for it (`F1-13`). */
export interface TaxRegistrationType {
  /** The value a stored registration validates against — `IN_GST`. Text, never a closed enum. */
  readonly type: string;
  /**
   * RegExp source of a well-formed value; `M01-25` explains a malformed one against it. Source
   * text rather than a RegExp, because a pack is data that will be stored.
   */
  readonly pattern: string;
  /** At conversion: a paying tenant needs it on its invoice, and not before (`F1-29`). */
  readonly capturedAt: 'conversion';
}

/** How the platform's own subscription sale is taxed in this market (`F1-13`, `BM-40`). */
export interface PlatformSaleTax {
  /** The scheme's service classification for the sale — `998434`, cloud/SaaS, in IN. */
  readonly serviceCode: string;
  readonly rateBasisPoints: BasisPoints;
}

/**
 * A scheme-tagged duty that attaches to invoices only past a threshold (`F1-13`, `F1-30`). Once
 * it binds it binds from then on; nothing before it is backfilled.
 */
export interface StatutoryExtra {
  /** The scheme-tagged key the invoice carries it under — `e_invoicing`. */
  readonly key: string;
  /** Binds once the platform's turnover in a financial year EXCEEDS this. At it, not yet. */
  readonly activatesWhenTurnoverExceeds: MinorUnits;
}

export interface TaxPack {
  /** The scheme's identifier — `GST`. A value, never a field name. */
  readonly scheme: string;
  readonly strategy: TaxStrategy;
  readonly registrationTypes: readonly TaxRegistrationType[];
  readonly placeOfSupply: PlaceOfSupplyRule;
  readonly platformSale: PlatformSaleTax;
  /**
   * Whether the platform itself is supplier of record for subscription sales here — its
   * registration, its remittance, its liability — or a merchant of record sells for it
   * (`F1-13`, `BM-40`).
   */
  readonly platformIsSupplierOfRecord: boolean;
  readonly statutoryExtras: readonly StatutoryExtra[];
  /** The month the statutory financial year opens: a threshold is validated at each close (`F1-30`). */
  readonly fiscalYearStartMonth: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /**
   * Statutory retention of financial and tax records, in years — the erasure carve-out that
   * `pack.data-rights` honors (`F1-13`, `F1-24`).
   */
  readonly recordRetentionYears: number;
}

/**
 * India — GST (`F1-28`). Every value cites the row that fixes it; a reader checks this table
 * against the PRD rather than trusting the code.
 */
export const IN_TAX: TaxPack = {
  scheme: 'GST',
  /** `F1-28`, `F1-31` — per-line GST, with the document-level breakdown summed from the lines. */
  strategy: 'per_line_rate',
  registrationTypes: [
    {
      type: 'IN_GST',
      /**
       * GSTIN: state code, PAN, entity number, `Z`, check character — 15 characters. The format
       * only; the check character is the registry's to verify, and the product says so (`Q76`).
       */
      pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$',
      /** `F1-29` — a B2B tenant needs it on the invoice for input tax credit. */
      capturedAt: 'conversion',
    },
  ],
  /**
   * `F1-29` — a place is the two-digit state code, the GSTIN's first two characters.
   * Intra-state: CGST and SGST in halves. Inter-state: IGST.
   */
  placeOfSupply: {
    samePlace: [
      { code: 'CGST', parts: 1 },
      { code: 'SGST', parts: 1 },
    ],
    differentPlace: [{ code: 'IGST', parts: 1 }],
  },
  /** `F1-28` — SAC 998434, cloud/SaaS, at 18%; book prices are ex-tax (`BM-40`). */
  platformSale: { serviceCode: '998434', rateBasisPoints: basisPoints(1800) },
  /** `F1-29` — our GSTIN, our remittance, our liability; the gateway is a gateway. */
  platformIsSupplierOfRecord: true,
  statutoryExtras: [
    /** `F1-30` — e-invoicing (IRN) binds once turnover exceeds ₹5 crore: 5,00,00,000.00 in paise. */
    { key: 'e_invoicing', activatesWhenTurnoverExceeds: minorUnits(50_000_000_000) },
  ],
  /** `F1-30` — the Indian financial year opens 1 April. */
  fiscalYearStartMonth: 4,
  /** `F1-32` — GST records are kept 6+ years; `pack.data-rights` reads this as its carve-out. */
  recordRetentionYears: 6,
};
