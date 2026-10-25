import { PRICE_BOOK_RATE_BASES, type PriceBookRateBasis } from '@heliogrid/domain';
import type { IrisHue } from '../Avatar/Avatar.types';

/** How a rate is charged, as the 1536 badge tints it — a kind, never a state (owner pick "Rates P1"). */
/** The new-version editor's panel: room for a name, a basis and an amount on one row (d-version-new). */
export const CATALOG_VERSION_PANEL_WIDTH = 640;

export const RATE_BASIS_TONE: Readonly<Record<PriceBookRateBasis, IrisHue>> = {
  per_job: 'violet',
  per_kw: 'blue',
  per_visit: 'magenta',
  per_metre: 'blue',
};

export interface RateGroup<Rate> {
  readonly basis: PriceBookRateBasis;
  readonly rates: readonly Rate[];
}

/** The rates under how each is charged, in the market's order of bases, with no empty group. */
export function ratesByBasis<Rate extends { readonly basis: PriceBookRateBasis }>(
  rates: readonly Rate[],
): RateGroup<Rate>[] {
  return PRICE_BOOK_RATE_BASES.flatMap((basis) => {
    const held = rates.filter((rate) => rate.basis === basis);
    return held.length === 0 ? [] : [{ basis, rates: held }];
  });
}

/**
 * The rates *Search rates* and the charge chips leave: a name holding the query, in any case, and a
 * basis among the chosen ones — every basis while none is chosen.
 */
export function matchingRates<
  Rate extends { readonly name: string; readonly basis: PriceBookRateBasis },
>(rates: readonly Rate[], query: string, bases: readonly PriceBookRateBasis[]): Rate[] {
  const needle = query.trim().toLocaleLowerCase();
  return rates.filter(
    (rate) =>
      (bases.length === 0 || bases.includes(rate.basis)) &&
      (needle === '' || rate.name.toLocaleLowerCase().includes(needle)),
  );
}

/** A typed decimal as a field's figure; `''` is unset, never `0`. */
export const figureOf = (typed: string): number | undefined =>
  typed === '' ? undefined : Number(typed);
