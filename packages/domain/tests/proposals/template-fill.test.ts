import { describe, expect, it } from 'vitest';
import type { EffectiveSettings } from '../../src/commerce/effective-settings';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import { IN_PROPOSAL_FACTS } from '../../src/format/proposal-facts';
import { IN_PACK } from '../../src/market/pack';
import { basisPoints } from '../../src/money/basis-points';
import {
  newDraftFieldSet,
  paymentFromTemplate,
  type TemplateFillInput,
  templateFilledSteps,
  timelineFromTemplate,
} from '../../src/proposals/template-fill';

const TERMS = richTextParagraphs(['Valid for 30 days.']);
const PHASES = [{ name: 'Survey', description: 'We visit and measure.' }];
const SPLIT = {
  id: 'tpl-1',
  name: '10/60/20/10',
  lines: [
    { label: 'Advance', share: basisPoints(1000), dueOnStage: 'won' as const },
    { label: 'Rest', share: basisPoints(9000), dueOnStage: 'commissioned' as const },
  ],
};

const SETTINGS: TemplateFillInput['settings'] = {
  proposalTemplate: {
    source: 'tenant',
    value: {
      cover: {
        aboutCompany: 'Since 2011',
        totalCapacityInstalledKw: 200,
        happyCustomers: 350,
        citiesServed: 10,
      },
      sectionsIncluded: [],
      defaultTerms: TERMS,
    },
  },
  timelineTemplate: { source: 'tenant', value: { phases: PHASES } },
  defaultTrancheTemplate: { source: 'tenant', value: SPLIT },
} satisfies Pick<
  EffectiveSettings,
  'proposalTemplate' | 'timelineTemplate' | 'defaultTrancheTemplate'
>;

function input(over: Partial<TemplateFillInput> = {}): TemplateFillInput {
  return {
    settings: SETTINGS,
    coverPicture: null,
    typicalSystemKwp: null,
    subsidy: IN_PACK.subsidy,
    supplyRates: IN_PACK.tax.systemSupplyRates,
    market: IN_PROPOSAL_FACTS,
    segment: 'residential',
    ...over,
  };
}

describe('newDraftFieldSet — the company’s templates, else the platform’s, read once (M06-49)', () => {
  const draft = newDraftFieldSet(input());

  it('steps 2, 6, 7 and 9 hold the settings in force; bank details print by default', () => {
    expect(draft.achievements).toBe(SETTINGS.proposalTemplate.value.cover);
    expect(draft.timeline).toEqual([
      { name: 'Survey', description: 'We visit and measure.', durationDays: null },
    ]);
    expect(draft.payment).toEqual({ templateId: 'tpl-1', tranches: SPLIT.lines });
    expect(draft.terms).toBe(TERMS);
    expect(draft.bank).toEqual({ includeInProposal: true });
  });

  it('nothing is pre-filled beyond that: no price, no parts, no generation (M06-02)', () => {
    expect(draft.system).toMatchObject({
      capacityKw: null,
      systemType: 'on_grid',
      battery: null,
      priceInclusive: null,
      discount: null,
      emi: null,
      ourCost: null,
      taxRate: 890,
    });
    expect(draft.components).toEqual([]);
    expect(draft.performance).toMatchObject({
      efficiencyPercent: 80,
      yieldPerKwp: null,
      source: null,
    });
  });

  it('the market’s starting figures stand until the person changes them', () => {
    expect(draft.financials).toEqual({ tariffPerKwh: 950, tariffRise: 300, horizonYears: 25 });
  });

  it('starts on the platform’s first cover until the company picks its own', () => {
    expect(draft.company).toEqual({
      proposalType: 'customer_owns',
      coverPicture: { kind: 'platform', key: 'home' },
    });
    expect(
      newDraftFieldSet(input({ coverPicture: { kind: 'own', fileId: 'file-1' } })).company
        .coverPicture,
    ).toEqual({ kind: 'own', fileId: 'file-1' });
  });

  it.each([
    ['a home lead: on, the incentive is offered', 'residential', true],
    ['a business lead: off, none is offered', 'commercial', false],
    ['no segment yet: off', null, false],
  ] as const)('the incentive switch — %s', (_, segment, claimed) => {
    expect(newDraftFieldSet(input({ segment })).system.incentiveClaimed).toBe(claimed);
  });

  it.each([
    ['the size the company usually sells', 5, 5],
    ['the least size', 0.5, 0.5],
    ['a size under the least is not a start', 0.4, null],
    ['a size over the greatest is not a start', 7001, null],
    ['none said', null, null],
  ])('the size starts on %s', (_, typical, capacityKw) => {
    expect(newDraftFieldSet(input({ typicalSystemKwp: typical })).system.capacityKw).toBe(
      capacityKw,
    );
  });

  it('a pack stored before proposals leaves the tariff and the rate to be typed', () => {
    const bare = newDraftFieldSet(input({ market: null, supplyRates: null }));
    expect(bare.financials).toEqual({ tariffPerKwh: null, tariffRise: 0, horizonYears: 0 });
    expect(bare.system.taxRate).toBe(0);
  });

  it('a company with no cover of its own prints none of its figures', () => {
    const settings = {
      ...SETTINGS,
      proposalTemplate: {
        source: 'platform' as const,
        value: { ...SETTINGS.proposalTemplate.value, cover: null },
      },
    };
    expect(newDraftFieldSet(input({ settings })).achievements).toEqual({
      aboutCompany: null,
      totalCapacityInstalledKw: null,
      happyCustomers: null,
      citiesServed: null,
    });
  });
});

describe('the reset targets (M06-12, M06-13)', () => {
  it('step 6 returns to the template’s phases, with no duration stated', () => {
    expect(timelineFromTemplate(PHASES)).toEqual([{ ...PHASES[0], durationDays: null }]);
  });

  it('step 7 returns to a named template’s rows', () => {
    expect(paymentFromTemplate(SPLIT)).toEqual({ templateId: 'tpl-1', tranches: SPLIT.lines });
    expect(paymentFromTemplate({ ...SPLIT, id: null }).templateId).toBeNull();
  });

  it('what the templates gave is what a step’s default standing is read against', () => {
    expect(templateFilledSteps(input())).toEqual({
      achievements: SETTINGS.proposalTemplate.value.cover,
      timeline: timelineFromTemplate(PHASES),
      terms: TERMS,
    });
  });
});
