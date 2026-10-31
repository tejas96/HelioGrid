import type { BasisPoints } from '../money/basis-points';
import { type MinorUnits, sumMinorUnits } from '../money/minor-units';
import type { TaxComponentAmount } from './breakdown';

/** One line of an invoice as it was stored at issue: its ex-tax amount, its rate and its tax. */
export interface StoredInvoiceLine {
  readonly taxableAmount: MinorUnits;
  /** `null` on a plain invoice (`F1-29`). */
  readonly rateBasisPoints: BasisPoints | null;
  readonly components: readonly TaxComponentAmount[];
}

/** What an invoice prints under its lines (`M12-44`): every figure a sum of the stored lines. */
export interface InvoiceTotals {
  readonly subtotal: MinorUnits;
  /** Each tax code once, in the order the lines first carry it — `CGST` before `SGST`. */
  readonly taxByCode: readonly TaxComponentAmount[];
  readonly total: MinorUnits;
}

/**
 * The totals of an invoice already issued, summed from its stored lines and never worked out
 * again from a pack: the document prints what the charge collected, to the minor unit.
 */
export function invoiceTotals(lines: readonly StoredInvoiceLine[]): InvoiceTotals {
  const byCode = new Map<string, MinorUnits[]>();
  for (const line of lines) {
    for (const { code, amount } of line.components) {
      byCode.set(code, [...(byCode.get(code) ?? []), amount]);
    }
  }
  const taxByCode = [...byCode].map(([code, amounts]) => ({
    code,
    amount: sumMinorUnits(amounts),
  }));
  const subtotal = sumMinorUnits(lines.map((line) => line.taxableAmount));
  return {
    subtotal,
    taxByCode,
    total: sumMinorUnits([subtotal, ...taxByCode.map((tax) => tax.amount)]),
  };
}
