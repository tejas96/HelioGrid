import { createContext, useContext } from 'react';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';

/**
 * THE CONTEXT IS AUTHORED ONCE, here, and both platform halves render this same provider — two
 * contexts would mean a native `useFormat()` reading a different default from the web one.
 *
 * The default is the INDIA PACK rather than an empty one: the product is India-first, and a
 * component used outside a provider must still render correct Indian figures rather than
 * `4,52,471.00 USD`. Supplying a pack is how a market overrides that — never editing a component.
 */
export const FormatContext = createContext<MarketFormat>(IN_FORMAT);

/** The hook every number-bearing component uses. */
export function useFormat(): MarketFormat {
  return useContext(FormatContext);
}
