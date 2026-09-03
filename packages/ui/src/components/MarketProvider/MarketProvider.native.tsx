import { useMemo } from 'react';
import { createFormat, IN_FORMAT, IN_FORMATS } from '../../utils/format';
import type { MarketProviderProps } from './MarketProvider.types';
import { FormatContext, useFormat } from './market-context';

/**
 * The native half of the provider. It renders no platform surface at all — the context, the hook
 * and the India default are authored once in `market-context.ts`, so this half exists only to keep
 * the folder shape and to let Metro resolve the same component the web bundler resolves.
 */
export function MarketProvider({ pack, format, children }: MarketProviderProps) {
  const value = useMemo(() => format || (pack ? createFormat(pack) : IN_FORMAT), [pack, format]);
  return <FormatContext.Provider value={value}>{children}</FormatContext.Provider>;
}

/* The namespace form the design system declares — `MarketProvider.useFormat()` reaches the same
   hook as the named export, so a consumer holding only the component still finds the format. */
MarketProvider.useFormat = useFormat;
MarketProvider.createFormat = createFormat;
MarketProvider.IN_FORMATS = IN_FORMATS;

export { createFormat, IN_FORMATS, useFormat };
