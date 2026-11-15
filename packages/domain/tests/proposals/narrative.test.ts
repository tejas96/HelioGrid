import { describe, expect, it } from 'vitest';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import type { ComponentLine } from '../../src/proposals/field-set';
import {
  coverLineFacts,
  includedInPrice,
  namesAlternatives,
  timelineDays,
} from '../../src/proposals/narrative';
import {
  aFieldSet,
  GROWATT,
  HAVELLS,
  POLYCAB,
  TATA_STRUCTURE,
  WAAREE,
  withSystem,
} from './proposal-fixture';

const BATTERY_LINE: ComponentLine = {
  category: 'battery',
  brand: 'Exide',
  description: null,
  count: null,
  source: 'platform_item',
  catalogItemId: null,
  savedPartId: null,
  tier: 'assumed',
  certifications: [],
  capacityKwh: 5,
  chemistry: 'lfp',
  chemistryCustom: null,
  warranty: null,
};

describe('includedInPrice — a line exists only when its fact exists (M06-52)', () => {
  it('a complete on-grid proposal with commissioning and no maintenance plan', () => {
    expect(includedInPrice(aFieldSet())).toEqual([
      { kind: 'panels_and_inverter', panelCount: 6 },
      { kind: 'structure_cables_electrical' },
      { kind: 'commissioning' },
    ]);
  });

  it.each([
    [
      'no panel count',
      [{ ...WAAREE, count: null }, GROWATT, POLYCAB, HAVELLS, TATA_STRUCTURE],
      'panels_and_inverter',
    ],
    ['no inverter', [WAAREE, POLYCAB, HAVELLS, TATA_STRUCTURE], 'panels_and_inverter'],
    ['no structure', [WAAREE, GROWATT, POLYCAB, HAVELLS], 'structure_cables_electrical'],
    ['no cable', [WAAREE, GROWATT, HAVELLS, TATA_STRUCTURE], 'structure_cables_electrical'],
    ['no electrical', [WAAREE, GROWATT, POLYCAB, TATA_STRUCTURE], 'structure_cables_electrical'],
  ] as const)('%s leaves its line out', (_, components, kind) => {
    const kinds = includedInPrice(aFieldSet({ components })).map((line) => line.kind);
    expect(kinds).not.toContain(kind);
  });

  it('commissioning off leaves its line out', () => {
    const kinds = includedInPrice(withSystem({ commissioningIncluded: false })).map(
      (line) => line.kind,
    );
    expect(kinds).not.toContain('commissioning');
  });

  it.each([
    [{ kind: 'none' as const }, []],
    [{ kind: 'free' as const }, [{ kind: 'maintenance_free' }]],
    [{ kind: 'years' as const, years: 5 }, [{ kind: 'maintenance_years', years: 5 }]],
  ])('maintenance %o', (maintenance, lines) => {
    const included = includedInPrice(withSystem({ maintenance }));
    expect(included.filter((line) => line.kind.startsWith('maintenance'))).toEqual(lines);
  });

  it('a battery line needs both the battery and its picked brand', () => {
    const battery = {
      capacityKwh: 5,
      costInclusive: minorUnits(5_900_000),
      taxRate: basisPoints(1800),
      chemistry: 'lfp' as const,
      chemistryCustom: null,
    };
    const fields = withSystem({ battery });
    expect(includedInPrice(fields).map((line) => line.kind)).not.toContain('battery');
    expect(
      includedInPrice({ ...fields, components: [...fields.components, BATTERY_LINE] }),
    ).toContainEqual({ kind: 'battery', capacityKwh: 5 });
  });
});

describe('the cover line and the system page’s facts', () => {
  it('a 3 kW on-grid system the customer owns', () => {
    expect(coverLineFacts(aFieldSet())).toEqual({
      capacityKw: 3,
      systemType: 'on_grid',
      paysForPower: false,
    });
  });

  it('a system the customer pays for the power of', () => {
    const fields = aFieldSet({
      company: {
        proposalType: 'customer_pays_for_power',
        coverPicture: { kind: 'platform', key: 'villa' },
      },
    });
    expect(coverLineFacts(fields)?.paysForPower).toBe(true);
  });

  it('no size: no line', () => {
    expect(coverLineFacts(withSystem({ capacityKw: null }))).toBeNull();
  });

  it('two brands in one section read as alternatives; one each does not', () => {
    expect(namesAlternatives(aFieldSet())).toBe(false);
    expect(
      namesAlternatives(
        aFieldSet({ components: [WAAREE, { ...WAAREE, brand: 'Adani' }, GROWATT] }),
      ),
    ).toBe(true);
  });
});

describe('timelineDays — a total is never printed over a gap', () => {
  it.each([
    [[2, 3, 13], 18],
    [[2, null, 13], null],
    [[], null],
    [[0], 0],
  ])('%j adds up to %s', (durations, days) => {
    const timeline = durations.map((durationDays) => ({
      name: 'Step',
      description: 'Work.',
      durationDays,
    }));
    expect(timelineDays(timeline)).toBe(days);
  });
});
