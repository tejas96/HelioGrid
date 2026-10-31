import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { minorUnits } from '../../src/money/minor-units';
import { IN_PRICE_BOOK } from '../../src/pricing/india';
import { taxBreakdown } from '../../src/tax/breakdown';
import { platformSaleTotal } from '../../src/tax/platform-sale';

/** India once the platform holds a GSTIN: the pack revision that publishes it. */
const REGISTERED = {
  ...IN_PACK,
  tax: {
    ...IN_PACK.tax,
    platformRegistration: { registrationType: 'IN_GST', value: '27AAACH7409R1ZV' },
  },
};

describe('platformSaleTotal — what the gateway collects for a sale (BM-40, F1-28)', () => {
  it.each([
    { name: 'nothing', list: 0 },
    { name: 'a month of Starter', list: 199_900 },
    { name: 'a year of Starter', list: 1_999_000 },
  ])('an unregistered platform collects the list price alone: $name', ({ list }) => {
    expect(platformSaleTotal(IN_PACK, minorUnits(list))).toBe(list);
  });

  it.each([
    { name: 'nothing', list: 0, total: 0 },
    { name: 'one paisa', list: 1, total: 1 },
    { name: 'a month of Starter', list: 199_900, total: 235_882 },
    { name: 'a month of Growth', list: 399_900, total: 471_882 },
    { name: 'a year of Starter', list: 1_999_000, total: 2_358_820 },
  ])('a registered platform: $name ex-tax collects the price plus 18% GST', ({ list, total }) => {
    expect(platformSaleTotal(REGISTERED, minorUnits(list))).toBe(total);
  });

  it('collects the same total wherever the company is, for every listed IN price', () => {
    const prices = Object.values(IN_PRICE_BOOK.tiers).flatMap((row) =>
      row === null || row.price.kind !== 'listed' ? [] : Object.values(row.price.perCycle),
    );
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
      const line = {
        taxableAmount: price,
        rateBasisPoints: IN_PACK.tax.platformSale.rateBasisPoints,
      };
      const interState = taxBreakdown(REGISTERED, [line], { supplier: '27', recipient: '29' });
      expect(platformSaleTotal(REGISTERED, price)).toBe(interState.totalAmount);
    }
  });
});
