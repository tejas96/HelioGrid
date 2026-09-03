import { describe, expect, it } from 'vitest';
import { formatCompactMoney, formatMoney, moneySymbol } from '../../src/format/money';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';

/** NON-BREAKING space — `F3-08` forbids a value and its unit separating across a line. */
const NBSP = ' ';

/** A market that writes no symbol of its own and lets Intl answer for the currency. */
const NO_SYMBOL: FormatPack = { ...IN_FORMATS, currencySymbol: null };
/** A market whose symbol trails the amount. */
const TRAILING: FormatPack = { ...IN_FORMATS, symbolPosition: 'after' };
/** A WORD-like symbol. It needs a space; a sign-like one (₹, $) sits flush. */
const WORD_SYMBOL: FormatPack = { ...IN_FORMATS, currencySymbol: 'KSh' };
/** An unauthored pack, to prove the symbol lookup degrades instead of throwing. */
const BROKEN_LOCALE: FormatPack = { ...NO_SYMBOL, locale: 'not a locale' };

describe('moneySymbol — no component ever owns a currency', () => {
  it('prefers the symbol the market writes', () => {
    expect(moneySymbol(IN_FORMATS)).toBe('₹');
    expect(moneySymbol({ ...IN_FORMATS, currencySymbol: '  ₹  ' })).toBe('₹');
  });

  it('asks Intl when the pack writes none', () => {
    expect(moneySymbol(NO_SYMBOL)).toBe('₹');
  });

  it('finds the symbol wherever the locale puts it in the formatted parts', () => {
    /* `en-IN` renders `₹4,52,471`, so the currency part is FIRST and a lookup that only ever
       reads part one still passes. A locale that trails its symbol (`4.52.471,00 ₹`) is the
       case that catches it. */
    expect(moneySymbol({ ...NO_SYMBOL, locale: 'de-DE' })).toBe('₹');
  });

  it('falls back to the ISO code rather than throwing', () => {
    /* An engine without `formatToParts` (Hermes, unpolyfilled) and an invalid locale tag both
       land here. Rendering `INR` is worse than `₹` and far better than a blank screen. */
    expect(moneySymbol(BROKEN_LOCALE)).toBe('INR');
  });
});

describe('formatMoney — the market decides, in every language (F1-46, F3-20)', () => {
  it.each([
    [452471, '₹4,52,471'],
    ['452471', '₹4,52,471'],
    [0, '₹0'],
    [-452471, '₹-4,52,471'],
    /* Number(' ') is 0, so a whitespace cell renders as zero money rather than blank. */
    [' ', '₹0'],
  ])('%o → %s', (amount, expected) => {
    expect(formatMoney(IN_FORMATS, amount)).toBe(expected);
  });

  it.each([[null], [undefined], [''], ['abc'], [Number.NaN]])('%o renders nothing', (amount) => {
    expect(formatMoney(IN_FORMATS, amount)).toBe('');
  });

  it('renders the minor unit when a document asks for it', () => {
    /* An invoice reconciles to paise; a dashboard shows whole rupees. Same function, one
       argument apart — which is why `minorUnitDigits` is a pack value and not a magic 2. */
    expect(formatMoney(IN_FORMATS, 452471.5, { digits: IN_FORMATS.minorUnitDigits })).toBe(
      '₹4,52,471.50',
    );
    expect(formatMoney(IN_FORMATS, 452471.5)).toBe('₹4,52,472');
  });

  it('places the symbol where the market puts it', () => {
    expect(formatMoney(TRAILING, 452471)).toBe(`4,52,471${NBSP}₹`);
  });

  it('keeps a word-like symbol from wrapping off its amount', () => {
    expect(formatMoney(WORD_SYMBOL, 452471)).toBe(`KSh${NBSP}4,52,471`);
  });

  it('uses Intl currency rendering when the pack writes no symbol', () => {
    expect(formatMoney(NO_SYMBOL, 452471)).toBe('₹4,52,471');
  });
});

describe('formatCompactMoney (F1-46)', () => {
  it.each([
    [9_200_000, '₹92L'],
    [14_000_000, '₹1.4 Cr'],
    [99_999, '₹99,999'],
    [0, '₹0'],
    [-9_200_000, '₹-92L'],
  ])('%o → %s', (value, expected) => {
    expect(formatCompactMoney(IN_FORMATS, value)).toBe(expected);
  });

  it('renders nothing for a value that is not a number', () => {
    expect(formatCompactMoney(IN_FORMATS, null)).toBe('');
  });

  it('omits the symbol where the pack writes none, rather than inventing one', () => {
    expect(formatCompactMoney(NO_SYMBOL, 9_200_000)).toBe('92L');
  });

  it('trails the symbol where the market does', () => {
    expect(formatCompactMoney(TRAILING, 9_200_000)).toBe(`92L${NBSP}₹`);
  });
});
