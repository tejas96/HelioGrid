import {
  type CustomerPage,
  customerPageSchema,
  type DesignDetail,
  designDetailSchema,
  type ProposalDetail,
  type ProposalEntryDesign,
  type ProposalRow,
  proposalDetailSchema,
  proposalEntryDesignSchema,
} from '@heliogrid/contracts';

/**
 * A proposal and a customer's page as the api answers them, in the contract's own shapes: each is
 * parsed by its schema here, so a fixture the contract has moved away from fails where it is
 * written rather than as an unreadable answer inside a hook's test.
 */

export const PROPOSAL = '01a30000-0000-7000-8000-00000000b001';
export const LEAD = '01a30000-0000-7000-8000-00000000c001';
export const CUSTOMER = '01a30000-0000-7000-8000-00000000c002';
const AT = '2026-11-13T10:00:00.000Z';

const figure = (amount: string) => ({
  amount,
  tier: 'assumed' as const,
  standing: null,
  freshness: 'current',
});

const fields = (priceInclusive: string | null): ProposalDetail['document']['fields'] => ({
  company: { proposalType: 'customer_owns', coverPicture: { kind: 'platform', key: 'home' } },
  achievements: {
    aboutCompany: null,
    totalCapacityInstalledKw: 200,
    happyCustomers: 350,
    citiesServed: 10,
  },
  system: {
    capacityKw: 3,
    systemType: 'on_grid',
    battery: null,
    maintenance: { kind: 'none' },
    commissioningIncluded: true,
    priceInclusive,
    taxPercent: '8.90',
    discount: null,
    incentiveClaimed: true,
    emi: null,
  },
  performance: {
    efficiencyPercent: 80,
    yieldPerKwp: null,
    source: null,
    grain: null,
    editedMonthlyKwh: null,
    editedAtCapacityKw: null,
  },
  financials: { tariffPerKwh: '9.50', tariffRisePercent: '3.00', horizonYears: 25 },
  timeline: [],
  payment: {
    templateId: null,
    tranches: [{ label: 'Advance', percent: '100.00', dueOnStage: 'won' }],
  },
  components: [],
  terms: { version: 1, blocks: [] },
  bank: { includeInProposal: true },
});

/** The draft as the origin holds it: a new revision and a new payable after each commit. */
export function proposalDetail(over: {
  readonly revision?: number;
  readonly priceInclusive?: string | null;
  readonly quickMode?: boolean;
  readonly siteAddress?: string | null;
  readonly status?: string;
  readonly standing?: string;
  /** The customer may be dialled; false for do-not-call or a wrong number (`M02-44`). */
  readonly canDial?: boolean;
}): ProposalDetail {
  const price = over.priceInclusive === undefined ? '190575.00' : over.priceInclusive;
  return proposalDetailSchema.parse({
    id: PROPOSAL,
    status: over.status ?? 'draft',
    standing: over.standing ?? 'draft',
    quickMode: over.quickMode ?? false,
    revision: over.revision ?? 0,
    createdAt: AT,
    updatedAt: AT,
    lead: {
      id: LEAD,
      customerId: CUSTOMER,
      stage: 'qualified',
      state: null,
      owner: null,
      city: 'Pune',
      customerPhoneE164: '+919850012345',
      canDial: over.canDial ?? true,
    },
    document: {
      number: null,
      version: null,
      date: AT,
      fields: fields(price),
      deal: {
        segment: 'residential',
        area: { area: 'IN-MH', district: 'Pune' },
        siteAddress: over.siteAddress ?? null,
        sanctionedLoadKw: null,
        supplyPhase: null,
        monthlyBill: '4200.00',
        clientName: 'Anil Sharma',
        clientPhoneValid: true,
      },
      company: {
        name: 'Suryodaya Solar',
        phoneE164: '+919822041817',
        email: null,
        website: null,
        address: null,
        logoUrl: null,
        coverPhotoUrl: null,
        taxRegistration: null,
        bankDetails: null,
        brandColour: null,
        shades: null,
      },
      money: {
        currencyCode: 'INR',
        equation: [],
        taxes: [],
        preTax: price ?? '0.00',
        discount: '0.00',
        taxAmount: '0.00',
        payable: figure(price ?? '0.00'),
        payableAtOrBelowZero: price === null,
        incentiveOffered: true,
        incentive: null,
        netCost: figure(price ?? '0.00'),
        perKw: null,
        tranches: null,
      },
      generation: null,
      savings: null,
      emi: null,
      pages: ['cover', 'price', 'terms'],
      basisLine: null,
      validityDays: null,
      language: 'en',
      preparedBy: { userId: null, name: 'Rahul Patil', phoneE164: null },
    },
    steps: [],
    progress: { complete: 4, of: 11 },
    checklist: { blocks: [], warnings: [], skipped: [], canGenerate: true },
    rights: {
      edit: true,
      share: true,
      seesCost: false,
      writesCompanyFacts: false,
      addsParts: true,
      managesParts: false,
      mintsLinks: true,
      revokesLinks: true,
      managesBilling: false,
    },
    companyFactsBy: null,
    missingCompanyFacts: [],
    companyCover: null,
    paymentPlans: [],
    termsPrintIn: null,
    versions: [],
    tracking: {
      generatedAt: null,
      sharedAt: null,
      sharedBy: null,
      firstOpenedAt: null,
      lastOpenedAt: null,
      deviceClass: null,
      viewedSeconds: null,
      longestSection: null,
      answer: null,
      answeredAt: null,
      answerWords: null,
      answeredVia: null,
    },
    followUp: null,
    links: { count: 0, labels: [] },
    project: null,
    shareBlockedBy: null,
  });
}

