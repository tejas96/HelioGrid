import {
  formatNumber,
  IN_FORMATS,
  PROPOSAL_LIMITS,
  type ProposalStep,
  type ProposalVersionSnapshot,
} from '@heliogrid/domain';
import {
  proposalBankStepWords,
  proposalClientStepWords,
  proposalCompanyStepWords,
  proposalComponentsStepWords,
  proposalFinancialsStepWords,
  proposalPartsWords,
  proposalPaymentStepWords,
  proposalPerformanceStepWords,
  proposalTermsStepWords,
  proposalTimelineStepWords,
  proposalTrackRecordStepWords,
  type Translator,
} from '@heliogrid/i18n';
import type { ProposalStepView } from '@heliogrid/ui';
import type { moneyOf } from './proposal-document-money';
import { COMPANY, CUSTOMER, MONTHLY_KWH } from './proposal-document-sample';
import type { blockWordsOf } from './proposal-document-words';

/** The sample deal's views for every step but step 3, one function a step. */
export type BuilderCase = 'drawn' | 'owner' | 'offgrid' | 'notax' | 'empty';
export const FIRST_NAME = CUSTOMER.split(' ')[0] ?? CUSTOMER;
export const OWNER = 'Suresh Kulkarni';

export interface Sample {
  readonly t: Translator['t'];
  readonly kase: BuilderCase;
  readonly acts: { onPick: () => void; onEditPhase: () => void };
  readonly snapshot: ProposalVersionSnapshot;
  readonly blocks: ReturnType<typeof blockWordsOf>;
  readonly money: ReturnType<typeof moneyOf>;
  /** Who can change the company's facts, for a viewer who cannot. */
  readonly owner: string | undefined;
}

const number = (value: number) => formatNumber(IN_FORMATS, value);
const major = (value: number | null) => (value === null ? null : value / 100);
const nothing = () => undefined;

function companyView({ t, snapshot, owner }: Sample): ProposalStepView {
  const { fields } = snapshot;
  const words = proposalCompanyStepWords(t, { name: FIRST_NAME, owner });
  return {
    step: 'company',
    words,
    proposalType: fields.company.proposalType,
    onProposalType: nothing,
    covers: (['home', 'villa', 'factory', 'society'] as const).map((key) => ({
      key,
      name: words.covers[key],
      picture: key,
    })),
    cover: 'home',
    onCover: nothing,
    facts: [
      { key: 'company', glyph: 'building', label: words.factLabels.company, value: COMPANY },
      {
        key: 'phone',
        glyph: 'phone',
        label: words.factLabels.phone,
        value: '+91 20 4120 8800',
      },
      {
        key: 'address',
        glyph: 'pin',
        label: words.factLabels.address,
        value: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
      },
    ],
  };
}

function achievementsView({ t, kase, snapshot }: Sample): ProposalStepView {
  const { fields } = snapshot;
  return {
    step: 'achievements',
    words: proposalTrackRecordStepWords(t, { where: kase === 'owner' ? 'owner' : 'other' }),
    record: fields.achievements,
    onCount: nothing,
  };
}

function performanceView({ t, snapshot, blocks }: Sample): ProposalStepView {
  const { fields, deal } = snapshot;
  return {
    step: 'performance',
    words: proposalPerformanceStepWords(t, {
      fill: 'source',
      source: 'PVGIS',
      place: deal.area?.district ?? 'Pune',
      sizeText: number(fields.system.capacityKw ?? 0),
      tolerance: 10,
      monthNames: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      edited: false,
      wants: { size: false, state: false, refused: false },
    }),
    generation:
      snapshot.generation === null
        ? null
        : { generation: snapshot.generation, tier: 'estimated', words: blocks.generation },
    fill: 'source',
    onRefill: nothing,
    efficiencyPercent: fields.performance.efficiencyPercent,
    onEfficiency: nothing,
    monthlyKwh: MONTHLY_KWH,
    onMonth: nothing,
  };
}

function financialsView({ t, snapshot, blocks, money }: Sample): ProposalStepView {
  const { fields, deal } = snapshot;
  return {
    step: 'financials',
    words: proposalFinancialsStepWords(t, { riseText: '3%', years: 25 }),
    savings:
      snapshot.savings === null
        ? null
        : {
            savings: snapshot.savings,
            money,
            monthlyBill: deal.monthlyBill,
            words: blocks.savings,
          },
    monthlyBill: major(deal.monthlyBill),
    onMonthlyBill: nothing,
    tariffPerKwh: major(fields.financials.tariffPerKwh),
    onTariff: nothing,
    tariffRisePercent: 3,
    onTariffRise: nothing,
    horizonYears: fields.financials.horizonYears,
    onHorizon: nothing,
  };
}

