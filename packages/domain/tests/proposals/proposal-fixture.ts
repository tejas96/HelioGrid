import { richTextParagraphs } from '../../src/commerce/rich-text';
import { IN_PROPOSAL_FACTS } from '../../src/format/proposal-facts';
import { IN_PACK } from '../../src/market/pack';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import type { GenerateCheckInput } from '../../src/proposals/checklist';
import type {
  ComponentLine,
  ProposalCompanyFacts,
  ProposalDealFacts,
  ProposalFieldSet,
} from '../../src/proposals/field-set';
import { type ProposalMoneyInput, proposalMoney } from '../../src/proposals/money';

/** A seed two suites share: it asserts nothing, so proofs of one proposal cannot drift. */

/** `M06-35`'s own case: ₹1,75,000 before tax, ₹15,575 of tax, typed as ₹1,90,575. */
export const PRICE_TYPED = minorUnits(19_057_500);

type LineOf<Category extends ComponentLine['category']> = Extract<
  ComponentLine,
  { category: Category }
>;

const BASE_LINE = {
  description: null,
  count: null,
  source: 'platform_item',
  catalogItemId: null,
  savedPartId: null,
  tier: 'assumed',
  certifications: [],
} as const;

export const WAAREE: LineOf<'panel'> = {
  ...BASE_LINE,
  category: 'panel',
  brand: 'Waaree',
  count: 6,
  wattPeak: 500,
  technology: 'topcon',
  warranty: '25 years',
  certifications: [{ scheme: 'DCR', reference: null }],
};

export const GROWATT: LineOf<'inverter'> = {
  ...BASE_LINE,
  category: 'inverter',
  brand: 'Growatt',
  count: 1,
  capacityKw: 3,
  inverterType: 'on_grid',
  phases: 1,
  warranty: '10 years',
};

export const POLYCAB: LineOf<'cable'> = {
  ...BASE_LINE,
  category: 'cable',
  brand: 'Polycab',
  source: 'saved_part',
  cableType: 'DC/AC',
  specification: '4 sq mm',
  warranty: '10 years',
};

export const HAVELLS: LineOf<'electrical'> = {
  ...BASE_LINE,
  category: 'electrical',
  brand: 'Havells',
  source: 'saved_part',
  includes: 'ACDB, DCDB, earthing',
  standard: 'IS/IEC',
};

export const TATA_STRUCTURE: LineOf<'structure'> = {
  ...BASE_LINE,
  category: 'structure',
  brand: 'Tata',
  source: 'saved_part',
  warranty: '10 years',
  weightPerKw: 45,
  standard: 'IS 2062',
};

export function aFieldSet(over: Partial<ProposalFieldSet> = {}): ProposalFieldSet {
  return {
    version: 1,
    company: { proposalType: 'customer_owns', coverPicture: { kind: 'platform', key: 'home' } },
    achievements: {
      aboutCompany: null,
      totalCapacityInstalledKw: null,
      happyCustomers: null,
      citiesServed: null,
    },
    system: {
      capacityKw: 3,
      systemType: 'on_grid',
      battery: null,
      maintenance: { kind: 'none' },
      commissioningIncluded: true,
      priceInclusive: PRICE_TYPED,
      taxRate: basisPoints(890),
      discount: null,
      incentiveClaimed: true,
      emi: null,
      ourCost: null,
    },
    performance: {
      efficiencyPercent: 80,
      yieldPerKwp: [
        142.5, 145.3, 170.9, 172.4, 178.4, 124.3, 96.9, 104.2, 110.5, 134.3, 129.9, 131.6,
      ],
      source: { kind: 'record', databases: ['ERA5'] },
      grain: 'district',
      editedMonthlyKwh: null,
      editedAtCapacityKw: null,
    },
    financials: { tariffPerKwh: minorUnits(950), tariffRise: basisPoints(300), horizonYears: 25 },
    timeline: [{ name: 'Survey', description: 'We visit and measure.', durationDays: 2 }],
    payment: {
      templateId: 'tpl-1',
      tranches: [
        { label: 'Advance', share: basisPoints(1000), dueOnStage: 'won' },
        { label: 'Material', share: basisPoints(6000), dueOnStage: 'material_ordered' },
        { label: 'Installation', share: basisPoints(2000), dueOnStage: 'installation' },
        { label: 'Handover', share: basisPoints(1000), dueOnStage: 'commissioned' },
      ],
    },
    components: [WAAREE, GROWATT, POLYCAB, HAVELLS, TATA_STRUCTURE],
    terms: richTextParagraphs(['This proposal is valid for 30 days.']),
    bank: { includeInProposal: true },
    ...over,
  };
}

export function withSystem(over: Partial<ProposalFieldSet['system']>): ProposalFieldSet {
  const fields = aFieldSet();
  return { ...fields, system: { ...fields.system, ...over } };
}

export const A_DEAL: ProposalDealFacts = {
  segment: 'residential',
  area: { area: 'IN-MH', district: 'Pune' },
  siteAddress: '12 Kothrud, Pune',
  sanctionedLoadKw: 5,
  supplyPhase: 'single',
  monthlyBill: minorUnits(420_000),
  clientName: 'Anil Sharma',
  clientPhoneValid: true,
};

export const A_COMPANY: ProposalCompanyFacts = {
  taxRegistered: true,
  supplierPlace: '27',
  hasBankDetails: true,
  hasLogo: true,
};

export const LINE_LABELS = {
  system: 'System',
  battery: 'Battery',
  discount: 'Discount',
  tax: 'GST',
  incentive: 'Subsidy',
} as const;

export function moneyInput(
  fields: ProposalFieldSet = aFieldSet(),
  over: Partial<ProposalMoneyInput> = {},
): ProposalMoneyInput {
  return {
    scheme: IN_PACK,
    subsidy: IN_PACK.subsidy,
    fields,
    deal: A_DEAL,
    company: A_COMPANY,
    lineLabels: LINE_LABELS,
    freshness: null,
    ...over,
  };
}

/** A complete Generate check over `fields`, with its money block worked out as the api does. */
export function checkInput(
  fields: ProposalFieldSet = aFieldSet(),
  over: Partial<GenerateCheckInput> = {},
): GenerateCheckInput {
  const deal = over.deal ?? A_DEAL;
  return {
    fields,
    deal,
    money: proposalMoney(moneyInput(fields, { deal })),
    formats: IN_PACK.formats,
    subsidy: IN_PACK.subsidy,
    certification: IN_PACK.certificationSchemes,
    market: IN_PROPOSAL_FACTS,
    basis: { designed: false, roofTier: null },
    viewerSeesCost: true,
    taxRegistered: true,
    supplyRates: IN_PACK.tax.systemSupplyRates,
    ...over,
  };
}
