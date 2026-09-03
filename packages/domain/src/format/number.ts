import type { FormatPack } from './pack';

/**
 * The ONE non-money number implementation (`F3-19`) — a kWh figure, a panel count, a percentage.
 *
 * It renders through the MARKET's grouping, not the reader's language (`F3-20`), in Latin digits
 * always (`F3-21`). Money shares this grouping and this compact ladder and adds a currency on
 * top; it never re-derives either.
 */

/** Everything a caller can hand a formatter at runtime, including from untyped code. */
export type Numberish = number | string | null | undefined;

/** A blank, a null or a non-number renders as nothing — never as `NaN` on a customer's screen. */
export function isRenderableNumber(value: Numberish): value is number | string {
  return value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value));
}

export interface NumberOptions {
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
}

/** The default ceiling on decimals. A caller that asks for more, or for a floor, overrides it. */
const DEFAULT_MAX_FRACTION_DIGITS = 1;

/**
 * `452471` → `4,52,471` under the IN pack, in every language.
 *
 * The maximum is RAISED to meet a caller's minimum rather than spread over it. Spreading the
 * default let `{ minimumFractionDigits: 2 }` produce min 2 / max 1, and `Intl` throws
 * `RangeError` on that — a formatter that throws mid-render blanks the screen it was called on.
 */
export function formatNumber(pack: FormatPack, value: Numberish, options?: NumberOptions): string {
  if (!isRenderableNumber(value)) return '';
  const minimumFractionDigits = options?.minimumFractionDigits;
  const maximumFractionDigits =
    options?.maximumFractionDigits ??
    Math.max(DEFAULT_MAX_FRACTION_DIGITS, minimumFractionDigits ?? 0);
  return new Intl.NumberFormat(pack.locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(value));
}

/** Trims a compact figure to at most one decimal without printing a bare `.0`. */
function trimCompact(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/**
 * `9200000` → `92L`; `14000000` → `1.4 Cr` (`F1-46`).
 *
 * The suffix is the PACK's, so it is identical in every language — `F3-08` puts a unit in the
 * never-translated set and forbids separating it from its value. Below the smallest rung there
 * is nothing to compact, so the number keeps the market's grouping rather than falling out raw.
 */
export function formatCompact(pack: FormatPack, value: Numberish): string {
  if (!isRenderableNumber(value)) return '';
  const numeric = Number(value);
  const magnitude = Math.abs(numeric);
  for (const step of pack.compactSteps) {
    if (magnitude >= step.from) return `${trimCompact(numeric / step.divisor)}${step.suffix}`;
  }
  return formatNumber(pack, numeric);
}

/** Grouping separators and symbols come off so a typed amount parses back to a number. */
export function parseNumber(input: string | number): number | null {
  if (typeof input === 'number') return input;
  const cleaned = input.replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}
