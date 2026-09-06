import type { FormatPack } from '../format/pack';
import { applyRate, type BasisPoints } from '../money/basis-points';
import { type MinorUnits, sumMinorUnits } from '../money/minor-units';
import type { TaxComponentShare, TaxPack } from './pack';

/**
 * The ONE tax computation (`F1-31`, `M11-08`). BOM, proposal, tranche schedule and platform
 * invoice all take their tax from here, so they agree to the minor unit by construction: every
 * total is a SUM of the parts beneath it, never a second computation of the same figure.
 *
 * Scheme-neutral throughout (`F1-08`): the component codes, the place rule and the strategy are
 * read off `pack.tax`; nothing here knows what `CGST` means.
 */

/** The two pack keys the money path reads. A `MarketPack` satisfies it: pass the tenant's pack. */
export interface MoneyScheme {
  readonly tax: TaxPack;
  readonly formats: FormatPack;
}

/** Where the supplier and the recipient sit, in the scheme's own place vocabulary. */
export interface PlaceOfSupply {
  readonly supplier: string;
  readonly recipient: string;
}

export interface TaxableLine {
  readonly taxableAmount: MinorUnits;
  readonly rateBasisPoints: BasisPoints;
}

export interface TaxComponentAmount {
  readonly code: string;
  readonly amount: MinorUnits;
}

export interface TaxedLine extends TaxableLine {
  readonly components: readonly TaxComponentAmount[];
  /** The sum of `components`. */
  readonly taxAmount: MinorUnits;
}

/** A document's money block. Every amount in it is in `currency`, stamped here once (`F1-07`). */
export interface TaxBreakdown {
  readonly currency: string;
  readonly lines: readonly TaxedLine[];
  readonly taxableAmount: MinorUnits;
  /** One row per component the scheme declares for this place, each the sum over the lines. */
  readonly components: readonly TaxComponentAmount[];
  readonly taxAmount: MinorUnits;
  readonly totalAmount: MinorUnits;
}

function componentsAt(tax: TaxPack, place: PlaceOfSupply): readonly TaxComponentShare[] {
  const samePlace = place.supplier === place.recipient;
  return samePlace ? tax.placeOfSupply.samePlace : tax.placeOfSupply.differentPlace;
}

function taxLine(line: TaxableLine, shares: readonly TaxComponentShare[]): TaxedLine {
  const ofParts = shares.reduce((total, share) => total + share.parts, 0);
  const components = shares.map((share) => ({
    code: share.code,
    amount: applyRate(line.taxableAmount, line.rateBasisPoints, { parts: share.parts, ofParts }),
  }));
  const taxAmount = sumMinorUnits(components.map((component) => component.amount));
  return { ...line, components, taxAmount };
}

function componentTotals(
  lines: readonly TaxedLine[],
  shares: readonly TaxComponentShare[],
): readonly TaxComponentAmount[] {
  return shares.map((share) => {
    const ofThisCode = lines.flatMap((line) =>
      line.components.filter((component) => component.code === share.code),
    );
    return {
      code: share.code,
      amount: sumMinorUnits(ofThisCode.map((component) => component.amount)),
    };
  });
}

/**
 * `per_line_rate` only: every line carries its own rate. `document_level` is vocabulary until a
 * pack declares it (`tax/pack.ts`), and asking for it is refused rather than guessed.
 */
export function taxBreakdown(
  scheme: MoneyScheme,
  lines: readonly TaxableLine[],
  place: PlaceOfSupply,
): TaxBreakdown {
  if (scheme.tax.strategy === 'document_level') {
    throw new Error(
      'no authored market computes tax document_level; its maths lands with the first pack that does',
    );
  }
  const shares = componentsAt(scheme.tax, place);
  const taxed = lines.map((line) => taxLine(line, shares));
  const taxableAmount = sumMinorUnits(taxed.map((line) => line.taxableAmount));
  const taxAmount = sumMinorUnits(taxed.map((line) => line.taxAmount));
  return {
    currency: scheme.formats.currency,
    lines: taxed,
    taxableAmount,
    components: componentTotals(taxed, shares),
    taxAmount,
    totalAmount: sumMinorUnits([taxableAmount, taxAmount]),
  };
}
