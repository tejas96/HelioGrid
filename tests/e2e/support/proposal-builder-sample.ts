import {
  formatMinorUnitsPlainly,
  IN_FORMATS,
  type MinorUnits,
  PROPOSAL_STEPS,
  type ProposalStep,
  type ProposalVersionSnapshot,
  QUICK_STEPS,
  type StepStanding,
} from '@heliogrid/domain';
import {
  proposalBatteryNoticeWords,
  proposalNoTaxNoticeWords,
  proposalStepNames,
  proposalSystemStepWords,
  type Translator,
} from '@heliogrid/i18n';
import type { BuilderStep, ProposalStepView } from '@heliogrid/ui';
import {
  type BuilderCase,
  FIRST_NAME,
  OWNER,
  type Sample,
  VIEW_OF,
} from './proposal-builder-views';
import { moneyOf } from './proposal-document-money';
import { SNAPSHOT, TAX_NAME } from './proposal-document-sample';
import { blockWordsOf } from './proposal-document-words';

/** The sample deal as a builder's hook assembles it: one view a step, over the document's sample. */
export { type BuilderCase, FIRST_NAME, OWNER } from './proposal-builder-views';

const amount = (value: MinorUnits) => formatMinorUnitsPlainly(IN_FORMATS, value);
const major = (value: MinorUnits | null) => (value === null ? null : value / 100);
const nothing = () => undefined;

/* The steps' glyphs, as `PROPOSAL_STEP_GLYPH` holds them: a spec's process reads no value from the ui package. */
const GLYPH: Readonly<Record<ProposalStep, BuilderStep['glyph']>> = {
  company: 'building',
  achievements: 'star',
  system: 'solar-panel',
  performance: 'sun',
  financials: 'trend-up',
  timeline: 'calendar-clock',
  payment: 'wallet',
  components: 'package',
  terms: 'file-text',
  client: 'person',
  bank: 'credit-card',
};

const STANDING: Readonly<Record<ProposalStep, StepStanding>> = {
  company: 'done',
  achievements: 'default',
  system: 'done',
  performance: 'done',
  financials: 'done',
  timeline: 'default',
  payment: 'default',
  components: 'to_do',
  terms: 'default',
  client: 'done',
  bank: 'default',
};

/** Every step as the frame draws it; `quick` marks the ones Quick mode hides. */
export function builderSteps(t: Translator['t'], quick: boolean): BuilderStep[] {
  const names = proposalStepNames(t);
  return PROPOSAL_STEPS.map((step) => ({
    key: step,
    title: names[step].title,
    heading: names[step].heading,
    summary: names[step].title,
    glyph: GLYPH[step],
    standing: STANDING[step],
    quiet: quick && !QUICK_STEPS.includes(step),
  }));
}

function systemView(t: Translator['t'], kase: BuilderCase, snapshot: ProposalVersionSnapshot) {
  const { system } = snapshot.fields;
  const owner = kase === 'owner';
  const taxed = kase !== 'notax';
  const money = moneyOf(owner ? 'owner' : taxed ? 'drawn' : 'noTax');
  const systemType = kase === 'offgrid' ? 'off_grid' : system.systemType;
  const words = proposalSystemStepWords(t, {
    name: FIRST_NAME,
    taxName: TAX_NAME,
    taxRateText: '8.9%',
    taxRegistered: taxed,
    owner: owner ? undefined : OWNER,
    preTaxText: amount(money.preTax),
    incentive:
      kase === 'offgrid'
        ? undefined
        : {
            name: 'PM Surya Ghar subsidy',
            scheme: 'DCR',
            amountText: '₹78,000',
            paidTo: 'customer',
            claimed: true,
          },
    sanctionedLoadText: '5',
    supplyPhase: 'single',
    maintenance: { kind: 'none', years: null },
    ourCostText: owner ? '₹1,40,000' : undefined,
  });
  const notice = proposalBatteryNoticeWords(t, 'off_grid');
  const noTax = proposalNoTaxNoticeWords(t, { taxName: TAX_NAME, owner: OWNER });
  return {
    step: 'system',
    words,
    price: { money, words: blockWordsOf(t, 'builder', snapshot).price },
    capacityKw: system.capacityKw,
    onCapacity: nothing,
    systemType,
    onSystemType: nothing,
    ...(kase === 'offgrid'
      ? {
          batteryNotice: {
            tone: notice.tone,
            title: notice.title,
            line: notice.line,
            act: { label: notice.act, onPress: nothing },
          },
        }
      : {}),
    priceInclusive: major(system.priceInclusive),
    onPrice: nothing,
    ...(taxed ? {} : { noTax }),
    discount: { mode: 'amount', value: null },
    onDiscount: nothing,
    ...(kase === 'offgrid' ? {} : { incentive: { claimed: true, onClaimed: nothing } }),
    sanctionedLoadKw: 5,
    onSanctionedLoad: nothing,
    segment: 'residential',
    onSegment: nothing,
    supplyPhase: 'single',
    onSupplyPhase: nothing,
    maintenance: { kind: 'none', years: null },
    onMaintenance: nothing,
    emi: null,
    onEmi: nothing,
    emiTypical: { ratePercent: 9.5, tenureYears: 5 },
    battery: null,
    onBattery: nothing,
    ...(owner ? { ourCost: { value: 140000, onCost: nothing } } : {}),
  } satisfies ProposalStepView;
}

/** One step's view over the sample deal. */
export function stepView(
  t: Translator['t'],
  step: ProposalStep,
  kase: BuilderCase,
  acts: Sample['acts'],
): ProposalStepView {
  if (step === 'system') return systemView(t, kase, SNAPSHOT);
  return VIEW_OF[step]({
    t,
    kase,
    acts,
    snapshot: SNAPSHOT,
    blocks: blockWordsOf(t, 'builder', SNAPSHOT),
    money: moneyOf(kase === 'owner' ? 'owner' : 'drawn'),
    owner: kase === 'owner' ? undefined : OWNER,
  });
}
