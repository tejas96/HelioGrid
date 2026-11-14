import type { UiLanguage } from '../format/languages';
import type { FormatPack } from '../format/pack';
import { type QualifiedAmount, qualifyMinorUnits } from '../format/qualified';
import { basisPoints } from '../money/basis-points';
import { type MinorUnits, minorUnits } from '../money/minor-units';
import type { ComponentLine } from '../proposals/field-set';
import type { ProposalMoney } from '../proposals/money';
import type { ProposalSavings } from '../proposals/projections';
import type { FrozenCompanyFacts, ProposalVersionSnapshot } from '../proposals/snapshot';
import { pagesPrinted } from '../proposals/steps';
import type { CoverPicture } from '../proposals/vocabulary';
import type { TrancheLine } from './effective-settings';
import type { ProposalCover, ProposalSection } from './proposal-template-defaults';
import type { RichTextValue } from './rich-text';
import type { TimelinePhase } from './timeline-template-defaults';

/**
 * The sample deal Proposal defaults draws the company's own defaults over (`T-M01-030`): a 3 kW
 * home system, so the stage shows the real pages a customer gets rather than a drawing of them.
 * AUTHORED, never computed: every amount below is written as it stands, the way `M06-35`'s worked
 * case states it, because no device works out a money figure (`F4-04`). The payment plan therefore
 * prints its shares and no amounts — those are the server's, on a real proposal. Its customer's
 * name and place are the reader's words and arrive with the company's own facts.
 */

const rupees = (amount: number): MinorUnits => minorUnits(amount * 100);

const PAYABLE = rupees(190_575);
const PRE_TAX = rupees(175_000);
const TAX = rupees(15_575);
const INCENTIVE = rupees(78_000);
const NET_COST = rupees(112_575);
const YEARLY_SAVING = rupees(41_844);
const MONTHLY_SAVING = rupees(3_487);
const MONTHLY_BILL = rupees(4_200);
const BILL_WITH_SOLAR = rupees(713);
const LIFETIME_SAVING = rupees(1_525_601);
const HORIZON_YEARS = 25;

/** The saving to date at the end of each year: ₹41,844 a year, the tariff rising 3% a year. */
const CUMULATIVE_SAVING: readonly MinorUnits[] = [
  4184400, 8494332, 12933562, 17505969, 22215548, 27066414, 32062807, 37209091, 42509764, 47969457,
  53592940, 59385128, 65351082, 71496015, 77825295, 84344454, 91059188, 97975363, 105099024,
  112436395, 119993887, 127778103, 135795847, 144054122, 152560146,
].map(minorUnits);

/** Twelve months, January first, kWh — a 3 kW system in western India. */
const MONTHLY_KWH = [354, 372, 438, 450, 456, 354, 288, 294, 336, 378, 348, 336] as const;
const YEARLY_KWH = 4404;

const LINE = {
  description: null,
  source: 'platform_item',
  catalogItemId: null,
  savedPartId: null,
  tier: 'assumed',
  certifications: [],
} as const;

/** The parts the sample system names: brand names are facts and are never translated (`F3-08`). */
const COMPONENTS: readonly ComponentLine[] = [
  {
    ...LINE,
    category: 'panel',
    brand: 'Waaree',
    count: 6,
    wattPeak: 550,
    technology: 'topcon',
    warranty: null,
  },
  {
    ...LINE,
    category: 'inverter',
    brand: 'Growatt',
    count: 1,
    capacityKw: 3,
    inverterType: 'on_grid',
    phases: 1,
    warranty: null,
  },
];

export interface TemplateSampleInput {
  /** The tenant market's formats: the sample's amounts print as its money does. */
  readonly formats: FormatPack;
  /** The company's own facts, as a version would freeze them. */
  readonly company: FrozenCompanyFacts;
  readonly cover: ProposalCover | null;
  readonly coverPicture: CoverPicture;
  readonly sectionsIncluded: readonly ProposalSection[];
  readonly terms: RichTextValue;
  /** The days the terms state (`termsValidityDays`); `null` for the company's own words. */
  readonly validityDays: number | null;
  readonly phases: readonly TimelinePhase[];
  /** The default payment plan's lines. */
  readonly tranches: readonly TrancheLine[];
  /** The incentive's name as the market pack states it; `null` where the market offers none. */
  readonly incentiveScheme: string | null;
  /** The sample customer, in the reader's words. */
  readonly customer: {
    readonly name: string;
    readonly siteAddress: string;
    readonly area: string;
    readonly district: string;
  };
  readonly preparedBy: { readonly name: string; readonly phoneE164: string | null };
  readonly language: UiLanguage;
}

