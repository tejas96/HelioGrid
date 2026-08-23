import type { MarketPack, ResolvedPack } from './market-pack';
import { GENERIC_PACK, IN_DEFAULTS, IN_PACK } from './market-pack';

/**
 * Market formats — F1 / F3-20 / F3-22.
 *
 * Currency, grouping, clock, compact notation AND DATES are MARKET-PACK DATA, not product facts.
 * Components used to bake `en-IN` and `₹` in six places; they now take a format object and this
 * file is the one place a market's answer is supplied.
 *
 * DATES ARE THE FORMAT WHERE GETTING IT WRONG IS WORST — 03/04 is two different days in two
 * markets and looks correct in both — and three separate things in a date are market data:
 * the month and day NAMES are language, the FIELD ORDER is a market fact, and the FIRST DAY OF
 * THE WEEK is a market fact too (India's week starts SUNDAY).
 *
 * The application owns the real market-pack system. This module is the shape the components
 * agree to consume, plus the India pack as the shipped default — India-first, not India-only.
 */

/** The pack, the two shipped packs and the resolved shape, re-exported so `utils/format` stays
 *  the one import a consumer needs. */
export type { MarketPack, ResolvedPack };
export { GENERIC_PACK, IN_PACK };

export interface MarketFormat {
  /** The pack with every gap filled, so a consumer can read `pack.taxIdLabel` without a fallback. */
  pack: ResolvedPack;
  number: (n: number | string, opts?: Intl.NumberFormatOptions) => string;
  money: (n: number | string, opts?: { fractionDigits?: number }) => string;
  /**
   * **The resolved symbol** — the pack's explicit `currencySymbol` if it has one, else Intl's for
   * the locale, else the ISO code. `NumberField` renders a money field's symbol from this, which is
   * how no component ends up owning a currency; `useFormat()` is the only way to reach it.
   */
  currencySymbol: string;
  /** Which side that symbol sits on. `NumberField` places it leading or trailing from here. */
  symbolPosition: 'before' | 'after';
  compact: (n: number | string) => string;
  compactMoney: (n: number | string) => string;
  /** "17:00" → "17:00" or "5:00 PM" by the pack's clock. Storage stays 24-hour. */
  time: (hhmm: string) => string;
  /** A date in the pack's language and field order — "12 Mar 2026" under the India pack. */
  date: (value: string | Date) => string;
  /** A calendar heading — "March 2026", in the pack's language and order. */
  monthYear: (value: string | Date) => string;
  /** Resolved ISO week start, 1 = Monday … 7 = Sunday. `Calendar`'s first column reads this. */
  firstDayOfWeek: number;
  /** 12 month names in calendar order, in the pack's language. */
  monthNames: (style?: 'long' | 'short' | 'narrow') => string[];
  /** 7 weekday names **starting at `firstDayOfWeek`** — a calendar grid's column order. */
  weekdayNames: (style?: 'narrow' | 'short' | 'long') => string[];
  /** Strips grouping and symbols so a typed amount parses back to a number. */
  parseNumber: (input: string | number) => number | null;
}

/** What every formatter accepts at runtime — a caller outside TypeScript can still pass null. */
type Numberish = number | string | null | undefined;

/* A sign-like symbol (₹, $, €) sits flush against the digits; a word-like one (KSh, kr, R$) needs
   a space — and that space must be NON-BREAKING, or a narrow card wraps "KSh" onto its own line
   and the amount reads as two things. A pack may write its symbol with or without the space. */
const WORD_LIKE = /[a-z]/i;
/** NON-BREAKING on purpose: a narrow card must never wrap "KSh" off its own amount. */
const NBSP = '\u00A0';
function joinSymbol(symbol: string, body: string, position: 'before' | 'after'): string {
  const sym = String(symbol).trim();
  const gap = WORD_LIKE.test(sym) ? NBSP : '';
  return position === 'after' ? body + NBSP + sym : sym + gap + body;
}

/** `Intl.Locale`'s week info is not in the standard lib — engines expose it two ways or not at all. */
interface WeekInfo {
  firstDay?: number;
}
interface LocaleWeekInfo {
  getWeekInfo?: () => WeekInfo;
  weekInfo?: WeekInfo;
}
/** Narrowing assertion, not a widening one: the engine either has these members or it does not. */
type LocaleWithWeekInfo = Intl.Locale & LocaleWeekInfo;

/* A pack may declare its week start; if it hasn't, the locale knows (CLDR ships a firstDay per
   territory) and Intl exposes it. Monday is the last resort — the ISO answer, and honest about
   being a fallback rather than a claim about the market.

   IT READS THE RAW PACK, NOT THE MERGED ONE, and that distinction is the whole point: createFormat
   fills a pack's gaps from IN, which is right for currency and WRONG here — a GB pack that says
   nothing about days must not inherit India's Sunday, it must get en-GB's Monday. */
function resolveFirstDay(rawPack: MarketPack, locale: string | undefined): number {
  if (rawPack.firstDayOfWeek) return rawPack.firstDayOfWeek;
  try {
    const loc = new Intl.Locale(locale || 'en') as LocaleWithWeekInfo;
    const info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo;
    if (info?.firstDay) return info.firstDay;
  } catch {
    /* no Intl.Locale on this engine */
  }
  if (locale === IN_DEFAULTS.locale && IN_DEFAULTS.firstDayOfWeek !== undefined) {
    return IN_DEFAULTS.firstDayOfWeek;
  }
  return 1;
}

