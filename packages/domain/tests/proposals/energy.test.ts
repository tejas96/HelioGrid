import { describe, expect, it } from 'vitest';
import {
  bestMonth,
  capacityChangedSinceEdit,
  isMonthlyFigures,
  systemMonthlyKwh,
  yearlyKwh,
} from '../../src/proposals/energy';
import type { PerformanceFields } from '../../src/proposals/field-set';

const FLAT_100 = Array.from({ length: 12 }, () => 100);

const performance = (over: Partial<PerformanceFields> = {}): PerformanceFields => ({
  efficiencyPercent: 80,
  yieldPerKwp: FLAT_100,
  source: { kind: 'estimate' },
  grain: 'district',
  editedMonthlyKwh: null,
  editedAtCapacityKw: null,
  ...over,
});

describe('systemMonthlyKwh — the size and the efficiency, applied once (T-M06-033)', () => {
  it.each([
    ['3 kW at 80%', 3, 80, 240],
    ['1 kW at 100% is what the source answered', 1, 100, 100],
    ['0.5 kW at 50%', 0.5, 50, 25],
  ])('%s', (_, capacityKw, efficiencyPercent, month) => {
    const months = systemMonthlyKwh(performance({ efficiencyPercent }), capacityKw);
    expect(months?.every((kwh) => kwh === month)).toBe(true);
    expect(months).toHaveLength(12);
  });

  it('the person’s own figures stand as typed, whatever the size', () => {
    const typed = Array.from({ length: 12 }, (_, month) => 200 + month);
    expect(systemMonthlyKwh(performance({ editedMonthlyKwh: typed }), 9)).toBe(typed);
  });

  it.each([
    ['nothing filled yet', performance({ yieldPerKwp: null }), 3],
    ['no size yet', performance(), null],
  ])('%s: no generation to state', (_, fields, capacityKw) => {
    expect(systemMonthlyKwh(fields, capacityKw)).toBeNull();
  });
});

describe('the year, and its best month', () => {
  it('a year is its twelve months', () => {
    expect(yearlyKwh(FLAT_100)).toBe(1200);
    expect(yearlyKwh([])).toBe(0);
  });

  it.each([
    [[1, 5, 3], 1],
    [[7, 7, 7], 0],
    [[0, 0, 9], 2],
  ])('the best of %j is month %i', (months, best) => {
    expect(bestMonth(months)).toBe(best);
  });
});

describe('capacityChangedSinceEdit — "Capacity changed — Reset to AI values"', () => {
  it.each([
    ['typed at 3 kW, now 5 kW', FLAT_100, 3, 5, true],
    ['typed at 3 kW, still 3 kW', FLAT_100, 3, 3, false],
    ['never edited', null, null, 5, false],
    ['typed before any size was known', FLAT_100, null, 5, false],
  ])('%s', (_, editedMonthlyKwh, editedAtCapacityKw, now, changed) => {
    expect(
      capacityChangedSinceEdit(performance({ editedMonthlyKwh, editedAtCapacityKw }), now),
    ).toBe(changed);
  });
});

describe('isMonthlyFigures — what a month row may hold', () => {
  it.each([
    [FLAT_100, true],
    [FLAT_100.slice(1), false],
    [[...FLAT_100, 1], false],
    [[...FLAT_100.slice(1), -1], false],
    [[...FLAT_100.slice(1), Number.NaN], false],
    [[...FLAT_100.slice(1), 0], true],
  ])('%#', (value, fits) => {
    expect(isMonthlyFigures(value)).toBe(fits);
  });
});