function moneyOf(input: TemplateSampleInput): ProposalMoney {
  const figure = (amount: MinorUnits): QualifiedAmount =>
    qualifyMinorUnits(input.formats, amount, {
      tier: 'assumed',
      energySource: null,
      freshness: null,
      projection: null,
    });
  const offered = input.incentiveScheme !== null;
  const taxed = input.company.taxRegistration !== null;
  return {
    currency: input.formats.currency,
    equation: {
      lines: [],
      gross: PAYABLE,
      deductions: minorUnits(0),
      payable: PAYABLE,
      zeroOrBelow: false,
      unresolved: [],
      reconciliation: null,
      payableStandsUp: true,
    },
    taxes: [],
    preTax: taxed ? PRE_TAX : PAYABLE,
    discount: minorUnits(0),
    taxAmount: taxed ? TAX : minorUnits(0),
    payable: PAYABLE,
    payableAtOrBelowZero: false,
    incentiveOffered: offered,
    incentive:
      input.incentiveScheme === null
        ? null
        : { scheme: input.incentiveScheme, amount: INCENTIVE, paidTo: 'customer' },
    netCost: offered ? NET_COST : PAYABLE,
    margin: null,
    perKw: null,
    /* The plan prints its shares alone: a part's amount is the server's to work out (`F4-04`). */
    tranches: null,
    figures: {
      payable: figure(PAYABLE),
      taxAmount: figure(taxed ? TAX : minorUnits(0)),
      discount: null,
      incentive: offered ? figure(INCENTIVE) : null,
      netCost: figure(offered ? NET_COST : PAYABLE),
      perKw: null,
      margin: null,
    },
  };
}

function savingsOf(formats: FormatPack): ProposalSavings {
  const assumptions = { horizonYears: HORIZON_YEARS, escalationRate: basisPoints(300) };
  const figure = (amount: MinorUnits): QualifiedAmount =>
    qualifyMinorUnits(formats, amount, {
      tier: 'estimated',
      energySource: { kind: 'record', databases: ['ERA5'] },
      freshness: null,
      projection: assumptions,
    });
  return {
    yearly: YEARLY_SAVING,
    monthly: MONTHLY_SAVING,
    billWithSolar: BILL_WITH_SOLAR,
    lifetime: LIFETIME_SAVING,
    cumulative: CUMULATIVE_SAVING,
    paybackYears: 2.7,
    assumptions,
    figures: {
      yearly: figure(YEARLY_SAVING),
      monthly: figure(MONTHLY_SAVING),
      lifetime: figure(LIFETIME_SAVING),
    },
  };
}

/**
 * The version the defaults' stage draws: the company's own cover, pages, terms, timeline, plan and
 * account over the sample deal. A change to a default changes the page beside it, because the page
 * is the document's own (`T-M06-015`: one renderer).
 */
export function templateSampleSnapshot(input: TemplateSampleInput): ProposalVersionSnapshot {
  const { customer } = input;
  return {
    fields: {
      version: 1,
      company: { proposalType: 'customer_owns', coverPicture: input.coverPicture },
      achievements: input.cover ?? {
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
        priceInclusive: PAYABLE,
        taxRate: basisPoints(890),
        discount: null,
        incentiveClaimed: input.incentiveScheme !== null,
        emi: null,
        ourCost: null,
      },
      performance: {
        efficiencyPercent: 80,
        yieldPerKwp: null,
        source: { kind: 'record', databases: ['ERA5'] },
        grain: 'district',
        editedMonthlyKwh: null,
        editedAtCapacityKw: null,
      },
      financials: {
        tariffPerKwh: minorUnits(950),
        tariffRise: basisPoints(300),
        horizonYears: HORIZON_YEARS,
      },
      /* The company's timeline states no durations (`M01-52`), so the sample prints none. */
      timeline: input.phases.map((phase) => ({ ...phase, durationDays: null })),
      payment: { templateId: null, tranches: input.tranches },
      components: COMPONENTS,
      terms: input.terms,
      bank: { includeInProposal: input.sectionsIncluded.includes('bank_details') },
    },
    deal: {
      segment: 'residential',
      area: { area: customer.area, district: customer.district },
      siteAddress: customer.siteAddress,
      sanctionedLoadKw: null,
      supplyPhase: null,
      monthlyBill: MONTHLY_BILL,
      clientName: customer.name,
      clientPhoneValid: true,
    },
    company: input.company,
    money: moneyOf(input),
    generation: {
      monthlyKwh: MONTHLY_KWH,
      yearlyKwh: YEARLY_KWH,
      source: { kind: 'record', databases: ['ERA5'] },
      grain: 'district',
    },
    savings: savingsOf(input.formats),
    emi: null,
    pages: pagesPrinted(input.sectionsIncluded),
    basisLine: 'indicative-basis',
    validityDays: input.validityDays,
    language: input.language,
    preparedBy: input.preparedBy,
  };
}
