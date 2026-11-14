import type { TranslatedText } from '@heliogrid/contracts';
import { FIGURE_SLOT, type ProjectChainStage, type ProposalType } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { wordsAroundFigure } from './assembled';
import { type ProposalPartsFacts, proposalPartsWords } from './proposal-parts';

/**
 * The words of the proposal's blocks (`packages/ui`'s `ProposalBlocks`), authored once for the
 * builder, the document, the customer's page and Proposal defaults. One voice at a time: the
 * person building is told what the customer does, and the customer is spoken to directly. Every
 * figure arrives as the text the server sent; a tax's, a season's and a scheme's name are the
 * market pack's, never a word of this catalog (`F1-13`, `F1-22`). kW and kWh are never translated.
 */

type T = Translator['t'];

/* The parts' words leave through this module, as the blocks' own do through the pages'. */
export * from './proposal-parts';

/** Who the words speak to: the person building the proposal, or the customer reading it. */
export type ProposalVoice = 'builder' | 'customer';

const PRICE = {
  overline: /*i18n*/ { id: 'Your investment' },
  overlineBuilder: /*i18n*/ { id: '{name} pays you' },
  aboveZero: /*i18n*/ { id: 'The price must be above zero' },
  includesTax: /*i18n*/ { id: 'Includes {tax} {amount}' },
  noTax: /*i18n*/ { id: 'No {tax}. {company} is not registered for {tax}.' },
  discount: /*i18n*/ { id: 'discount {amount}' },
  perKw: /*i18n*/ { id: '{amount} per kW' },
  incentive: /*i18n*/ { id: 'Government subsidy, paid to you' },
  incentiveBuilder: /*i18n*/ { id: 'Subsidy to {name}' },
  netCost: /*i18n*/ { id: 'Your net cost after subsidy' },
  netCostBuilder: /*i18n*/ { id: 'Net after subsidy' },
  margin: /*i18n*/ { id: 'Margin {amount} · {percent}' },
  loss: /*i18n*/ { id: 'Loss {amount} · {percent}' },
  onlyYou: /*i18n*/ { id: 'Only you see this' },
} as const;

const GENERATION = {
  overline: /*i18n*/ { id: 'Your system will generate' },
  overlineBuilder: /*i18n*/ { id: 'It will generate' },
  perYear: /*i18n*/ { id: 'kWh a year' },
  at: /*i18n*/ { id: '{source} · {place}' },
  chart: /*i18n*/ { id: 'Generation by month, highest in {month}' },
  average: /*i18n*/ { id: 'About {units} units a month.' },
  averageWithSeason: /*i18n*/ {
    id: 'About {units} units a month. {season} months give less; that is normal.',
  },
} as const;

const SAVINGS = {
  overline: /*i18n*/ { id: 'What you save' },
  overlineBuilder: /*i18n*/ { id: 'It will save' },
  perMonth: /*i18n*/ { id: 'a month' },
  billToday: /*i18n*/ { id: 'Bill today' },
  billWithSolar: /*i18n*/ { id: 'With solar' },
  chart: /*i18n*/ { id: 'Savings pass the net cost after {years} years' },
  chartNoPayback: /*i18n*/ { id: 'Savings adding up year by year, against the net cost' },
  netCost: /*i18n*/ { id: 'Net cost {amount}' },
  year: /*i18n*/ { id: 'Year {year}' },
  paybackValue: /*i18n*/ { id: '{years} years' },
  /** The caption under the payback figure; `{payback}` is that figure, drawn apart above it. */
  paybackLabel: /*i18n*/ { id: '{payback} to pay for itself' },
  lifetimeLabel: /*i18n*/ { id: 'saved in {years} years' },
  yearlyLabel: /*i18n*/ { id: 'saved each year' },
  projection: /*i18n*/ {
    id: 'A projection: tariff {tariff} a unit, rising {rise} a year. Savings never exceed your bill.',
  },
} as const;

const EMI = {
  monthlyYears: /*i18n*/ {
    id: 'a month for {years, plural, one {# year} other {# years}}',
  },
  monthlyMonths: /*i18n*/ { id: 'a month for {months} months' },
  savingLabel: /*i18n*/ { id: 'your saving a month' },
  savingLabelBuilder: /*i18n*/ { id: 'saved a month' },
  projection: /*i18n*/ {
    id: 'A projection at {rate} a year for {months} months. This is an example, not a loan offer. A bank decides the loan.',
  },
} as const;

