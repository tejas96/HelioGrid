import { describe, expect, it } from 'vitest';
import { IN_PROPOSAL_FACTS } from '../../src/format/proposal-facts';
import { sizeFindings } from '../../src/proposals/checklist-size';
import type { ComponentLine } from '../../src/proposals/field-set';
import { A_DEAL, aFieldSet, GROWATT, WAAREE, withSystem } from './proposal-fixture';

const COMPONENTS = { step: 'components', fields: ['components'] };
const SYSTEM = { step: 'system', fields: ['system.capacityKw'] };

function sized(
  components: readonly ComponentLine[],
  deal = A_DEAL,
  market: typeof IN_PROPOSAL_FACTS | null = IN_PROPOSAL_FACTS,
) {
  return sizeFindings(aFieldSet({ components }), deal, market);
}

describe('sizeFindings — M06-23’s own case: four warnings, each with both figures', () => {
  const panels: ComponentLine = { ...WAAREE, count: 6, wattPeak: 579 };
  const inverter: ComponentLine = { ...GROWATT, capacityKw: 5, phases: 3 };
  const found = sized([panels, inverter], {
    ...A_DEAL,
    sanctionedLoadKw: 2,
    supplyPhase: 'single',
  });

  it('6 × 579 Wp on a 3 kW proposal, a three-phase 5 kW inverter, a 2 kW load, a single-phase supply', () => {
    expect(found.warnings).toEqual([
      {
        check: 'panel_capacity',
        brand: 'Waaree',
        count: 6,
        wattPeak: 579,
        panelKw: 3.474,
        systemKw: 3,
        ...COMPONENTS,
      },
      {
        check: 'inverter_band',
        panelBrand: 'Waaree',
        inverterBrand: 'Growatt',
        panelKw: 3.474,
        inverterKw: 5,
        reading: 'inverter_too_big',
        ...COMPONENTS,
      },
      { check: 'sanctioned_load', systemKw: 3, sanctionedLoadKw: 2, ...SYSTEM },
      {
        check: 'supply_phase',
        brand: 'Growatt',
        inverterPhases: 3,
        supplyPhases: 1,
        ...COMPONENTS,
      },
    ]);
    expect(found.skipped).toEqual([]);
  });

  it('with no sanctioned load on the lead, that check says it was skipped and why', () => {
    const unknown = sized([panels, inverter], { ...A_DEAL, sanctionedLoadKw: null });
    expect(unknown.skipped).toEqual([
      { check: 'sanctioned_load', reason: 'sanctioned_load_unknown', brand: null, ...SYSTEM },
    ]);
    expect(unknown.warnings.map((warning) => warning.check)).not.toContain('sanctioned_load');
  });
});

describe('sizeFindings — the panels against the system size, at the pack’s tolerance', () => {
  it.each([
    ['exactly the size', 6, 500, false],
    ['10% over: at the tolerance, not past it', 6, 550, false],
    ['a watt past 10% over', 6, 551, true],
    ['10% under', 6, 450, false],
    ['a watt past 10% under', 6, 449, true],
  ])('%s', (_, count, wattPeak, warns) => {
    const found = sized([{ ...WAAREE, count, wattPeak }]);
    expect(found.warnings.some((warning) => warning.check === 'panel_capacity')).toBe(warns);
  });

  it('runs per brand and names each', () => {
    const found = sized([
      { ...WAAREE, count: 6, wattPeak: 500 },
      { ...WAAREE, brand: 'Adani', count: 8, wattPeak: 500 },
    ]);
    expect(found.warnings).toEqual([
      {
        check: 'panel_capacity',
        brand: 'Adani',
        count: 8,
        wattPeak: 500,
        panelKw: 4,
        systemKw: 3,
        ...COMPONENTS,
      },
    ]);
  });

  it('a panel with no watt peak is skipped by name; one with no count is the block’s', () => {
    const found = sized([
      { ...WAAREE, wattPeak: null },
      { ...WAAREE, brand: 'Adani', count: null },
    ]);
    expect(found.skipped).toEqual([
      {
        check: 'panel_capacity',
        reason: 'panel_watt_peak_unknown',
        brand: 'Waaree',
        ...COMPONENTS,
      },
    ]);
    expect(found.warnings).toEqual([]);
  });
});

