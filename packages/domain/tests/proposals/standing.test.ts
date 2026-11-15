import { describe, expect, it } from 'vitest';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import type { ProposalFieldSet } from '../../src/proposals/field-set';
import {
  draftProgress,
  emptyCategories,
  requiredCategories,
  type StandingFacts,
  stepStandings,
} from '../../src/proposals/standing';
import { A_DEAL, aFieldSet, WAAREE, withSystem } from './proposal-fixture';

const FILLED = aFieldSet();
const TEMPLATES = {
  achievements: FILLED.achievements,
  timeline: FILLED.timeline,
  terms: FILLED.terms,
};

function facts(
  fields: ProposalFieldSet = FILLED,
  over: Partial<StandingFacts> = {},
): StandingFacts {
  return { fields, deal: A_DEAL, templates: TEMPLATES, ...over };
}

const BATTERY = {
  capacityKwh: 5,
  costInclusive: minorUnits(5_900_000),
  taxRate: basisPoints(1800),
  chemistry: 'lfp' as const,
  chemistryCustom: null,
};

describe('stepStandings — done, default or to do, never a block (T-M06-002)', () => {
  it('a filled draft on the company’s templates', () => {
    expect(stepStandings(facts())).toEqual({
      company: 'done',
      achievements: 'default',
      system: 'done',
      performance: 'done',
      financials: 'done',
      timeline: 'default',
      payment: 'default',
      components: 'done',
      terms: 'default',
      client: 'done',
      bank: 'default',
    });
  });

  it.each([
    [
      'achievements changed for this proposal',
      { achievements: { ...FILLED.achievements, happyCustomers: 350 } },
      'achievements',
      'done',
    ],
    [
      'the timeline edited',
      { timeline: [{ name: 'Visit', description: 'We come.', durationDays: 1 }] },
      'timeline',
      'done',
    ],
    [
      'a timeline step with no name',
      { timeline: [{ name: ' ', description: 'We come.', durationDays: 1 }] },
      'timeline',
      'to_do',
    ],
    ['no timeline step at all', { timeline: [] }, 'timeline', 'to_do'],
    ['the terms rewritten', { terms: richTextParagraphs(['Our own terms.']) }, 'terms', 'done'],
    [
      'payment rows edited away from the template',
      { payment: { ...FILLED.payment, templateId: null } },
      'payment',
      'done',
    ],
    [
      'payment parts short of the whole',
      { payment: { templateId: 'tpl-1', tranches: FILLED.payment.tranches.slice(1) } },
      'payment',
      'to_do',
    ],
    [
      'a payment part with no name',
      {
        payment: {
          templateId: null,
          tranches: FILLED.payment.tranches.map((tranche) => ({ ...tranche, label: '' })),
        },
      },
      'payment',
      'to_do',
    ],
    ['a category with no brand', { components: [WAAREE] }, 'components', 'to_do'],
    [
      'bank details switched off for this proposal',
      { bank: { includeInProposal: false } },
      'bank',
      'done',
    ],
    [
      'no tariff',
      { financials: { ...FILLED.financials, tariffPerKwh: null } },
      'financials',
      'to_do',
    ],
    [
      'no generation yet',
      { performance: { ...FILLED.performance, yieldPerKwp: null } },
      'performance',
      'to_do',
    ],
    [
      'the person’s own month figures stand without the source',
      {
        performance: {
          ...FILLED.performance,
          yieldPerKwp: null,
          editedMonthlyKwh: Array.from({ length: 12 }, () => 300),
        },
      },
      'performance',
      'done',
    ],
    [
      'efficiency out of its range',
      { performance: { ...FILLED.performance, efficiencyPercent: 101 } },
      'performance',
      'to_do',
    ],
  ] as const)('%s', (_, over, step, standing) => {
    expect(stepStandings(facts(aFieldSet(over)))[step]).toBe(standing);
  });

  it.each([
    ['no size', { capacityKw: null }, 'to_do'],
    ['a size under the least', { capacityKw: 0.4 }, 'to_do'],
    ['the least size', { capacityKw: 0.5 }, 'done'],
    ['the greatest size', { capacityKw: 7000 }, 'done'],
    ['no price', { priceInclusive: null }, 'to_do'],
    ['a price of nothing', { priceInclusive: minorUnits(0) }, 'to_do'],
    ['off-grid with no battery', { systemType: 'off_grid' as const }, 'to_do'],
    ['off-grid with its battery', { systemType: 'off_grid' as const, battery: BATTERY }, 'done'],
  ])('step 3 — %s', (_, system, standing) => {
    expect(stepStandings(facts(withSystem(system))).system).toBe(standing);
  });

  it.each([
    ['no site address', { siteAddress: null }],
    ['a blank site address', { siteAddress: '  ' }],
    ['no area', { area: null }],
  ])('step 10 — %s is to do', (_, deal) => {
    expect(stepStandings(facts(FILLED, { deal: { ...A_DEAL, ...deal } })).client).toBe('to_do');
  });
});

describe('draftProgress — "Proposal draft — n/11" (M06-25)', () => {
  it('a default in place counts as complete, hidden steps included', () => {
    expect(draftProgress(facts())).toEqual({ complete: 11, of: 11 });
  });

  it('a draft just started', () => {
    const fresh = aFieldSet({
      components: [],
      financials: { ...FILLED.financials, tariffPerKwh: null },
      performance: { ...FILLED.performance, yieldPerKwp: null },
      system: { ...FILLED.system, priceInclusive: null },
    });
    expect(draftProgress(facts(fresh, { deal: { ...A_DEAL, siteAddress: null } }))).toEqual({
      complete: 6,
      of: 11,
    });
  });
});

describe('the categories a proposal must fill (M06-27)', () => {
  it('five, and six once the system holds a battery', () => {
    expect(requiredCategories(FILLED)).toEqual([
      'panel',
      'inverter',
      'cable',
      'electrical',
      'structure',
    ]);
    expect(requiredCategories(withSystem({ battery: BATTERY }))).toEqual([
      'panel',
      'inverter',
      'cable',
      'electrical',
      'structure',
      'battery',
    ]);
  });

  it('names the ones with no brand', () => {
    expect(emptyCategories(aFieldSet({ components: [WAAREE] }))).toEqual([
      'inverter',
      'cable',
      'electrical',
      'structure',
    ]);
    expect(emptyCategories(FILLED)).toEqual([]);
  });
});
