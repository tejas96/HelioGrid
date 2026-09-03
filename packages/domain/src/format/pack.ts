/**
 * `pack.formats` — the market's format values (`F1-21`). F1 owns these VALUES; F3 owns the
 * single rendering implementation that consumes them (`F3-19`), and it sits beside this file.
 *
 * The split is the point: a module that needs a market fact names this key and reads it here,
 * so "no market fact is ever a module-level constant" (`F1-01`) holds mechanically.
 *
 * **The shape is FLAT because the design system declares it flat.** `MarketProvider`'s pulled
 * contract (`packages/theme/src/_generated/contracts/data/MarketProvider.d.ts.txt`) fixes
 * `id`, `locale`, `currency`, `currencyFractionDigits`, `clock` and `taxIdLabel` as prop names,
 * and `check:ds-contract` fails on a dropped one. Grouping them into sub-objects here would
 * mean the design system and this package each declaring their own pack — the second copy this
 * slice exists to remove. Fields the PRD adds (the minor unit, the timezone, the phone spec)
 * sit beside them.
 *
 * A pack is DATA. Nothing here reads a clock, an environment or a request — the tenant's own
 * values (its timezone above all) are substituted by the caller that resolves the pack.
 */

/**
 * One rung of the compact ladder. `suffix` is a UNIT, so `F3-08` binds it: technical units are
 * never translated and never separated from their value. `92L` reads `92L` in Marathi.
 */
export interface CompactStep {
  /** Magnitude at which this rung takes over. Rungs are read largest-first. */
  readonly from: number;
  readonly divisor: number;
  readonly suffix: string;
}

export interface PhoneFormats {
  /** The market's calling code (`F1-49`). Storage and transport stay E.164; this is display. */
  readonly dialCode: string;
  /** Digit grouping of the national number — India reads `98450 27746`. */
  readonly nsnGroups: readonly number[];
  /** National-number length, the shape a caller validates against before it dials or sends. */
  readonly nsnLength: number;
}

export type MeasurementSystem = 'metric' | 'imperial';

export interface FormatPack {
  /** Market identifier. Market-neutral, never a label (`F1-09`). */
  readonly id: string;
  /**
   * The market's GROUPING and date locale — never the reader's (`F3-20`). `-u-nu-latn` is not
   * decoration: it pins Latin digits at the Intl call itself (`F3-21`, `F1-47`), so a pack
   * authored with a Devanagari-defaulting tag still renders `4,52,471`.
   */
  readonly locale: string;
  /** ISO 4217. One currency per tenant, server-assigned from its market (`F1-07`). */
  readonly currency: string;
  /** The symbol the market writes. `null` asks Intl for the locale's — "INR" is the last resort. */
  readonly currencySymbol: string | null;
  readonly symbolPosition: 'before' | 'after';
  /**
   * What an ordinary screen shows. India reads whole rupees on a dashboard and paise on an
   * invoice, so a document asks for `minorUnitDigits` explicitly rather than inheriting this.
   */
  readonly currencyFractionDigits: number;
  /**
   * The currency's minor unit (`F1-46`: paise, two decimals). This is the RECONCILIATION unit —
   * the one BOM ↔ proposal ↔ tranches ↔ payments must agree to. Never lower it to fit a screen.
   */
  readonly minorUnitDigits: number;
  /** Largest rung first. An empty ladder means the market does not compact. */
  readonly compactSteps: readonly CompactStep[];
  readonly clock: '24h' | '12h';
  /**
   * IANA zone. The pack supplies the market's DEFAULT (`F1-10`); a tenant's own zone replaces
   * it before any user-facing date renders, and `F3-22` forbids rendering in any other.
   */
  readonly timeZone: string;
  /** ISO-numbered: 1 = Monday … 7 = Sunday. Declared, never probed — India's week starts Sunday. */
  readonly firstDayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /**
   * What a customer document calls the tax number — `GSTIN` in IN. A statutory identifier's
   * name, so it belongs to the never-translated set alongside operator names (`F3-08`, `F1-51`).
   */
  readonly taxIdLabel: string;
  readonly phone: PhoneFormats;
  /** The market's default (`F1-50`). A per-user preference may override it — never for procurement. */
  readonly measurementSystem: MeasurementSystem;
}

/**
 * India — the one authored pack at launch (`F1-06`). Every value below cites the row that fixes
 * it; a reader checks this table against the PRD rather than trusting the code.
 */
export const IN_FORMATS: FormatPack = {
  id: 'IN',
  /** `en-IN` groups `4,52,471`; the `latn` pin holds `F3-21` whatever tag a pack is authored with. */
  locale: 'en-IN-u-nu-latn',
  currency: 'INR',
  currencySymbol: '₹',
  symbolPosition: 'before',
  currencyFractionDigits: 0,
  /** `F1-46` — paise. */
  minorUnitDigits: 2,
  /** `F1-46` — `₹92L`, `₹1.4 Cr`. The source names no thousands rung, so the ladder starts at lakh. */
  compactSteps: [
    { from: 1e7, divisor: 1e7, suffix: ' Cr' },
    { from: 1e5, divisor: 1e5, suffix: 'L' },
  ],
  clock: '24h',
  /** `F1-48` — a DEFAULT; the tenant's own zone replaces it (`F1-10`). */
  timeZone: 'Asia/Kolkata',
  /** CLDR territory IN. Declared rather than probed, so the shipped answer is readable. */
  firstDayOfWeek: 7,
  taxIdLabel: 'GSTIN',
  /** `F1-49` — `+91`, E.164 identity, 10-digit national number read in two groups of five. */
  phone: { dialCode: '+91', nsnGroups: [5, 5], nsnLength: 10 },
  /** `F1-50` — metric. */
  measurementSystem: 'metric',
};
