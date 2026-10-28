import { describe, expect, it } from 'vitest';
import { PREVIEW_CONTRACT_VALUE, previewTrancheAmounts } from '../../src/commerce/tranche-preview';
import { basisPoints, percentToBasisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';

const rupees = minorUnits(PREVIEW_CONTRACT_VALUE * 100);
const split = (...percents: string[]) => percents.map(percentToBasisPoints);

describe('previewTrancheAmounts — the schedule on the sample contract (F4-04, SCR-M01-20)', () => {
  it('is the board’s sample, ₹4,20,000', () => {
    expect(PREVIEW_CONTRACT_VALUE).toBe(420_000);
  });

  it('every share of the sample is exact, at every currency digit count', () => {
    for (const digits of [0, 2, 3]) {
      const total = minorUnits(PREVIEW_CONTRACT_VALUE * 10 ** digits);
      for (let share = 1; share <= 10_000; share += 1) {
        const [amount] = previewTrancheAmounts(total, [basisPoints(share)]);
        expect((amount ?? 0) * 10_000).toBe(total * share);
      }
    }
  });

  it('the amounts sum to the sample', () => {
    const amounts = previewTrancheAmounts(rupees, split('33.33', '33.33', '33.34'));
    expect(amounts).toEqual([13_998_600, 13_998_600, 14_002_800]);
    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(rupees);
  });

  it('answers in the order of the shares', () => {
    expect(previewTrancheAmounts(rupees, split('10.00', '60.00', '20.00', '10.00'))).toEqual([
      4_200_000, 25_200_000, 8_400_000, 4_200_000,
    ]);
  });
});
