import { IN_MARKET, type MarketCode } from '../market/code';
import type { BuiltInYieldTable } from './built-in-yield';
import { IN_BUILT_IN_YIELD } from './built-in-yield-in';

/**
 * The recorded table of a market (`F8-10`), or `null` for one that holds none — a proposal there
 * has no built-in estimate, and its step says so rather than borrowing another market's sun.
 */
export function builtInYieldTableOf(market: MarketCode): BuiltInYieldTable | null {
  return market === IN_MARKET ? IN_BUILT_IN_YIELD : null;
}
