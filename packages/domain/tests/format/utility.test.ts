import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { operatorsForRegion, typicalWait } from '../../src/format/utility';

const IN = IN_FORMATS.utilities;

describe('the IN utility directory (F1-53, MS1-03)', () => {
  it('carries the 37 states and union territories a site record selects from', () => {
    expect(IN.regions).toHaveLength(37);
  });

  it('lists a region alphabetically, so a picker renders one stable order', () => {
    const names = IN.regions.map((r) => r.region);
    expect(names).toEqual([...names].sort());
  });

  it('names the operators serving a region', () => {
    expect(operatorsForRegion(IN, 'Maharashtra')).toContain('MSEDCL');
    expect(operatorsForRegion(IN, 'Tamil Nadu')).toEqual(['TANGEDCO']);
  });

  it('returns empty for a region with no verified operator, never an invented one', () => {
    expect(operatorsForRegion(IN, 'Lakshadweep')).toEqual([]);
  });

  it('returns empty for a region this market does not have at all (F1-09)', () => {
    expect(operatorsForRegion(IN, 'Bavaria')).toEqual([]);
  });

  it('names no operator twice inside one region', () => {
    for (const { region, operators } of IN.regions) {
      expect(new Set(operators).size, `duplicate operator in ${region}`).toBe(operators.length);
    }
  });
});

describe('wait attribution — the honest framing a customer link renders (F1-53)', () => {
  it('gives net-metering approval the three-to-six-week range F1-53 states', () => {
    expect(typicalWait(IN, 'net_metering_approval')?.typicalWeeks).toEqual({ from: 3, to: 6 });
  });

  it('returns null for a procedure with no authored range, rather than an estimate', () => {
    expect(typicalWait(IN, 'utility_approval')).toBeNull();
  });
});
