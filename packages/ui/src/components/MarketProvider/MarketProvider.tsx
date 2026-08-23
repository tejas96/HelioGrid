import { useMemo } from 'react';
import { createFormat, GENERIC_PACK, IN_FORMAT, IN_PACK } from '../../utils/format';
import type { MarketProviderProps } from './MarketProvider.types';
import { FormatContext, useFormat } from './market-context';

/**
 * The one place a market's number, currency, clock, compact AND DATE rules are supplied
 * (F1 / F3-20 / F3-22). Wrap the app once; every component that renders a figure or a date reads
 * from it. A market overrides by supplying a pack here, never by editing a component.
 *
 * It renders no markup of its own on either platform, so the two halves are the same provider.
 */
export function MarketProvider({ pack, format, children }: MarketProviderProps) {
  const value = useMemo(() => format || (pack ? createFormat(pack) : IN_FORMAT), [pack, format]);
  return <FormatContext.Provider value={value}>{children}</FormatContext.Provider>;
}

/* The namespace form the design system declares — `MarketProvider.useFormat()` reaches the same
   hook as the named export, so a consumer holding only the component still finds the format. */
MarketProvider.useFormat = useFormat;
MarketProvider.createFormat = createFormat;
MarketProvider.IN_PACK = IN_PACK;
MarketProvider.GENERIC_PACK = GENERIC_PACK;

export { createFormat, GENERIC_PACK, IN_PACK, useFormat };
