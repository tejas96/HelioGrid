import { type MinorUnits, minorUnits } from './minor-units';

/** A plan's price for one of its cycles, and that cycle's length in days. */
export interface CyclePrice {
  readonly price: MinorUnits;
  readonly days: number;
}

/** What a mid-cycle plan change is charged for: the days left of the cycle in force. */
export interface PartCycle {
  readonly daysLeft: number;
  readonly from: CyclePrice;
  readonly to: CyclePrice;
}

/**
 * A cycle's price per day as the working prints it (`₹133.30 a day`), rounded once, half away from
 * zero. Only the working shows it: `partCycleCharge` never sums rounded day rates.
 */
export function dayRate({ price, days }: CyclePrice): MinorUnits {
  if (!Number.isSafeInteger(days) || days <= 0) {
    throw new RangeError(`a cycle is a whole number of days, not ${String(days)}`);
  }
  const numerator = BigInt(Math.abs(price));
  const denominator = BigInt(days);
  const rounded = (2n * numerator + denominator) / (2n * denominator);
  return minorUnits(Number(price < 0 ? -rounded : rounded));
}

/**
 * `M12-48` — the part of this cycle a plan change bills today: the days left priced at the new
 * plan's daily rate, less the same days at the old plan's. Rounded ONCE to the minor unit, half
 * away from zero, from one BigInt fraction, so the per-day rates the working shows never round on
 * their own. Never below zero: the product makes no mid-cycle refund (`M12-49`), so a change to a
 * cheaper day rate — monthly to yearly on the same plan — costs nothing today.
 */
export function partCycleCharge({ daysLeft, from, to }: PartCycle): MinorUnits {
  for (const days of [daysLeft, from.days, to.days]) {
    if (!Number.isSafeInteger(days) || days < 0) {
      throw new RangeError(`a cycle is a whole number of days, not ${String(days)}`);
    }
  }
  if (from.days === 0 || to.days === 0) throw new RangeError('a cycle has at least one day');
  const numerator =
    BigInt(daysLeft) *
    (BigInt(to.price) * BigInt(from.days) - BigInt(from.price) * BigInt(to.days));
  if (numerator <= 0n) return minorUnits(0);
  const denominator = BigInt(to.days) * BigInt(from.days);
  return minorUnits(Number((2n * numerator + denominator) / (2n * denominator)));
}