describe('sizeFindings — the panels against the inverter’s band', () => {
  it.each([
    ['80% of the inverter: the band’s foot', 3.75, null],
    ['just under 80%: the inverter is too big', 3.76, 'inverter_too_big'],
    ['130% of the inverter: the band’s top', 3 / 1.3, null],
    ['past 130%: the inverter is too small', 2.3, 'inverter_too_small'],
  ])('%s', (_, capacityKw, reading) => {
    const found = sized([WAAREE, { ...GROWATT, capacityKw }]);
    const warning = found.warnings.find((one) => one.check === 'inverter_band');
    expect(warning?.check === 'inverter_band' ? warning.reading : null).toBe(reading);
  });

  it('two inverters of 1.5 kW are 3 kW of inverter', () => {
    expect(sized([WAAREE, { ...GROWATT, count: 2, capacityKw: 1.5 }]).warnings).toEqual([]);
  });

  it('an inverter with no capacity is skipped by name; one with no count is the block’s', () => {
    const found = sized([
      WAAREE,
      { ...GROWATT, capacityKw: null },
      { ...GROWATT, brand: 'Solis', count: null },
    ]);
    expect(found.skipped).toEqual([
      {
        check: 'inverter_band',
        reason: 'inverter_capacity_unknown',
        brand: 'Growatt',
        ...COMPONENTS,
      },
    ]);
  });

  it('a panel with no watt peak has no capacity to hold against the inverter', () => {
    const found = sized([{ ...WAAREE, wattPeak: null }, GROWATT]);
    expect(found.warnings).toEqual([]);
  });
});

describe('sizeFindings — the load and the phases', () => {
  it.each([
    ['at the sanctioned load', 3, false],
    ['above it', 2.9, true],
  ])('%s', (_, sanctionedLoadKw, warns) => {
    const found = sized([WAAREE, GROWATT], { ...A_DEAL, sanctionedLoadKw });
    expect(found.warnings.some((warning) => warning.check === 'sanctioned_load')).toBe(warns);
  });

  it('a three-phase supply with a single-phase inverter differs too', () => {
    const found = sized([WAAREE, GROWATT], { ...A_DEAL, supplyPhase: 'three' });
    expect(found.warnings).toEqual([
      {
        check: 'supply_phase',
        brand: 'Growatt',
        inverterPhases: 1,
        supplyPhases: 3,
        ...COMPONENTS,
      },
    ]);
  });

  it('an unknown supply, and an inverter of unknown phases, each say they were skipped', () => {
    expect(sized([WAAREE, GROWATT], { ...A_DEAL, supplyPhase: null }).skipped).toEqual([
      { check: 'supply_phase', reason: 'supply_phase_unknown', brand: null, ...SYSTEM },
    ]);
    expect(sized([WAAREE, { ...GROWATT, phases: null }]).skipped).toEqual([
      { check: 'supply_phase', reason: 'inverter_phases_unknown', brand: 'Growatt', ...COMPONENTS },
    ]);
  });
});

describe('sizeFindings — what there is nothing to size against', () => {
  it('a pack that declares no proposal facts skips the two checks that read them', () => {
    expect(sized([WAAREE, GROWATT], A_DEAL, null).skipped).toEqual([
      { check: 'panel_capacity', reason: 'market_declares_none', brand: null, ...COMPONENTS },
      { check: 'inverter_band', reason: 'market_declares_none', brand: null, ...COMPONENTS },
    ]);
  });

  it.each([null, 0])('a system size of %s sizes nothing', (capacityKw) => {
    const fields = { ...withSystem({ capacityKw }), components: [WAAREE, GROWATT] };
    expect(sizeFindings(fields, A_DEAL, IN_PROPOSAL_FACTS)).toEqual({ warnings: [], skipped: [] });
  });
});
