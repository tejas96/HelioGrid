import { describe, expect, it } from 'vitest';
import {
  formatCompactMoney,
  formatMinorUnits,
  formatMinorUnitsPlainly,
  formatMoney,
  formatMoneyPlainly,
  moneySymbol,
} from '../../src/format/money';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';
import { minorUnits } from '../../src/money/minor-units';

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
    /* The sign leads the whole figure, as a reversal shows it. */
    [-452471, '-₹4,52,471'],
    [-1, '-₹1'],
    ['-45000.00', '-₹45,000'],
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
    [-9_200_000, '-₹92L'],
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

describe('formatMinorUnits — paise printed to the minor unit, in the market’s own money (F1-07)', () => {
  it.each([
    [4_527_101, '₹45,271.01'],
    [100, '₹1.00'],
    [1, '₹0.01'],
    [0, '₹0.00'],
    [-2_000_000, '-₹20,000.00'],
  ])('%d minor units renders %s', (amount, expected) => {
    expect(formatMinorUnits(IN_FORMATS, minorUnits(amount))).toBe(expected);
  });

  it("follows the pack's minor-unit digits, so a market with no minor unit prints none", () => {
    expect(formatMinorUnits({ ...IN_FORMATS, minorUnitDigits: 0 }, minorUnits(452))).toBe('₹452');
  });

  it('never rounds to the screen default: the last paisa is shown even where screens hide it', () => {
    expect(formatMoney(IN_FORMATS, 45271.01)).toBe('₹45,271');
    expect(formatMinorUnits(IN_FORMATS, minorUnits(4_527_101))).toBe('₹45,271.01');
  });
});

describe('formatMinorUnitsPlainly — a headline leaves a zero fraction unsaid and never rounds (T-M06-017)', () => {
  it.each([
    ['a whole amount', 19_057_500, [], '₹1,90,575'],
    ['an amount with paise prints them all', 1_905_750, [], '₹19,057.50'],
    ['one paisa', 1_905_701, [], '₹19,057.01'],
    ['zero', 0, [], '₹0'],
    [
      'a whole amount beside one with paise takes its form',
      11_434_500,
      [1_905_750],
      '₹1,14,345.00',
    ],
    ['a column of whole amounts stays whole', 11_434_500, [3_811_500], '₹1,14,345'],
    ['a negative amount keeps its leading sign', -4_500_000, [], '-₹45,000'],
  ] as const)('%s', (_, amount, beside, expected) => {
    expect(
      formatMinorUnitsPlainly(
        IN_FORMATS,
        minorUnits(amount),
        beside.map((each) => minorUnits(each)),
      ),
    ).toBe(expected);
  });
});

describe('formatMoneyPlainly — the same form for a figure held in major units', () => {
  it.each([
    ['a whole figure', 190_575, '₹1,90,575'],
    ['a figure with paise', 19_057.5, '₹19,057.50'],
    ['a wire string', '112575.00', '₹1,12,575'],
    ['nothing to render', Number.NaN, ''],
  ] as const)('%s', (_, value, expected) => {
    expect(formatMoneyPlainly(IN_FORMATS, value)).toBe(expected);
  });

  it.each([
    ['whole beside whole stays whole', 114_345, [38_115], '₹1,14,345'],
    ['whole beside paise takes the column’s form', 114_345, ['19057.50'], '₹1,14,345.00'],
    ['paise beside whole keeps its paise', '19057.50', [114_345], '₹19,057.50'],
  ] as const)('a column shares one form: %s', (_, value, beside, expected) => {
    expect(formatMoneyPlainly(IN_FORMATS, value, beside)).toBe(expected);
  });
});