function timelineView({ t, acts, snapshot }: Sample): ProposalStepView {
  const { fields } = snapshot;
  return {
    step: 'timeline',
    words: proposalTimelineStepWords(t),
    phases: fields.timeline,
    onMove: nothing,
    onRemove: nothing,
    onEdit: acts.onEditPhase,
    onAdd: nothing,
    onReset: nothing,
  };
}

function paymentView({ t, snapshot, blocks, money }: Sample): ProposalStepView {
  const { fields } = snapshot;
  return {
    step: 'payment',
    words: proposalPaymentStepWords(t, { where: 'company' }),
    split: { tranches: fields.payment.tranches, amounts: money.tranches, words: blocks.split },
    plans: [
      { id: 'a', name: '10/60/20/10' },
      { id: 'b', name: '30/60/10' },
    ],
    planId: 'a',
    onPlan: nothing,
    parts: fields.payment.tranches.map((tranche, index) => ({
      key: `${tranche.label}${index}`,
      label: tranche.label,
      due: blocks.split.due(tranche.dueOnStage),
      percent: tranche.share / 100,
    })),
    onShare: nothing,
    onAdd: nothing,
    onReset: nothing,
  };
}

function componentsView({ t, kase, acts, snapshot }: Sample): ProposalStepView {
  const { fields } = snapshot;
  const components = kase === 'empty' ? [] : fields.components;
  const categories = ['panel', 'inverter', 'cable', 'electrical', 'structure'] as const;
  const picked = categories.filter((category) =>
    components.some((line) => line.category === category),
  ).length;
  return {
    step: 'components',
    words: proposalComponentsStepWords(t, {
      name: FIRST_NAME,
      picked,
      required: categories.length,
      maxBrands: PROPOSAL_LIMITS.brandsPerCategory,
    }),
    picked,
    required: categories.length,
    parts: {
      categories,
      components,
      words: proposalPartsWords(t, { schemeName: (scheme) => scheme, numberText: number }),
      onPick: acts.onPick,
    },
  };
}

function termsView({ t, kase, snapshot }: Sample): ProposalStepView {
  const { terms } = snapshot.fields;
  return {
    step: 'terms',
    words: proposalTermsStepWords(t, { estimate: { pages: 1, chars: 468 } }),
    /* The editor's own value is the same shape, writable: a copy, as the screen's hook hands it. */
    terms: JSON.parse(JSON.stringify(terms)),
    onChange: nothing,
    onCommit: nothing,
    ...(kase === 'owner' ? { onSaveAsDefault: nothing } : {}),
  };
}

function clientView({ t, kase, snapshot }: Sample): ProposalStepView {
  const { deal } = snapshot;
  const words = proposalClientStepWords(t, {
    name: FIRST_NAME,
    language: 'English',
    customersOwn: true,
  });
  return {
    step: 'client',
    words,
    name: CUSTOMER,
    phone: '+91 98220 41817',
    address: kase === 'empty' ? '' : (deal.siteAddress ?? ''),
    onAddress: nothing,
    addressMissing: kase === 'empty',
    facts: [
      { key: 'number', glyph: 'document', label: words.numberLabel, value: words.numberValue },
      {
        key: 'language',
        glyph: 'globe',
        label: words.languageLabel,
        value: words.languageValue,
      },
    ],
  };
}

function bankView({ t, kase, snapshot, blocks }: Sample): ProposalStepView {
  const bank = snapshot.company.bankDetails;
  return {
    step: 'bank',
    words: proposalBankStepWords(t, { include: true, owner: OWNER, routingLabel: 'IFSC' }),
    bank: bank === null ? null : { bank, words: blocks.bank },
    include: true,
    onInclude: nothing,
    ...(kase === 'owner' && bank !== null ? { edit: { details: bank, onDetail: nothing } } : {}),
  };
}

export const VIEW_OF: Readonly<
  Record<Exclude<ProposalStep, 'system'>, (sample: Sample) => ProposalStepView>
> = {
  company: companyView,
  achievements: achievementsView,
  performance: performanceView,
  financials: financialsView,
  timeline: timelineView,
  payment: paymentView,
  components: componentsView,
  terms: termsView,
  client: clientView,
  bank: bankView,
};
