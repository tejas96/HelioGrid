import { type MinorUnits, minorUnits } from './minor-units';

/**
 * A rate in basis points: `1800` is 18.00%. Whole numbers, so a rate applied to an amount is
 * exact arithmetic, and one-to-one with the wire's two-decimal percent (`percentSchema`). A
 * brand for the reason `MinorUnits` is one: `18` cannot be handed in where `1800` is due.
 */
declare const BASIS_POINTS: unique symbol;

export type BasisPoints = number & { readonly [BASIS_POINTS]: 'rate' };

/** 10 000 basis points is the whole amount. */
const WHOLE_RATE = 10_000;

/** 0 to 10 000 inclusive. A rate above 100% is an authoring error, not a tax. */
export function basisPoints(rate: number): BasisPoints {
  if (!Number.isInteger(rate) || rate < 0 || rate > WHOLE_RATE) {
    throw new RangeError(
      `a rate is a whole number of basis points, 0 to 10000, not ${String(rate)}`,
    );
  }
  return rate as BasisPoints;
}

/** The part of a line's rate one tax component takes: CGST takes 1 part of 2 under GST. */
export interface Share {
  readonly parts: number;
  readonly ofParts: number;
}

const WHOLE_SHARE: Share = { parts: 1, ofParts: 1 };

/**
 * `amount × rate × share`, rounded ONCE to the minor unit, half away from zero (owner ruling
 * `Q83`). This is the only place money rounds: a second rounding, anywhere, is how a BOM and its
 * proposal come to differ by a paisa (`M11-08`).
 *
 * BigInt, not float: `amount × rate` passes 2^53 well inside numeric(14,3)'s range, and a float
 * would then carry the wrong paisa without a word.
 */
export function applyRate(
  amount: MinorUnits,
  rate: BasisPoints,
  share: Share = WHOLE_SHARE,
): MinorUnits {
  const numerator = BigInt(Math.abs(amount)) * BigInt(rate) * BigInt(share.parts);
  const denominator = BigInt(WHOLE_RATE) * BigInt(share.ofParts);
  const rounded = (2n * numerator + denominator) / (2n * denominator);
  return minorUnits(Number(amount < 0 ? -rounded : rounded));
}
