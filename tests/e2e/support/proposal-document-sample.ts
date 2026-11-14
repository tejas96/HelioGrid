import {
  basisPoints,
  type ComponentLine,
  type MinorUnits,
  minorUnits,
  type ProposalPage,
  type ProposalVersionSnapshot,
} from '@heliogrid/domain';
import {
  figure,
  MONTHLY_BILL,
  MONTHLY_SAVING,
  OUR_COST,
  PAYABLE,
  rupees,
  YEARLY_SAVING,
} from './proposal-document-figures';
import { moneyOf, TRANCHES } from './proposal-document-money';

/**
 * The proposal parts' sample deal, which their story and their specs both name: Anil Sharma's
 * 3 kW on-grid system from Suryodaya Solar, as the approved design draws it, in the shape the
 * server freezes a version in (`ProposalVersionSnapshot`). The figures are the server's kind —
 * whole minor units, each with its tier — and nothing here is a word of the product's. Kept apart
 * from any Playwright import: a story runs in the browser.
 */
export const COMPANY = 'Suryodaya Solar Pvt Ltd';
export const CUSTOMER = 'Anil Sharma';
export const PERSON = 'Rahul Patil';
export const PERSON_PHONE = '+919822041817';
export const BRAND = '#1F7A4D';
export const TAX_NAME = 'GST';
export const NUMBER = 'PRP-0042';
export const DATE_TEXT = '13 Nov 2026';
export const VERSION = 1;

const line = {
  description: null,
  source: 'platform_item',
  catalogItemId: null,
  savedPartId: null,
  tier: 'assumed',
  certifications: [],
} as const;

/** Step 8 as picked: two inverter brands, and no structure yet. */
export const COMPONENTS: readonly ComponentLine[] = [
  {
    ...line,
    category: 'panel',
    brand: 'Waaree',
    count: 6,
    wattPeak: 550,
    technology: 'topcon',
    warranty: '25-year warranty',
    certifications: [{ scheme: 'DCR', reference: null }],
  },
  {
    ...line,
    category: 'inverter',
    brand: 'Growatt',
    count: 1,
    capacityKw: 3,
    inverterType: 'on_grid',
    phases: 1,
    warranty: '10-year warranty',
  },
  {
    ...line,
    category: 'inverter',
    brand: 'Sungrow',
    count: 1,
    capacityKw: 3,
    inverterType: 'on_grid',
    phases: 1,
    warranty: '10-year warranty',
  },
  {
    ...line,
    source: 'saved_part',
    category: 'cable',
    brand: 'Polycab',
    count: null,
    cableType: null,
    specification: 'DC 4 sq mm · AC 6 sq mm',
    warranty: '10-year warranty',
  },
  {
    ...line,
    source: 'saved_part',
    category: 'electrical',
    brand: 'Havells',
    count: null,
    includes: 'ACDB, DCDB, MCBs and earthing kit',
    standard: null,
  },
];

export const MONTHLY_KWH = [354, 372, 438, 450, 456, 354, 288, 294, 336, 378, 348, 336];
export const YEARLY_KWH = 4404;

const HORIZON_YEARS = 25;
const TARIFF_RISE = 1.03;

function cumulativeSavings(): MinorUnits[] {
  let total = 0;
  return Array.from({ length: HORIZON_YEARS }, (_, year) => {
    total += YEARLY_SAVING * TARIFF_RISE ** year;
    return minorUnits(Math.round(total));
  });
}

const paragraph = (text: string) => ({ type: 'p', spans: [{ text }] }) as const;

