import { METERS, type Meter } from '../commerce/meters';
import { applyRate, type BasisPoints, basisPoints } from '../money/basis-points';
import { type MinorUnits, sumMinorUnits } from '../money/minor-units';
import type { MeterOverage, PriceBookPack, WorstCaseCogs } from './pack';

/**
 * `BM-17`'s metered-COGS law, as the one thing a book can be judged by. A rate below this floor is
 * not a thin margin: it loses money on every unit past the bundle, which is the single failure a
 * metered product must never be able to author.
 *
 * `BM-26` is why the floor is measured against the WORST case rather than an expected one — no
 * COGS figure in this suite is verified, so the margin absorbs the estimate's error.
 */

/** `BM-17` — an overage rate sits at least 40% above the worst-case cost of the unit it bills. */
export const COGS_MARKUP_FLOOR: BasisPoints = basisPoints(4_000);

/**
 * Whether one published rate clears the floor.
 *
 * The floor is a MONEY amount: it rounds once through `applyRate` and is compared in the
 * currency's minor unit, which is the finest amount a book can author. Holding it at sub-minor
 * precision would reject rates no one is able to write.
 */
export function clearsCogsFloor(rate: MinorUnits, worstCase: WorstCaseCogs): boolean {
  const floor = sumMinorUnits([worstCase.amount, applyRate(worstCase.amount, COGS_MARKUP_FLOOR)]);
  return rate >= floor;
}

/**
 * `BM-17` — every meter in this book whose published rate does NOT clear the floor. A market's
 * book is valid when this is empty, and a name in it is an invalid book row whatever else the
 * book says about that meter.
 *
 * A per-channel meter appears ONCE however many of its channels fail (`BM-21`): the meter is what
 * a book authors and what an author must go and fix.
 *
 * Storage can never appear. It is a ceiling with no rate (`BM-20`), and a meter with nothing to
 * overrun into has nothing to hold above a floor.
 */
export function metersBelowCogsFloor(book: PriceBookPack): readonly Meter[] {
  return METERS.filter((meter) => !overageClearsFloor(book.overage[meter]));
}

/** Every rate the overage carries must clear; a ceiling carries none, so it clears vacuously. */
function overageClearsFloor(overage: MeterOverage): boolean {
  switch (overage.kind) {
    case 'ceiling':
      return true;
    case 'per_unit':
      return clearsCogsFloor(overage.rate, overage.worstCaseCogs);
    case 'per_channel':
      return overage.channels.every((channel) =>
        clearsCogsFloor(channel.rate, channel.worstCaseCogs),
      );
  }
}
