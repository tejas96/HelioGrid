import { applyRate, type BasisPoints } from '../money/basis-points';
import type { MinorUnits } from '../money/minor-units';

/**
 * The sample contract the Payment terms page prices its schedule on (`SCR-M01-20`), in the
 * currency's major unit — a policy number, tier `assumed`. It must stay a whole multiple of
 * 10 000 minor units at every currency's digit count: then every two-decimal share of it is
 * exact, and the parts of a met split sum to it with no remainder to place.
 */
export const PREVIEW_CONTRACT_VALUE = 420_000;

/**
 * Each tranche's amount on a contract, in the order of the shares. The real schedule at Won
 * places its remainder by `M11-13`'s rule; the sample needs none, because it divides exactly.
 */
export function previewTrancheAmounts(
  total: MinorUnits,
  shares: readonly BasisPoints[],
): MinorUnits[] {
  return shares.map((share) => applyRate(total, share));
}
