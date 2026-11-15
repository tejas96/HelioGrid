import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { generateVerdict } from '../../src/proposals/checklist';
import type { ComponentLine } from '../../src/proposals/field-set';
import {
  aFieldSet,
  checkInput as check,
  GROWATT,
  HAVELLS,
  POLYCAB,
  TATA_STRUCTURE,
  WAAREE,
  withSystem,
} from './proposal-fixture';

const withComponents = (components: readonly ComponentLine[]) => aFieldSet({ components });
const others = [GROWATT, POLYCAB, HAVELLS, TATA_STRUCTURE];

describe('generateVerdict — a complete proposal passes', () => {
  it('no block, no warning, nothing skipped', () => {
    expect(generateVerdict(check())).toEqual({
      blocks: [],
      warnings: [],
      skipped: [],
      canGenerate: true,
    });
  });
});

describe('generateVerdict — (a) every category picked, and counted where it counts (M06-27)', () => {
  it('no components: all five are named, on step 8', () => {
    const verdict = generateVerdict(check(withComponents([])));
    expect(verdict.canGenerate).toBe(false);
    expect(verdict.blocks.filter((block) => block.check === 'component_missing')).toEqual(
      ['panel', 'inverter', 'cable', 'electrical', 'structure'].map((category) => ({
        check: 'component_missing',
        category,
        step: 'components',
        fields: ['components'],
      })),
    );
  });

  it('a battery on the system joins the required set', () => {
    const fields = withSystem({
      battery: {
        capacityKwh: 5,
        costInclusive: minorUnits(5_900_000),
        taxRate: basisPoints(1800),
        chemistry: 'lfp',
        chemistryCustom: null,
      },
    });
    expect(generateVerdict(check(fields)).blocks).toEqual([
      {
        check: 'component_missing',
        category: 'battery',
        step: 'components',
        fields: ['components'],
      },
    ]);
  });

  it.each([
    ['no count', null],
    ['a count of nothing', 0],
  ])('a panel with %s is named by brand', (_, count) => {
    const verdict = generateVerdict(check(withComponents([{ ...WAAREE, count }, ...others])));
    expect(verdict.blocks).toEqual([
      {
        check: 'component_count_missing',
        category: 'panel',
        brand: 'Waaree',
        step: 'components',
        fields: ['components'],
      },
    ]);
  });

  it('a cable carries no count and needs none', () => {
    expect(generateVerdict(check()).blocks).toEqual([]);
  });
});

describe('generateVerdict — (b) a system that cannot work without storage (M06-30)', () => {
  it.each(['off_grid', 'hybrid'] as const)('%s with no battery blocks at step 3', (systemType) => {
    const verdict = generateVerdict(check(withSystem({ systemType, incentiveClaimed: false })));
    expect(verdict.blocks).toContainEqual({
      check: 'battery_required',
      systemType,
      step: 'system',
      fields: ['system.battery'],
    });
  });
});

describe('generateVerdict — (c) the payable floor (M06-36)', () => {
  it.each([
    ['a ₹0 price and no discount', { priceInclusive: minorUnits(0) }, 0],
    [
      'a discount past the price',
      { discount: { mode: 'amount' as const, amount: minorUnits(20_000_000) } },
      -2_500_000,
    ],
  ])('%s blocks with the figure shown', (_, system, payable) => {
    const verdict = generateVerdict(check(withSystem(system)));
    expect(verdict.blocks).toContainEqual({
      check: 'payable_not_positive',
      payable,
      step: 'system',
      fields: ['system.priceInclusive', 'system.discount'],
    });
  });

  it('corrected positive, the same checklist passes', () => {
    expect(generateVerdict(check(withSystem({ priceInclusive: minorUnits(1) }))).canGenerate).toBe(
      true,
    );
  });
});

describe('generateVerdict — (d) the payment parts add up (M06-13)', () => {
  it.each([
    ['12% unallocated', [1000, 6000, 1800], 8800, 1200],
    ['over by 5%', [1000, 6000, 2000, 1500], 10_500, -500],
    ['no parts at all', [], 0, 10_000],
  ])('%s is stated with its remainder', (_, shares, allocated, remainder) => {
    const fields = aFieldSet({
      payment: {
        templateId: null,
        tranches: shares.map((share) => ({
          label: 'Part',
          share: basisPoints(share),
          dueOnStage: 'won' as const,
        })),
      },
    });
    expect(generateVerdict(check(fields)).blocks).toEqual([
      {
        check: 'tranches_not_whole',
        allocated,
        remainder,
        step: 'payment',
        fields: ['payment.tranches'],
      },
    ]);
  });
});

/*
 * A pack stored before it declared the system's supply rates starts a draft at no tax: for a
 * registered company Generate blocks rather than print a price with its tax silently left out.
 */
describe('generateVerdict — a market that declares no supply rates blocks a registered company', () => {
  const RATES_BLOCK = {
    check: 'tax_rates_undeclared',
    step: 'system',
    fields: ['system.priceInclusive'],
  };

  it.each([
    ['registered, rates declared', true, IN_PACK.tax.systemSupplyRates, false],
    ['registered, no rates declared', true, null, true],
    ['not registered, no rates declared', false, null, false],
    ['not registered, rates declared', false, IN_PACK.tax.systemSupplyRates, false],
  ] as const)('%s', (_, taxRegistered, supplyRates, blocked) => {
    const verdict = generateVerdict(check(aFieldSet(), { taxRegistered, supplyRates }));
    expect(verdict.blocks.some((block) => block.check === 'tax_rates_undeclared')).toBe(blocked);
    if (blocked) expect(verdict.blocks).toContainEqual(RATES_BLOCK);
    expect(verdict.canGenerate).toBe(!blocked);
  });
});
