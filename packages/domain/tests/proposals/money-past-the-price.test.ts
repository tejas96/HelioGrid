import { describe, expect, it } from 'vitest';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { proposalMoney } from '../../src/proposals/money';
import { moneyInput, withSystem } from './proposal-fixture';

const BATTERY = {
  capacityKwh: 5,
  costInclusive: minorUnits(5_900_000),
  taxRate: basisPoints(1800),
  chemistry: 'lfp' as const,
  chemistryCustom: null,
};

const moneyWith = (amount: number, battery: typeof BATTERY | null = null) => {
  const fields = withSystem({ discount: { mode: 'amount', amount: minorUnits(amount) }, battery });
  const block = proposalMoney(moneyInput(fields));
  if (block === null) throw new Error('the fixture is priced');
  return block;
};

/*
 * `M06-36` and the step-3 ruling on the discount's base: tax is worked out on the price the
 * customer pays, so a discount past the price leaves nothing to tax — the tax is zero, never a
 * refund — and the payable states the negative so Generate can block on it.
 */
describe('proposalMoney — a discount past the price taxes nothing (M06-36)', () => {
  it.each([
    ['one paisa short of the price', 17_499_999, 1, 0, 1, false],
    ['exactly the price', 17_500_000, 0, 0, 0, true],
    ['one paisa past the price', 17_500_001, -1, 0, -1, true],
    ['₹25,000 past the price', 20_000_000, -2_500_000, 0, -2_500_000, true],
  ])('%s', (_, discount, preTax, taxAmount, payable, blocked) => {
    const block = moneyWith(discount);
    expect(block.preTax).toBe(preTax);
    expect(block.taxAmount).toBe(taxAmount);
    expect(block.payable).toBe(payable);
    expect(block.payableAtOrBelowZero).toBe(blocked);
  });

  it('every line of the equation is a magnitude, and tax never reads as a deduction', () => {
    const block = moneyWith(20_000_000);
    expect(block.equation.lines.map((line) => [line.key, line.kind, line.amount])).toEqual([
      ['system', 'add', 17_500_000],
      ['discount', 'deduct', 20_000_000],
      ['tax', 'add', 0],
    ]);
    expect(block.taxes.every((component) => component.amount === 0)).toBe(true);
  });

  it('with a battery, neither line is taxed below zero', () => {
    const block = moneyWith(30_000_000, BATTERY);
    expect(block.taxAmount).toBe(0);
    expect(block.payable).toBe(block.preTax);
    expect(block.payable).toBe(17_500_000 + 5_000_000 - 30_000_000);
  });
});
