import { describe, expect, it } from 'vitest';
import { minorUnits } from '../../src/money/minor-units';
import { dayRate, partCycleCharge } from '../../src/money/part-cycle';

const month = (rupees: number) => ({ price: minorUnits(rupees * 100), days: 30 });
const year = (rupees: number) => ({ price: minorUnits(rupees * 100), days: 365 });

describe('partCycleCharge — the days left at the new day rate, less the old', () => {
  it('bills Growth to Pro with 16 of 30 days left as ₹3,200.00', () => {
    expect(partCycleCharge({ daysLeft: 16, from: month(3999), to: month(9999) })).toBe(320_000);
  });

  it('bills nothing for Growth monthly to yearly, whose day rate is lower', () => {
    expect(partCycleCharge({ daysLeft: 16, from: month(3999), to: year(39_990) })).toBe(0);
  });

  it('bills nothing for a downgrade: no mid-cycle refund', () => {
    expect(partCycleCharge({ daysLeft: 16, from: month(3999), to: month(1999) })).toBe(0);
  });

  it('rounds once, half away from zero, on the whole fraction', () => {
    // 1 day × (₹1.00 − ₹0.00) ÷ 3 days = 33.33… paise, and 2 days make 66.66… paise
    expect(
      partCycleCharge({
        daysLeft: 1,
        from: { price: minorUnits(0), days: 3 },
        to: { price: minorUnits(100), days: 3 },
      }),
    ).toBe(33);
    expect(
      partCycleCharge({
        daysLeft: 2,
        from: { price: minorUnits(0), days: 3 },
        to: { price: minorUnits(100), days: 3 },
      }),
    ).toBe(67);
  });

  it('bills a monthly-to-yearly upgrade at the yearly day rate', () => {
    // Growth monthly → Pro yearly, 16 days: 16 × (9,99,99,00 × 30 − 3,99,900 × 365) ÷ (365 × 30)
    expect(partCycleCharge({ daysLeft: 16, from: month(3999), to: year(99_999) })).toBe(225_072);
  });

  it('refuses a cycle with no days', () => {
    expect(() =>
      partCycleCharge({ daysLeft: 0, from: { price: minorUnits(1), days: 0 }, to: month(2) }),
    ).toThrow(RangeError);
    expect(() =>
      partCycleCharge({ daysLeft: 0, from: month(1), to: { price: minorUnits(2), days: 0 } }),
    ).toThrow(RangeError);
  });

  it.each([[-1], [1.5], [Number.NaN]])('refuses %o days left', (daysLeft) => {
    expect(() => partCycleCharge({ daysLeft, from: month(1), to: month(2) })).toThrow(RangeError);
  });
});

describe("dayRate — a cycle's price per day, rounded once", () => {
  it.each([
    [399_900, 30, 13_330],
    [3_999_000, 365, 10_956],
    [100, 3, 33],
    [200, 3, 67],
    [-200, 3, -67],
  ])('%d over %d days is %d', (price, days, rate) => {
    expect(dayRate({ price: minorUnits(price), days })).toBe(rate);
  });

  it.each([[0], [-1], [1.5]])('refuses a cycle of %o days', (days) => {
    expect(() => dayRate({ price: minorUnits(100), days })).toThrow(RangeError);
  });
});