const SPLIT = {
  overline: /*i18n*/ { id: 'You pay in parts, as the work moves' },
  overlineBuilder: /*i18n*/ {
    id: '{name} pays in {count, plural, one {# part} other {# parts}}',
  },
  under: /*i18n*/ { id: '{percent} not allocated' },
  over: /*i18n*/ { id: '{percent} too much' },
  chart: /*i18n*/ { id: 'The payment plan, part by part' },
} as const;

/** When a part falls due, said to the customer; a `Record` over the chain, so a new stage fails here. */
const SPLIT_DUE: Record<ProjectChainStage, { id: string }> = {
  won: /*i18n*/ { id: 'On signing' },
  material_ordered: /*i18n*/ { id: 'When the material is ordered' },
  dispatched: /*i18n*/ { id: 'Before dispatch' },
  installation: /*i18n*/ { id: 'On installation' },
  electrical_metering: /*i18n*/ { id: 'When the meter is fitted' },
  utility_inspection: /*i18n*/ { id: 'After the utility inspection' },
  commissioned: /*i18n*/ { id: 'On commissioning' },
  incentive_claimed: /*i18n*/ { id: 'When the incentive claim is filed' },
  handed_over: /*i18n*/ { id: 'At handover' },
};

const TIMELINE = {
  days: /*i18n*/ { id: '{days, plural, one {# day} other {# days}}' },
} as const;

const RECORD = {
  installedKw: /*i18n*/ { id: 'kW installed' },
  customers: /*i18n*/ { id: 'happy customers' },
  cities: /*i18n*/ { id: 'cities served' },
} as const;

const COMPANY = {
  proposalOverline: /*i18n*/ { id: 'Solar proposal' },
  draft: /*i18n*/ { id: 'Draft' },
  owns: /*i18n*/ { id: 'You own the system' },
  paysForPower: /*i18n*/ { id: 'You pay for the power' },
  ownsBuilder: /*i18n*/ { id: '{name} owns the system' },
  paysForPowerBuilder: /*i18n*/ { id: '{name} pays for power' },
} as const;

const TERMS = {
  logoLabel: /*i18n*/ { id: 'Company logo' },
} as const;

const BANK = {
  account: /*i18n*/ { id: 'A/c {number}' },
  notPrinted: /*i18n*/ { id: 'Saved · not printed' },
} as const;

/** What the blocks' words are built over: who reads them, and the names a sentence holds. */
export interface ProposalBlockFacts extends ProposalPartsFacts {
  readonly voice: ProposalVoice;
  /** The customer's first name, as the person building reads it. */
  readonly customerName: string;
  readonly companyName: string;
  /** The tax's name, from the market pack — `GST`. */
  readonly taxName: string;
  /** The basis line the document carries (`disclosureLine`); absent where it carries none. */
  readonly basis?: TranslatedText;
  /** The energy source label (`energySourceLabel`), and the place it was read for. */
  readonly energySource?: TranslatedText;
  readonly energyPlace?: string;
  /** The market's low-generation season, from the pack — `Monsoon`. */
  readonly seasonName?: string;
  /** The savings projection's stated assumptions, each as the format prints it. */
  readonly tariffText: string;
  readonly tariffRiseText: string;
  /** The EMI example's stated assumptions. */
  readonly emiRateText: string;
  readonly emiMonths: number;
  /** How many parts the payment plan has. */
  readonly splitParts: number;
  readonly proposalType: ProposalType;
}

const MONTHS_IN_YEAR = 12;

function ownershipWords(t: T, facts: ProposalBlockFacts, builder: boolean): TranslatedText {
  const name = facts.customerName;
  if (facts.proposalType === 'customer_owns') {
    return builder ? t(COMPANY.ownsBuilder, { name }) : t(COMPANY.owns);
  }
  return builder ? t(COMPANY.paysForPowerBuilder, { name }) : t(COMPANY.paysForPower);
}

/**
 * Every word the proposal's blocks say of their own, for one voice — named as each block's `words`
 * takes them. The customer's set is also the document's (`ProposalDocumentBlockWords`).
 */