/** The version the sample's document prints. */
export const SNAPSHOT: ProposalVersionSnapshot = {
  fields: {
    version: 1,
    company: { proposalType: 'customer_owns', coverPicture: { kind: 'platform', key: 'home' } },
    achievements: {
      aboutCompany:
        'Suryodaya Solar has designed and installed rooftop solar across Pune and Nashik since 2011 — homes, housing societies and small factories.',
      totalCapacityInstalledKw: 1840,
      happyCustomers: 620,
      citiesServed: 14,
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
      incentiveClaimed: true,
      emi: null,
      ourCost: OUR_COST,
    },
    performance: {
      efficiencyPercent: 80,
      yieldPerKwp: null,
      source: { kind: 'record', databases: ['ERA5'] },
      grain: 'district',
      editedMonthlyKwh: null,
      editedAtCapacityKw: null,
    },
    financials: { tariffPerKwh: minorUnits(950), tariffRise: basisPoints(300), horizonYears: 25 },
    timeline: [
      {
        name: 'Site visit and final design',
        description: 'We measure your roof and confirm the layout.',
        durationDays: 3,
      },
      {
        name: 'Net-meter application',
        description: 'We file with MSEDCL for you.',
        durationDays: 7,
      },
      {
        name: 'Material at your site',
        description: 'Panels, inverter and structure arrive.',
        durationDays: 5,
      },
      {
        name: 'Installation',
        description: 'A trained crew fits and wires the system.',
        durationDays: 2,
      },
      {
        name: 'Testing and handover',
        description: 'We switch it on and show you the app.',
        durationDays: 1,
      },
    ],
    payment: { templateId: null, tranches: TRANCHES },
    components: COMPONENTS,
    terms: {
      version: 1,
      blocks: [
        paragraph('This proposal is valid for 30 days from its date. Prices include GST as shown.'),
        paragraph(
          'Payment falls due in the parts shown in the payment plan. Work at each stage starts when its part is received.',
        ),
        paragraph(
          'Equipment warranties are the manufacturers’ own and are handed over at commissioning.',
        ),
        paragraph(
          'The structure is checked and signed off by a qualified engineer before installation.',
        ),
      ],
    },
    bank: { includeInProposal: true },
  },
  deal: {
    segment: 'residential',
    area: { area: 'Maharashtra', district: 'Pune' },
    siteAddress: '12, Shivtirth Nagar, Kothrud, Pune 411038',
    sanctionedLoadKw: 5,
    supplyPhase: 'single',
    monthlyBill: MONTHLY_BILL,
    clientName: CUSTOMER,
    clientPhoneValid: true,
  },
  company: {
    name: COMPANY,
    phoneE164: null,
    email: null,
    website: null,
    address: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
    logoFileId: null,
    taxRegistration: { registrationType: 'gstin', value: '27AABCS1429P1ZQ' },
    bankDetails: {
      bankName: 'HDFC Bank · Baner, Pune',
      accountName: COMPANY,
      accountNumber: '50200012344417',
      bankRoutingIdentifier: 'HDFC0001234',
    },
    brandColour: BRAND,
  },
  money: moneyOf('drawn', TRANCHES),
  generation: {
    monthlyKwh: MONTHLY_KWH,
    yearlyKwh: YEARLY_KWH,
    source: { kind: 'record', databases: ['ERA5'] },
    grain: 'district',
  },
  savings: {
    yearly: YEARLY_SAVING,
    monthly: MONTHLY_SAVING,
    billWithSolar: rupees(713),
    lifetime: rupees(1525594),
    cumulative: cumulativeSavings(),
    paybackYears: 2.7,
    assumptions: { horizonYears: HORIZON_YEARS, escalationRate: basisPoints(300) },
    figures: {
      yearly: figure(YEARLY_SAVING, 'estimated'),
      monthly: figure(MONTHLY_SAVING, 'estimated'),
      lifetime: figure(rupees(1525594), 'estimated'),
    },
  },
  emi: null,
  pages: [
    'cover',
    'about',
    'system',
    'generation',
    'savings',
    'price',
    'timeline',
    'terms',
    'bank',
  ],
  basisLine: 'indicative-basis',
  validityDays: null,
  language: 'en',
  preparedBy: { name: PERSON, phoneE164: PERSON_PHONE },
};

/** The same version with the EMI example on. */
export const EMI: NonNullable<ProposalVersionSnapshot['emi']> = {
  monthly: rupees(4002),
  months: 60,
  assumptions: { horizonYears: 5, interestRate: basisPoints(950) },
  figure: figure(rupees(4002), 'assumed'),
};

/** The version a page draws: whole, bare of its optional facts, or with the EMI example on. */
export function versionOf(
  bare: boolean,
  emi: boolean,
  off: readonly ProposalPage[],
): ProposalVersionSnapshot {
  const pages = SNAPSHOT.pages.filter((page) => !off.includes(page));
  if (!bare) {
    /* The EMI example is on in the field set when the version carries one, as the server sets them. */
    const system = {
      ...SNAPSHOT.fields.system,
      emi: emi ? { rate: basisPoints(950), tenureYears: 5 } : null,
    };
    return { ...SNAPSHOT, pages, emi: emi ? EMI : null, fields: { ...SNAPSHOT.fields, system } };
  }
  return {
    ...SNAPSHOT,
    pages,
    generation: null,
    savings: null,
    company: { ...SNAPSHOT.company, bankDetails: null },
    fields: {
      ...SNAPSHOT.fields,
      achievements: {
        aboutCompany: null,
        totalCapacityInstalledKw: null,
        happyCustomers: null,
        citiesServed: null,
      },
    },
  };
}
