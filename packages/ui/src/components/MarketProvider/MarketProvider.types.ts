import type { ReactNode } from 'react';
import type { MarketFormat, MarketPack } from '../../utils/format';

/**
 * The pack and the format are DECLARED in `utils/format` — the module both platform halves and
 * every figure-bearing component consume — and re-exported here so this folder is one import for
 * a consumer reaching for the contract.
 */
export type { MarketFormat, MarketPack };

export interface MarketProviderProps {
  /** A partial pack; the India pack fills any gaps. */
  pack?: MarketPack;
  /** A pre-built format, if the app already has one. Wins over `pack`. */
  format?: MarketFormat;
  children?: ReactNode;
}
