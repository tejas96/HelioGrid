import { describe, expect, it } from 'vitest';
import { lowMedianOf } from '../../src/dashboards/median';
import { minorUnits } from '../../src/money';

const m = (...values: number[]) => values.map(minorUnits);

describe('lowMedianOf — the middle deal, never a mean (M13-18)', () => {
  it.each([
    [[], null],
    [[500], 500],
    [[300, 100], 100],
    [[100, 900, 300], 300],
    [[1_450_000_00, 300_000_00, 320_000_00, 280_000_00], 300_000_00],
  ])('%o → %o', (values, median) => {
    expect(lowMedianOf(m(...values))).toBe(median);
  });
});