export function proposalBlockWords(t: T, facts: ProposalBlockFacts) {
  const builder = facts.voice === 'builder';
  const name = facts.customerName;
  const tax = facts.taxName;
  return {
    price: {
      overline: builder ? t(PRICE.overlineBuilder, { name }) : t(PRICE.overline),
      aboveZero: t(PRICE.aboveZero),
      includesTax: (amount: string) => t(PRICE.includesTax, { tax, amount }),
      noTax: t(PRICE.noTax, { tax, company: facts.companyName }),
      discount: (amount: string) => t(PRICE.discount, { amount }),
      perKw: (amount: string) => t(PRICE.perKw, { amount }),
      incentive: builder ? t(PRICE.incentiveBuilder, { name }) : t(PRICE.incentive),
      netCost: builder ? t(PRICE.netCostBuilder) : t(PRICE.netCost),
      margin: (amount: string, percent: string) => t(PRICE.margin, { amount, percent }),
      loss: (amount: string, percent: string) => t(PRICE.loss, { amount, percent }),
      onlyYou: t(PRICE.onlyYou),
      basis: facts.basis,
    },
    generation: {
      overline: builder ? t(GENERATION.overlineBuilder) : t(GENERATION.overline),
      perYear: t(GENERATION.perYear),
      source:
        facts.energySource === undefined || facts.energyPlace === undefined
          ? facts.energySource
          : t(GENERATION.at, { source: facts.energySource, place: facts.energyPlace }),
      chart: (month: string) => t(GENERATION.chart, { month }),
      average: (units: string) =>
        facts.seasonName === undefined
          ? t(GENERATION.average, { units })
          : t(GENERATION.averageWithSeason, { units, season: facts.seasonName }),
    },
    savings: {
      overline: builder ? t(SAVINGS.overlineBuilder) : t(SAVINGS.overline),
      perMonth: t(SAVINGS.perMonth),
      billToday: t(SAVINGS.billToday),
      billWithSolar: t(SAVINGS.billWithSolar),
      chart: (years: string) => t(SAVINGS.chart, { years }),
      chartNoPayback: t(SAVINGS.chartNoPayback),
      netCost: (amount: string) => t(SAVINGS.netCost, { amount }),
      firstYear: t(SAVINGS.year, { year: 1 }),
      lastYear: (years: number) => t(SAVINGS.year, { year: years }),
      paybackValue: (years: string) => t(SAVINGS.paybackValue, { years }),
      paybackLabel: wordsAroundFigure(t(SAVINGS.paybackLabel, { payback: FIGURE_SLOT })),
      lifetimeLabel: (years: number) => t(SAVINGS.lifetimeLabel, { years }),
      yearlyLabel: t(SAVINGS.yearlyLabel),
      projection: t(SAVINGS.projection, { tariff: facts.tariffText, rise: facts.tariffRiseText }),
    },
    emi: {
      monthlyLabel: (months: number) =>
        months % MONTHS_IN_YEAR === 0
          ? t(EMI.monthlyYears, { years: months / MONTHS_IN_YEAR })
          : t(EMI.monthlyMonths, { months }),
      savingLabel: builder ? t(EMI.savingLabelBuilder) : t(EMI.savingLabel),
      projection: t(EMI.projection, { rate: facts.emiRateText, months: facts.emiMonths }),
    },
    split: {
      overline: builder
        ? t(SPLIT.overlineBuilder, { name, count: facts.splitParts })
        : t(SPLIT.overline),
      under: (percent: string) => t(SPLIT.under, { percent }),
      over: (percent: string) => t(SPLIT.over, { percent }),
      chart: t(SPLIT.chart),
      due: (stage: ProjectChainStage) => t(SPLIT_DUE[stage]),
    },
    parts: proposalPartsWords(t, facts),
    timeline: { days: (days: number) => t(TIMELINE.days, { days }) },
    record: {
      installedKw: t(RECORD.installedKw),
      customers: t(RECORD.customers),
      cities: t(RECORD.cities),
    },
    company: {
      proposalOverline: t(COMPANY.proposalOverline),
      draft: t(COMPANY.draft),
      type: ownershipWords(t, facts, builder),
    },
    terms: { logoLabel: t(TERMS.logoLabel) },
    bank: {
      account: (number: string) => t(BANK.account, { number }),
      notPrinted: t(BANK.notPrinted),
    },
  };
}

export type ProposalBlockWords = ReturnType<typeof proposalBlockWords>;
