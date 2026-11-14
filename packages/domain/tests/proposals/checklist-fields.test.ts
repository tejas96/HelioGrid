import { describe, expect, it } from 'vitest';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { generateVerdict } from '../../src/proposals/checklist';
import type { ComponentLine } from '../../src/proposals/field-set';
import {
  A_DEAL,
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

describe('generateVerdict — (e) every required field, on its own step (M06-23)', () => {
  const blank = aFieldSet();
  it.each([
    [
      'no size',
      withSystem({ capacityKw: null, incentiveClaimed: false }),
      {},
      'system.capacityKw',
      'system',
    ],
    ['a size under 0.5 kW', withSystem({ capacityKw: 0.4 }), {}, 'system.capacityKw', 'system'],
    [
      'a size over 7000 kW',
      withSystem({ capacityKw: 7000.5, incentiveClaimed: false }),
      {},
      'system.capacityKw',
      'system',
    ],
    ['no price', withSystem({ priceInclusive: null }), {}, 'system.priceInclusive', 'system'],
    [
      'an EMI with no tenure',
      withSystem({ emi: { rate: basisPoints(950), tenureYears: 0 } }),
      {},
      'system.emi',
      'system',
    ],
    [
      'efficiency under 50',
      aFieldSet({ performance: { ...blank.performance, efficiencyPercent: 49 } }),
      {},
      'performance.efficiencyPercent',
      'performance',
    ],
    [
      'no generation filled',
      aFieldSet({ performance: { ...blank.performance, yieldPerKwp: null } }),
      {},
      'performance.generation',
      'performance',
    ],
    [
      'no tariff',
      aFieldSet({ financials: { ...blank.financials, tariffPerKwh: null } }),
      {},
      'financials.tariffPerKwh',
      'financials',
    ],
    [
      'a tariff over ₹50',
      aFieldSet({ financials: { ...blank.financials, tariffPerKwh: minorUnits(5001) } }),
      {},
      'financials.tariffPerKwh',
      'financials',
    ],
    [
      'a horizon of nothing',
      aFieldSet({ financials: { ...blank.financials, horizonYears: 0 } }),
      {},
      'financials.horizonYears',
      'financials',
    ],
    ['no timeline', aFieldSet({ timeline: [] }), {}, 'timeline', 'timeline'],
    [
      'a timeline step with no sentence',
      aFieldSet({ timeline: [{ name: 'Survey', description: ' ', durationDays: null }] }),
      {},
      'timeline',
      'timeline',
    ],
    ['no terms', aFieldSet({ terms: { version: 1, blocks: [] } }), {}, 'terms', 'terms'],
    ['no segment on the lead', blank, { segment: null }, 'deal.segment', 'system'],
    [
      'no area on the lead — its State field is on Client',
      blank,
      { area: null },
      'deal.area',
      'client',
    ],
    ['no customer name', blank, { clientName: '' }, 'deal.clientName', 'client'],
    ['a phone the pack refuses', blank, { clientPhoneValid: false }, 'deal.clientPhone', 'client'],
    ['no site address', blank, { siteAddress: null }, 'deal.siteAddress', 'client'],
  ])('%s', (_, fields, deal, field, step) => {
    const verdict = generateVerdict(check(fields, { deal: { ...A_DEAL, ...deal } }));
    expect(verdict.blocks).toContainEqual({ check: 'field_missing', field, step, fields: [field] });
    expect(verdict.canGenerate).toBe(false);
  });

  it('a payment part with no name is named on step 7', () => {
    const fields = aFieldSet();
    const unnamed = {
      ...fields,
      payment: {
        templateId: null,
        tranches: fields.payment.tranches.map((tranche, index) =>
          index === 0 ? { ...tranche, label: '' } : tranche,
        ),
      },
    };
    expect(generateVerdict(check(unnamed)).blocks).toEqual([
      {
        check: 'field_missing',
        field: 'payment.tranches',
        step: 'payment',
        fields: ['payment.tranches'],
      },
    ]);
  });

  it('a battery out of its range, or with no cost, is named on step 3', () => {
    const battery = {
      capacityKwh: 101,
      costInclusive: null,
      taxRate: basisPoints(1800),
      chemistry: 'lfp' as const,
      chemistryCustom: null,
    };
    const fields = withSystem({ battery });
    const named = generateVerdict(check(fields)).blocks.flatMap((block) =>
      block.check === 'field_missing' ? [block.field] : [],
    );
    expect(named).toEqual(['system.battery.capacityKwh', 'system.battery.costInclusive']);
  });
});

describe('generateVerdict — (f) the incentive path’s certification check (M06-23, F1-34)', () => {
  const PLAIN_PANEL: ComponentLine = { ...WAAREE, brand: 'Adani', certifications: [] };

  it('a DCR panel and a non-DCR panel: the non-DCR brand fails by name', () => {
    const verdict = generateVerdict(check(withComponents([WAAREE, PLAIN_PANEL, ...others])));
    expect(verdict.blocks).toEqual([
      {
        check: 'scheme_unmet',
        category: 'panel',
        brand: 'Adani',
        scheme: 'DCR',
        step: 'components',
        fields: ['components'],
      },
    ]);
  });

  it('no inverter, cable, electrical or structure line is read against the scheme', () => {
    expect(generateVerdict(check()).blocks).toEqual([]);
  });

  it('leaving the incentive path lifts the check', () => {
    const fields = {
      ...withSystem({ incentiveClaimed: false }),
      components: [PLAIN_PANEL, ...others],
    };
    expect(generateVerdict(check(fields)).blocks).toEqual([]);
  });

  it('a commercial deal is never on the path', () => {
    const fields = withComponents([PLAIN_PANEL, ...others]);
    expect(
      generateVerdict(check(fields, { deal: { ...A_DEAL, segment: 'commercial' } })).blocks,
    ).toEqual([]);
  });
});

describe('generateVerdict — no figure borrows a design’s tier (F8-21)', () => {
  it.each(['derived', 'measured'] as const)(
    'a %s line on a document with no design is refused',
    (tier) => {
      const verdict = generateVerdict(check(withComponents([{ ...WAAREE, tier }, ...others])));
      expect(verdict.blocks).toEqual([
        {
          check: 'tier_unfit',
          category: 'panel',
          brand: 'Waaree',
          tier,
          step: 'components',
          fields: ['components'],
        },
      ]);
    },
  );

  it('the same line stands once a design is behind the document', () => {
    const fields = withComponents([{ ...WAAREE, tier: 'derived' }, ...others]);
    expect(
      generateVerdict(check(fields, { basis: { designed: true, roofTier: 'measured' } })).blocks,
    ).toEqual([]);
  });
});

describe('generateVerdict — below cost warns, with the loss, and never blocks (M06-37)', () => {
  const below = withSystem({ ourCost: minorUnits(18_000_000) });

  it('a holder of the cost grant reads the loss', () => {
    const verdict = generateVerdict(check(below));
    expect(verdict.warnings).toEqual([
      {
        check: 'below_cost',
        loss: 500_000,
        step: 'system',
        fields: ['system.priceInclusive', 'system.discount'],
      },
    ]);
    expect(verdict.canGenerate).toBe(true);
  });

  it('anyone else reads that it is below cost, and no figure', () => {
    expect(generateVerdict(check(below, { viewerSeesCost: false })).warnings).toEqual([
      {
        check: 'below_cost',
        loss: null,
        step: 'system',
        fields: ['system.priceInclusive', 'system.discount'],
      },
    ]);
  });

  it('at cost, and above it, nothing is said', () => {
    expect(
      generateVerdict(check(withSystem({ ourCost: minorUnits(17_500_000) }))).warnings,
    ).toEqual([]);
  });

  it('a payable at or below zero is the block’s to state, not this warning’s', () => {
    const fields = withSystem({ priceInclusive: minorUnits(0), ourCost: minorUnits(100) });
    expect(generateVerdict(check(fields)).warnings).toEqual([]);
  });
});
