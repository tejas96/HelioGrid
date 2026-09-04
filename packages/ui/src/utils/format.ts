import {
  type FormatPack,
  formatCompact,
  formatCompactMoney,
  formatDate,
  formatMoney,
  formatMonthYear,
  formatNumber,
  formatPhone,
  formatTime,
  IN_FORMATS,
  moneySymbol,
  monthNames,
  type Numberish,
  type NumberOptions,
  parseNumber,
  weekdayNames,
} from '@heliogrid/domain';

/**
 * The design system's view of the format layer.
 *
 * **It implements nothing.** Every rule — the market's grouping, the compact ladder, the date
 * style, the tenant's timezone, Latin digits — lives once in `@heliogrid/domain`'s `format/`
 * slice (`F3-19`: one rendering implementation per capability, product-wide). This file only
 * BINDS a pack to those functions so a component can call `format.money(n)` without carrying
 * the pack through every prop.
 *
 * It used to hold the implementation itself, plus its own India pack. That was written before
 * the domain slice existed and was the second copy `F3-19` forbids; the pack values moved to
 * `domain/format/pack.ts` (`F1-21`) and the maths beside them.
 */

export type { FormatPack, Numberish, NumberOptions };
export { IN_FORMATS };

export interface MarketFormat {
  /** The bound pack, so a consumer reads `pack.taxIdLabel` or `pack.phone` without a fallback. */
  pack: FormatPack;
  number: (value: Numberish, options?: NumberOptions) => string;
  money: (value: Numberish, options?: { fractionDigits?: number }) => string;
  /**
   * **The resolved symbol** — the pack's if it writes one, else Intl's, else the ISO code.
   * `NumberField` renders a money field's adornment from this, which is how no component ends
   * up owning a currency; `useFormat()` is the only way to reach it.
   */
  currencySymbol: string;
  symbolPosition: 'before' | 'after';
  compact: (value: Numberish) => string;
  compactMoney: (value: Numberish) => string;
  /**
   * A phone as a reader sees it — E.164 in, the market's dial code and grouping out.
   * `+919845027746` → `+91 98450 27746`. Pass `nsn` for the national number alone.
   */
  phone: (value: string, options?: { nsn?: boolean }) => string;
  /** `17:00` → `17:00` or `5:00 PM` by the pack's clock. Storage stays 24-hour. */
  time: (hhmm: string) => string;
  /** A date in the pack's style and zone — `12 Mar 2026` under the India pack. */
  date: (value: string | Date) => string;
  /** A calendar heading — `March 2026`. */
  monthYear: (value: string | Date) => string;
  /** Resolved ISO week start, 1 = Monday … 7 = Sunday. `Calendar`'s first column reads this. */
  firstDayOfWeek: number;
  /** 12 month names in calendar order. */
  monthNames: (style?: 'long' | 'short' | 'narrow') => string[];
  /** 7 weekday names **starting at `firstDayOfWeek`** — a calendar grid's column order. */
  weekdayNames: (style?: 'narrow' | 'short' | 'long') => string[];
  /** Strips grouping and symbols so a typed amount parses back to a number. */
  parseNumber: (input: string | number) => number | null;
}

/** Binds a market pack to the domain implementations. A market overrides by supplying a pack. */
export function createFormat(pack: FormatPack = IN_FORMATS): MarketFormat {
  return {
    pack,
    number: (value, options) => formatNumber(pack, value, options),
    money: (value, options) => formatMoney(pack, value, { digits: options?.fractionDigits }),
    currencySymbol: moneySymbol(pack),
    symbolPosition: pack.symbolPosition,
    compact: (value) => formatCompact(pack, value),
    compactMoney: (value) => formatCompactMoney(pack, value),
    phone: (value, options) => formatPhone(pack, value, { nationalOnly: options?.nsn }),
    time: (hhmm) => formatTime(pack, hhmm),
    date: (value) => formatDate(pack, value),
    monthYear: (value) => formatMonthYear(pack, value),
    firstDayOfWeek: pack.firstDayOfWeek,
    monthNames: (style) => monthNames(pack, style),
    weekdayNames: (style) => weekdayNames(pack, style),
    parseNumber,
  };
}

/** The shipped default — India, the one authored pack at launch (`F1-06`). */
export const IN_FORMAT: MarketFormat = createFormat(IN_FORMATS);
