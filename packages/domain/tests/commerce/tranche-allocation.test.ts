import { describe, expect, it } from 'vitest';
import { allocationVerdict, WHOLE_ALLOCATION } from '../../src/commerce/tranche-allocation';
import { STANDARD_TRANCHE_TEMPLATES } from '../../src/commerce/tranche-template-defaults';
import { basisPoints, percentToBasisPoints } from '../../src/money/basis-points';

const split = (...percents: string[]) => percents.map(percentToBasisPoints);

describe('allocationVerdict — exactly 100.00, no tolerance (M01-54)', () => {
  it.each([
    { lines: split('10.00', '60.00', '20.00', '10.00'), state: 'met', remainder: 0 },
    { lines: split('30.00', '60.00', '10.00'), state: 'met', remainder: 0 },
    { lines: split('100.00'), state: 'met', remainder: 0 },
    { lines: split('10.00', '60.00', '20.00'), state: 'under', remainder: 1000 },
    { lines: split('33.33', '33.33', '33.33'), state: 'under', remainder: 1 },
    { lines: split('33.33', '33.33', '33.34'), state: 'met', remainder: 0 },
    { lines: split('99.99'), state: 'under', remainder: 1 },
    { lines: split('50.00', '50.00', '0.01'), state: 'over', remainder: -1 },
    { lines: split('100.00', '100.00'), state: 'over', remainder: -10_000 },
    { lines: [], state: 'under', remainder: 10_000 },
  ])('$lines → $state with $remainder unallocated', ({ lines, state, remainder }) => {
    expect(allocationVerdict(lines)).toEqual({
      allocated: WHOLE_ALLOCATION - remainder,
      remainder,
      state,
    });
  });

  it('is met by both standard splits the platform seeds — the seed can never refuse itself', () => {
    for (const template of STANDARD_TRANCHE_TEMPLATES) {
      expect(allocationVerdict(template.lines.map((line) => line.share)).state).toBe('met');
    }
  });

  it('reads the wire’s percent and the store’s basis points as one number', () => {
    expect(allocationVerdict([basisPoints(10_000)]).state).toBe('met');
    expect(allocationVerdict(split('100.00')).state).toBe('met');
  });
});
