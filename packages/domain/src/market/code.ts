/**
 * The market's identifier, `IN`, as a BRAND so that no app can spell one: a market-conditional
 * code path cannot compile (`F1-04`), and the value is a code, never a label (`F1-09`). A
 * market is added here once; everything else imports it.
 *
 * A key's file reaches this leaf by its path, `../market/code`, never through `../market`:
 * the market index re-exports `market/pack.ts`, which imports every key's file, so the index
 * is a cycle from inside a key. This file imports nothing, so it can be the leaf.
 */
declare const MARKET_CODE: unique symbol;

/** ISO 3166-1 alpha-2, unspeakable outside this package (`CLAUDE.md` §8). */
export type MarketCode = string & { readonly [MARKET_CODE]: 'market' };

/** India, the one authored market at launch (`F1-06`). */
export const IN_MARKET = 'IN' as MarketCode;

/** Every authored market. A stored row may name no other code (`F1-06`). */
const AUTHORED_MARKETS: readonly MarketCode[] = [IN_MARKET];

/**
 * Re-mints the brand from a code read off a stored row, or throws. The constructor is the only
 * door in, and it is kept off the package index on purpose: a consumer obtains a market FROM a
 * pack and never spells one.
 */
export function marketCode(code: string): MarketCode {
  const market = AUTHORED_MARKETS.find((authored) => authored === code);
  if (market === undefined) throw new RangeError(`no authored market is coded ${code}`);
  return market;
}
