import type { MinorUnits } from '../money';

/**
 * The outlier rule (`M13-18`): a deal figure is shown as a median, never a mean, so one outsized
 * C&I deal cannot make the period look healthier than it is. The LOW median — the lower of the two
 * middles for an even count — so no amount is ever split and no rounding happens outside `money/`.
 * A new money figure, so it lives on `./server` (`F4-04`).
 */
export function lowMedianOf(amounts: readonly MinorUnits[]): MinorUnits | null {
  if (amounts.length === 0) return null;
  const sorted = [...amounts].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? null;
}
