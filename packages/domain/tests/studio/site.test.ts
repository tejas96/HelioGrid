import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { operatorsForArea } from '../../src/format/utility';
import { areaOfPlace, operatorAfterArea, siteStartBlock } from '../../src/studio/site';

const { areas, utilities } = IN_FORMATS;

describe('the utility directory, by area', () => {
  it('serves every area the market declares', () => {
    const served = new Set(utilities.regions.map((region) => region.area));
    expect(areas.filter((area) => !served.has(area.code)).map((area) => area.code)).toEqual([]);
  });

  it('names no area the market does not declare', () => {
    const declared = new Set(areas.map((area) => area.code));
    expect(utilities.regions.filter((region) => !declared.has(region.area ?? ''))).toEqual([]);
  });

  it('reads the operators by the area code, whatever the directory calls the region', () => {
    expect(operatorsForArea(utilities, 'IN-DL')).toContain('BSES Rajdhani');
    expect(operatorsForArea(utilities, 'IN-MH')).toContain('MSEDCL');
    expect(operatorsForArea(utilities, 'IN-DH')).toEqual([]);
    expect(operatorsForArea(utilities, 'DE-BY')).toEqual([]);
  });
});

describe('the operator after the area changes', () => {
  it('picks the only operator of an area that lists one', () => {
    expect(operatorAfterArea(utilities, 'IN-TN', null)).toBe('TANGEDCO');
  });

  it('keeps the operator already picked where the area lists it', () => {
    expect(operatorAfterArea(utilities, 'IN-MH', 'BEST')).toBe('BEST');
  });

  it('picks none among several, none for a stranger, and none with no area', () => {
    expect(operatorAfterArea(utilities, 'IN-MH', null)).toBeNull();
    expect(operatorAfterArea(utilities, 'IN-MH', 'TANGEDCO')).toBeNull();
    expect(operatorAfterArea(utilities, 'IN-LD', 'MSEDCL')).toBeNull();
    expect(operatorAfterArea(utilities, null, 'MSEDCL')).toBeNull();
  });
});

describe('the area a found place lies in', () => {
  it('reads the region code first', () => {
    expect(areaOfPlace(areas, utilities, { code: 'MH', name: 'Maharashtra' })).toBe('IN-MH');
    expect(areaOfPlace(areas, utilities, { code: 'mh', name: null })).toBe('IN-MH');
  });

  it('falls to the area name, then to the directory name', () => {
    expect(areaOfPlace(areas, utilities, { code: null, name: 'karnataka' })).toBe('IN-KA');
    expect(areaOfPlace(areas, utilities, { code: 'ZZ', name: 'Delhi' })).toBe('IN-DL');
    expect(areaOfPlace(areas, utilities, { code: null, name: 'Jammu & Kashmir' })).toBe('IN-JK');
  });

  it('matches nothing for a region the market does not hold', () => {
    expect(areaOfPlace(areas, utilities, { code: 'BY', name: 'Bavaria' })).toBeNull();
    expect(areaOfPlace(areas, utilities, { code: null, name: null })).toBeNull();
  });
});

describe('what a design waits for before it starts', () => {
  it('waits for a location and for nothing else', () => {
    expect(siteStartBlock({ pin: null })).toBe('no_location');
    expect(siteStartBlock({ pin: { latitude: 16.8367, longitude: 74.5966 } })).toBeNull();
  });
});
