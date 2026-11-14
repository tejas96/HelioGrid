import { describe, expect, it } from 'vitest';
import { locateArea } from '../../src/format/areas';
import { IN_AREAS } from '../../src/format/areas-in';
import { ESTIMATE_TOLERANCE_PERCENT } from '../../src/format/energy-source';
import { type BuiltInYieldTable, builtInMonthlyYield } from '../../src/proposals/built-in-yield';
import { IN_BUILT_IN_YIELD } from '../../src/proposals/built-in-yield-in';
import { isMonthlyFigures, yearlyKwh } from '../../src/proposals/energy';
import { OFF_CENTRE_SAMPLES } from './built-in-yield.fixture';

const FLAT = (kwh: number) => Array.from({ length: 12 }, () => kwh);
const TABLE: BuiltInYieldTable = {
  areas: { 'IN-MH': FLAT(120) },
  districts: { 'IN-MH': { Pune: FLAT(130) } },
};

describe('builtInMonthlyYield — the district’s row, else its region’s, else none (T-M06-033)', () => {
  it.each([
    ['a district the table holds', { area: 'IN-MH', district: 'Pune' }, 130, 'district'],
    [
      'a district it does not: the region’s, the coarser estimate',
      { area: 'IN-MH', district: 'Wardha' },
      120,
      'area',
    ],
    ['a region-only pick', { area: 'IN-MH', district: null }, 120, 'area'],
  ] as const)('%s', (_, ref, kwh, grain) => {
    expect(builtInMonthlyYield(TABLE, ref)).toEqual({ yieldPerKwp: FLAT(kwh), grain });
  });

  it('a region the table does not hold has no estimate, never an invented one', () => {
    expect(builtInMonthlyYield(TABLE, { area: 'IN-GJ', district: 'Surat' })).toBeNull();
  });
});

describe('IN_BUILT_IN_YIELD — earns its label by measurement (F8-08)', () => {
  it('every row is twelve finite, non-negative months', () => {
    const rows = [
      ...Object.values(IN_BUILT_IN_YIELD.areas),
      ...Object.values(IN_BUILT_IN_YIELD.districts).flatMap((districts) =>
        Object.values(districts),
      ),
    ];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(isMonthlyFigures(row)).toBe(true);
  });

  it('holds a row for every region and district the pack offers', () => {
    const missing = IN_AREAS.flatMap((area) => [
      ...(IN_BUILT_IN_YIELD.areas[area.code] === undefined ? [area.code] : []),
      ...area.districts
        .filter((district) => IN_BUILT_IN_YIELD.districts[area.code]?.[district.name] === undefined)
        .map((district) => `${area.code} · ${district.name}`),
    ]);
    expect(missing).toEqual([]);
  });

  it('every district the pack offers can be asked: its own point, and its own built-in row', () => {
    const unasked = IN_AREAS.flatMap((area) =>
      area.districts
        .filter((district) => {
          const ref = { area: area.code, district: district.name };
          const located = locateArea(IN_AREAS, ref);
          const { latitude, longitude } = located?.coordinate ?? { latitude: NaN, longitude: NaN };
          return (
            located?.grain !== 'district' ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            builtInMonthlyYield(IN_BUILT_IN_YIELD, ref)?.grain !== 'district'
          );
        })
        .map((district) => `${area.code} · ${district.name}`),
    );
    expect(unasked).toEqual([]);
  });

  it(`reads within ±${ESTIMATE_TOLERANCE_PERCENT}% of what the source answers off the district’s own point`, () => {
    expect(OFF_CENTRE_SAMPLES.length).toBeGreaterThan(0);
    const off = OFF_CENTRE_SAMPLES.flatMap((sample) => {
      const row = builtInMonthlyYield(IN_BUILT_IN_YIELD, {
        area: sample.area,
        district: sample.district,
      });
      if (row === null || row.grain !== 'district')
        return [`${sample.area} · ${sample.district}: no row`];
      const recorded = yearlyKwh(sample.recorded);
      const apartPercent = (Math.abs(yearlyKwh(row.yieldPerKwp) - recorded) / recorded) * 100;
      return apartPercent > ESTIMATE_TOLERANCE_PERCENT
        ? [`${sample.area} · ${sample.district}: ${apartPercent.toFixed(1)}% apart`]
        : [];
    });
    expect(off).toEqual([]);
  });
});