/* Reference dates for NAMES ONLY, read in UTC so a timezone can't shift them by a day.
   2021-08-01 was a Sunday, which makes the weekday walk arithmetic instead of a lookup table. */
const NAME_YEAR = 2021;
const SUNDAY = Date.UTC(2021, 7, 1);
const DAY_MS = 86400000;

/** Builds the format object every component consumes. Pass a partial pack; IN fills the gaps. */
export function createFormat(pack: MarketPack = {}): MarketFormat {
  const p: ResolvedPack = { ...IN_DEFAULTS, ...pack };
  const nf = (opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(p.locale, opts);

  const number = (n: Numberish, opts?: Intl.NumberFormatOptions): string =>
    n === null || n === undefined || n === '' || Number.isNaN(Number(n))
      ? ''
      : nf({ maximumFractionDigits: 1, ...opts }).format(Number(n));

  const money = (n: Numberish, opts: { fractionDigits?: number } = {}): string => {
    if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '';
    const digits = opts.fractionDigits ?? p.currencyFractionDigits;
    /* An explicit symbol wins, because a pack may want "₹" where Intl would print "INR". */
    if (p.currencySymbol) {
      const body = nf({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
        Number(n),
      );
      return joinSymbol(p.currencySymbol, body, p.symbolPosition);
    }
    return nf({
      style: 'currency',
      currency: p.currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(n));
  };

  /* THE SYMBOL ON ITS OWN, because a field that is EDITED as a plain number still has to SAY which
     currency it is in (NumberField's money mode renders it as a leading adornment). A pack that
     spells its symbol wins; otherwise Intl is asked for the locale's, and the ISO code is the last
     resort. Derived here rather than in the component, so no component owns a currency again. */
  const currencySymbol = ((): string => {
    if (p.currencySymbol) return String(p.currencySymbol).trim();
    try {
      const part = nf({ style: 'currency', currency: p.currency })
        .formatToParts(0)
        .find((x) => x.type === 'currency');
      if (part) return part.value;
    } catch {
      /* no formatToParts on this engine */
    }
    return p.currency;
  })();

  const compact = (n: Numberish): string =>
    n === null || n === undefined || Number.isNaN(Number(n)) ? '' : p.compact(Number(n), p.locale);

  const compactMoney = (n: Numberish): string =>
    p.currencySymbol ? joinSymbol(p.currencySymbol, compact(n), p.symbolPosition) : compact(n);

  /** "17:00" → "17:00" or "5:00 PM", by the pack's clock. Storage stays 24-hour either way. */
  const time = (hhmm: string): string => {
    if (typeof hhmm !== 'string') return '';
    const m = hhmm.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    const hours = m?.[1];
    const min = m?.[2];
    if (hours === undefined || min === undefined) return hhmm;
    const h = Number(hours);
    if (p.clock === '24h') return `${String(h).padStart(2, '0')}:${min}`;
    const suffix = h < 12 ? 'AM' : 'PM';
    return `${h % 12 || 12}:${min} ${suffix}`;
  };

  /** Accepts an ISO date or a Date. The pack locale decides both the names and the field order. */
  const date = (value: string | Date): string => {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
    return new Intl.DateTimeFormat(p.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  /** The calendar's own heading — "March 2026", "मार्च 2026". Order is the locale's, not ours. */
  const monthYear = (value: string | Date): string => {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(p.locale, { month: 'long', year: 'numeric' }).format(d);
  };

  const firstDayOfWeek = resolveFirstDay(pack, p.locale);

  /** 12 month names in calendar order. `long` for a heading, `short` for a compact strip. */
  const monthNames = (style: 'long' | 'short' | 'narrow' = 'long'): string[] => {
    const f = new Intl.DateTimeFormat(p.locale, { month: style, timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, m) => f.format(Date.UTC(NAME_YEAR, m, 15)));
  };

  /** 7 weekday names STARTING AT THIS MARKET'S FIRST DAY — the grid's column order, not Monday's. */
  const weekdayNames = (style: 'narrow' | 'short' | 'long' = 'narrow'): string[] => {
    const f = new Intl.DateTimeFormat(p.locale, { weekday: style, timeZone: 'UTC' });
    const start = firstDayOfWeek % 7; /* 7 (Sunday) → 0, 1 (Monday) → 1 */
    return Array.from({ length: 7 }, (_, i) => f.format(SUNDAY + (start + i) * DAY_MS));
  };

  /** Strips grouping, symbols and spaces so a typed amount can be parsed back to a number. */
  const parseNumber = (input: string | number): number | null => {
    if (typeof input === 'number') return input;
    if (typeof input !== 'string') return null;
    const cleaned = input.replace(/[^\d.,-]/g, '').replace(/,/g, '');
    if (cleaned === '' || cleaned === '-') return null;
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  };

  return {
    pack: p,
    number,
    money,
    currencySymbol,
    symbolPosition: p.symbolPosition,
    compact,
    compactMoney,
    time,
    date,
    monthYear,
    firstDayOfWeek,
    monthNames,
    weekdayNames,
    parseNumber,
  };
}

/** The shipped default — India, because the product is India-first. */
export const IN_FORMAT: MarketFormat = createFormat(IN_PACK);
