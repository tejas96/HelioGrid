import { useMemo } from 'react';
import { createFormat, IN_FORMATS } from '../../utils/format';
import type { MarketProviderProps } from './MarketProvider.types';
import { FormatContext, useFormat } from './market-context';

/**
 * The one place a market's number, currency, clock, compact AND DATE rules are supplied
 * (F1 / F3-20 / F3-22). Wrap the app once; every component that renders a figure or a date reads
 * from it. A market overrides by supplying a pack here, never by editing a component.
 *
 * It renders no markup of its own on either platform, so the two halves are the same provider.
 */
export function MarketProvider({ pack, language, format, children }: MarketProviderProps) {
  const value = useMemo(() => format ?? createFormat(pack, language), [pack, language, format]);
  return <FormatContext.Provider value={value}>{children}</FormatContext.Provider>;
}

/* The namespace form the design system declares — `MarketProvider.useFormat()` reaches the same
   hook as the named export, so a consumer holding only the component still finds the format. */
MarketProvider.useFormat = useFormat;
MarketProvider.createFormat = createFormat;
MarketProvider.IN_FORMATS = IN_FORMATS;

export { createFormat, IN_FORMATS, useFormat };
