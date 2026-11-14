import { describe, expect, it } from 'vitest';
import { type AdministrativeArea, areaOf, locateArea } from '../../src/format/areas';
import { IN_AREAS } from '../../src/format/areas-in';

const PUNE = { latitude: 18.52, longitude: 73.86 };
const AREAS: readonly AdministrativeArea[] = [
  {
    code: 'IN-MH',
    name: { en: 'Maharashtra' },
    coordinate: { latitude: 19.88, longitude: 75.34 },
    districts: [{ name: 'Pune', coordinate: PUNE }],
  },
];

describe('locateArea — the district’s point, else its region’s, else none (T-M06-033)', () => {
  it.each([
    ['a district the pack holds', { area: 'IN-MH', district: 'Pune' }, PUNE, 'district'],
    [
      'a district it does not hold: the region’s, the coarser point',
      { area: 'IN-MH', district: 'Wardha' },
      { latitude: 19.88, longitude: 75.34 },
      'area',
    ],
    [
      'a region-only pick',
      { area: 'IN-MH', district: null },
      { latitude: 19.88, longitude: 75.34 },
      'area',
    ],
  ] as const)('%s', (_, ref, coordinate, grain) => {
    expect(locateArea(AREAS, ref)).toEqual({ coordinate, grain });
  });

  it('a region the market never declared has no point', () => {
    expect(locateArea(AREAS, { area: 'IN-XX', district: 'Pune' })).toBeNull();
    expect(areaOf(AREAS, 'IN-XX')).toBeNull();
    expect(locateArea([], { area: 'IN-MH', district: null })).toBeNull();
  });
});

describe('IN_AREAS — the list step 3 offers', () => {
  it('names each region once, and each district once within its region', () => {
    const codes = IN_AREAS.map((area) => area.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const area of IN_AREAS) {
      const names = area.districts.map((district) => district.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('puts every point inside India’s own bounds', () => {
    const outside = IN_AREAS.flatMap((area) =>
      [{ name: area.code, coordinate: area.coordinate }, ...area.districts].filter(
        ({ coordinate }) =>
          coordinate.latitude < 6 ||
          coordinate.latitude > 37.5 ||
          coordinate.longitude < 68 ||
          coordinate.longitude > 97.5,
      ),
    );
    expect(outside).toEqual([]);
  });
});
