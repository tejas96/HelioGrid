import { formatCompact, isRenderableNumber, type Numberish } from './number';
import type { FormatPack } from './pack';

/**
 * The ONE money implementation (`F3-19`). Every surface, document, export and spoken line
 * renders an amount through this — there is no second one, and a module growing its own is the
 * defect this file exists to make unnecessary.
 *
 * **The law it holds:** an amount renders through the tenant MARKET's symbol, grouping, compact
 * notation and minor unit — identically in every language (`F3-20`). The reader's language never
 * reaches this file. Only the words AROUND the amount change when they switch.
 *
 * Grouping and the compact ladder are `number.ts`'s, deliberately: a kWh figure and a rupee
 * figure group the same way in a market, and re-deriving that here is how they diverge.
 */

/** A sign-like symbol (₹, $) sits flush; a word-like one (KSh, kr) needs a space that never wraps. */
const WORD_LIKE = /[a-z]/i;
/** NON-BREAKING on purpose: a narrow card must never wrap "KSh" off its own amount (`F3-08`). */
const NBSP = ' ';

function attachSymbol(symbol: string, body: string, position: 'before' | 'after'): string {
  const trimmed = symbol.trim();
  const gap = WORD_LIKE.test(trimmed) ? NBSP : '';
  return position === 'after' ? `${body}${NBSP}${trimmed}` : `${trimmed}${gap}${body}`;
}

/**
 * The symbol on its own — a field EDITED as a plain number still has to say which currency it
 * is in. Derived here so no component ever owns a currency again. Falls back to Intl's symbol
 * for the market's grouping locale, then to the ISO code.
 */
export function moneySymbol(pack: FormatPack): string {
  if (pack.currencySymbol !== null) return pack.currencySymbol.trim();
  try {
    const parts = new Intl.NumberFormat(pack.locale, {
      style: 'currency',
      currency: pack.currency,
    }).formatToParts(0);
    for (const part of parts) if (part.type === 'currency') return part.value;
  } catch {
    /* Hermes ships without `formatToParts` unless the polyfill loaded, and an invalid locale
       tag throws RangeError at construction. Neither is a reason to render nothing. */
  }
  return pack.currency;
}

export interface MoneyOptions {
  /**
   * Decimal places. Omit for the market's screen default; pass `pack.minorUnitDigits` on
   * anything that must reconcile — an invoice, a tranche, a payment (`F1-07`).
   */
  readonly digits?: number;
}

/** `452471` → `₹4,52,471` under the IN pack, in every language (`F1-46`, `F3-20`). */
export function formatMoney(pack: FormatPack, amount: Numberish, options?: MoneyOptions): string {
  if (!isRenderableNumber(amount)) return '';
  const digits = options?.digits ?? pack.currencyFractionDigits;
  const fractionDigits = { minimumFractionDigits: digits, maximumFractionDigits: digits };
  if (pack.currencySymbol !== null) {
    const body = new Intl.NumberFormat(pack.locale, fractionDigits).format(Number(amount));
    return attachSymbol(pack.currencySymbol, body, pack.symbolPosition);
  }
  return new Intl.NumberFormat(pack.locale, {
    style: 'currency',
    currency: pack.currency,
    ...fractionDigits,
  }).format(Number(amount));
}

/** The compact figure with the currency on it — `₹92L`, `₹1.4 Cr` (`F1-46`). */
export function formatCompactMoney(pack: FormatPack, value: Numberish): string {
  if (!isRenderableNumber(value)) return '';
  const body = formatCompact(pack, value);
  if (pack.currencySymbol === null) return body;
  return attachSymbol(pack.currencySymbol, body, pack.symbolPosition);
}
