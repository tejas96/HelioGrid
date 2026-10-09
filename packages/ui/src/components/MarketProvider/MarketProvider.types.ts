import type { UiLanguage } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FormatPack, MarketFormat } from '../../utils/format';

/**
 * The pack and the format are DECLARED in `utils/format` — the module both platform halves and
 * every figure-bearing component consume — and re-exported here so this folder is one import for
 * a consumer reaching for the contract.
 */
export type { FormatPack, MarketFormat };

export interface MarketProviderProps {
  /** The market's pack. Omit for India, the one authored pack at launch (`F1-06`). */
  pack?: FormatPack;
  /**
   * The reader's interface language — the one the mount follows. It names a date's month and
   * weekday; nothing else a format prints moves with it (`F3-20`, `F3-22`). Required, so an app
   * root cannot leave every date in English.
   */
  language: UiLanguage;
  /** A pre-built format, if the app already has one. Wins over `pack` and `language`. */
  format?: MarketFormat;
  children?: ReactNode;
}