export function proposalRow(id: string, standing: ProposalRow['standing']): ProposalRow {
  return {
    id,
    leadId: LEAD,
    customerName: 'Anil Sharma',
    customerPhone: '+919876543210',
    city: 'Pune',
    number: standing === 'draft' ? null : 'PRP-0042',
    version: standing === 'draft' ? null : 1,
    capacityKw: 3,
    systemType: 'on_grid',
    payable: '190575.00',
    standing,
    progress: { complete: 11, of: 11 },
    latest: { event: 'drafted', at: AT, viewedSeconds: null },
    stale: false,
    createdBy: null,
  };
}

/** The design *With 3D design* makes on the lead, as the studio answers it. */
export const DESIGN = '01a30000-0000-7000-8000-00000000d001';

/** A design with no proposal yet, as the Proposals page lists it. */
export function designEntry(id: string = DESIGN): ProposalEntryDesign {
  return proposalEntryDesignSchema.parse({
    kind: 'design',
    id,
    leadId: LEAD,
    customerName: 'Anil Sharma',
    customerPhone: '+919876543210',
    city: 'Pune',
    ordinal: 1,
    mount: 'roof',
    status: 'draft',
    changedAt: AT,
    changedBy: null,
  });
}

/** The design just made on the lead, as the studio's create answers it. */
export function designMade(): DesignDetail {
  return designDetailSchema.parse({
    design: {
      id: DESIGN,
      ordinal: 1,
      mount: 'roof',
      status: 'draft',
      recommended: false,
      createdBy: null,
      createdAt: AT,
      updatedAt: AT,
    },
    site: {
      name: null,
      address: null,
      pin: null,
      area: null,
      utilityOperator: null,
      supplyPhase: null,
      sanctionedLoadKw: null,
    },
    subject: { leadId: LEAD, customerName: 'Anil Sharma', customerPhone: null },
    canEdit: true,
  });
}

/** The id of the version the customer's page serves: what each answer names. */
export const SERVED_VERSION_ID = '7d0f3c1e-5a2b-4c8d-9e6f-1a2b3c4d5e6f';

/** A version shared after the one the page first served. */
export const NEWER_VERSION_ID = '7d0f3c1e-5a2b-4c8d-9e6f-1a2b3c4d5e70';

/** The customer's proposal page, answerable, with the draft's document as its one value set. */
export function customerPage(
  over: { readonly answered?: 'accept'; readonly versionId?: string } = {},
): CustomerPage {
  return customerPageSchema.parse({
    kind: 'proposal',
    language: 'en',
    company: { name: 'Suryodaya Solar', logoUrl: null, brandColour: null, shades: null },
    person: { name: 'Rahul Patil', phoneE164: '+919822041817' },
    proposal: {
      document: { ...proposalDetail({}).document, number: 'PRP-0042', version: 1 },
      versionId: over.versionId ?? SERVED_VERSION_ID,
      mayRespond: over.answered === undefined,
      answer: over.answered === undefined ? null : { kind: 'accept', at: AT, words: null },
      advance: '19057.50',
      callRequest: null,
    },
    questions: [],
    mayAsk: true,
  });
}

/** A link that is known and cannot serve: its honest page, with a person and nothing else. */
export function offPage(): CustomerPage {
  return customerPageSchema.parse({
    kind: 'off',
    language: 'en',
    company: { name: 'Suryodaya Solar', logoUrl: null, brandColour: null, shades: null },
    person: { name: 'Rahul Patil', phoneE164: '+919822041817' },
    off: { reason: 'revoked' },
    mayAsk: false,
  });
}
