import { describe, expect, it } from 'vitest';
import { readImportPrice } from '../../src/catalog/import-cells';
import { IN_FORMATS } from '../../src/format/pack';

/** The rupee as India's pack writes it: `₹`, two digits after the point. */
const RUPEE = IN_FORMATS;
/** A currency with no minor unit and its own sign, so the rule is proven at another scale. */
const YEN = { locale: 'ja-JP', currency: 'JPY', currencySymbol: '¥', minorUnitDigits: 0 };

describe('readImportPrice — a price cell as a supplier writes it', () => {
  it.each([
    ['plain', '13200', '13200.00'],
    ['Western grouping', '132,000', '132000.00'],
    ['Indian grouping', '1,32,000', '132000.00'],
    ['Indian grouping into crores', '1,32,00,000', '13200000.00'],
    ['a currency sign', '₹ 13,200', '13200.00'],
    ['the currency code, any case', 'inr 13200.50', '13200.50'],
    ['the currency code after it', '13,200 INR', '13200.00'],
    ['trailing zeros past the minor unit', '13200.000', '13200.00'],
    ['Devanagari digits', '१३२००', '13200.00'],
    ['zero, which is a price', '0', '0.00'],
    ['leading zeros', '007', '7.00'],
    ['the minor unit exactly', '13200.05', '13200.05'],
    ['eleven whole digits', '99999999999', '99999999999.00'],
  ])('%s reads as decimal text at the scale (%s → %s)', (_, cell, amount) => {
    expect(readImportPrice(cell, RUPEE)).toEqual({ ok: true, amount });
  });

  it.each([
    ['an absent cell', undefined, 'price_missing'],
    ['an empty cell', '', 'price_missing'],
    ['a cell of spaces', '   ', 'price_missing'],
    ['a unit after it', '2,380/pc', 'price_unreadable'],
    ['a decimal comma, which is not grouping', '13,20', 'price_unreadable'],
    ['Western and Indian grouping mixed', '1,000,00', 'price_unreadable'],
    ['broken grouping', '13,20,0', 'price_unreadable'],
    ['a market mark the import does not read', 'Rs. 13200', 'price_unreadable'],
    ['the /- tail', '13,200/-', 'price_unreadable'],
    ['another currency code', 'USD 13200', 'price_unreadable'],
    ['another currency sign', '$ 13,200', 'price_unreadable'],
    ['the own code inside the figure', '13 INR 200', 'price_unreadable'],
    ['the own sign inside the figure', '13₹200', 'price_unreadable'],
    ['words', 'on request', 'price_unreadable'],
    ['twelve whole digits', '999999999999', 'price_unreadable'],
    ['a minus sign', '-100', 'price_below_zero'],
    ['a fraction of a paisa', '13200.005', 'price_finer_than_minor_unit'],
  ])('%s needs attention (%s)', (_, cell, reason) => {
    expect(readImportPrice(cell, RUPEE)).toEqual({ ok: false, reason });
  });

  it.each([
    ['a whole yen', '¥ 1,500', { ok: true, amount: '1500' }],
    ['a fraction of a yen', '1500.5', { ok: false, reason: 'price_finer_than_minor_unit' }],
    ['a rupee sign in a yen company', '₹ 1,500', { ok: false, reason: 'price_unreadable' }],
  ] as const)("the scale is the currency's: %s", (_, cell, price) => {
    expect(readImportPrice(cell, YEN)).toEqual(price);
  });
});
