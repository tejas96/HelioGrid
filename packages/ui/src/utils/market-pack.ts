/**
 * The market packs — F1 / F3-20 / F3-22. A pack is DATA a market supplies: currency, grouping,
 * clock, compact notation and the first day of the week. `createFormat` (format.ts) turns one into
 * the object every figure-bearing component consumes; this file is only what a market replaces.
 *
 * India ships as the default, because the product is India-first — a component used outside a
 * provider still renders correct Indian figures rather than `4,52,471.00 USD`.
 */

/** A market pack — the data a market supplies. Every field is replaceable. */
export interface MarketPack {
  id?: string;
  /** BCP-47 tag driving grouping: "en-IN" groups 4,52,471; "en-US" groups 452,471. */
  locale?: string;
  currency?: string;
  /** Explicit symbol wins over Intl's currency display — "₹" rather than "INR". */
  currencySymbol?: string | null;
  symbolPosition?: 'before' | 'after';
  currencyFractionDigits?: number;
  clock?: '24h' | '12h';
  /** What a customer document calls the tax number — "GSTIN", "VAT number". */
  taxIdLabel?: string;
  /**
   * The phone spec (`F1-49`). `dialCode` is the market's calling code and `nsnGroups` the digit
   * grouping of its national number — India is `+91` and `[5, 5]`, so `98450 27746`. Storage and
   * transport are always E.164 (`contracts/common.ts`); this is display only.
   */
  phone?: { dialCode: string; nsnGroups: number[] };
  /** Compact notation is pack data, not styling (M06-07 / F1-46): "1.2 lakh" is an IN fact. */
  compact?: (n: number, locale?: string) => string;
  /**
   * ISO-numbered first day of the week: 1 = Monday … 7 = Sunday. A market fact, not a calendar
   * preference — the India pack declares **7 (Sunday)**. Omit it and the locale's CLDR answer is
   * used, with Monday as the last-resort fallback.
   */
  firstDayOfWeek?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/** The pack with every gap filled — what `createFormat` works from. Never part of the API. */
export interface ResolvedPack extends MarketPack {
  locale: string | undefined;
  currency: string;
  currencySymbol: string | null;
  symbolPosition: 'before' | 'after';
  currencyFractionDigits: number;
  clock: '24h' | '12h';
  taxIdLabel: string;
  phone: { dialCode: string; nsnGroups: number[] };
  compact: (n: number, locale?: string) => string;
}

function trim(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export const IN_DEFAULTS: ResolvedPack = {
  id: 'IN',
  locale: 'en-IN',
  currency: 'INR',
  currencySymbol: '₹',
  /** "before" → ₹4,52,471 · "after" → 4 452,47 kr */
  symbolPosition: 'before',
  /** Whole rupees on screen — paise appear on invoices, not dashboards. */
  currencyFractionDigits: 0,
  clock: '24h',
  /** What the tax number on a customer document is called here. */
  taxIdLabel: 'GSTIN',
  /** `+91`, and the 5+5 grouping every Indian phone is read in. */
  phone: { dialCode: '+91', nsnGroups: [5, 5] },
  /**
   * ISO-numbered: 1 = Monday … 7 = Sunday. India's week starts SUNDAY (CLDR territory IN), which
   * is exactly the fact `Calendar` used to get wrong. Declared rather than derived, because the
   * shipped market's answer should be readable in the pack.
   */
  firstDayOfWeek: 7,
  /** Indian compact: thousands, then lakh (10^5), then crore (10^7). */
  compact(n: number, locale?: string): string {
    const v = Number(n);
    const a = Math.abs(v);
    if (a >= 1e7) return `${trim(v / 1e7)} cr`;
    if (a >= 1e5) return `${trim(v / 1e5)} lakh`;
    if (a >= 1e3) return `${trim(v / 1e3)}k`;
    /* Below the smallest compact step there is nothing to compact — but it is still a number in
       this market, so it keeps the market's grouping rather than falling out as a raw string. */
    return new Intl.NumberFormat(locale).format(v);
  },
};

/** The India pack. Every field here is data a market pack replaces. */
export const IN_PACK: MarketPack = IN_DEFAULTS;

/** A neutral pack for any market that hasn't supplied one — Intl does the work. */
export const GENERIC_PACK: MarketPack = {
  id: 'generic',
  locale: undefined,
  currency: 'USD',
  currencySymbol: null,
  symbolPosition: 'before',
  currencyFractionDigits: 2,
  clock: '12h',
  taxIdLabel: 'Tax ID',
  /** Unset on purpose: a pack that hasn't said gets the locale's CLDR answer, Monday as the floor. */
  firstDayOfWeek: undefined,
  compact(n: number, locale?: string): string {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(n));
  },
};
