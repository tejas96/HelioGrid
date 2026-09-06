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
