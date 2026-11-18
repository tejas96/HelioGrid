import type {
  LeadProposals,
  ProposalEntries,
  ProposalEntryDesign,
  ProposalList,
  WonBasisWire,
} from '@heliogrid/contracts';
import { ID, RAHUL } from './proposal-after-sample';

/**
 * The lists the after-build parts read — the proposals list, the lead's section, Mark won's basis
 * and a composed message — for the same sample deal (`proposal-after-sample.ts`).
 */
const ROW = {
  id: ID('e1'),
  leadId: ID('a1'),
  customerName: 'Anil Sharma',
  customerPhone: '+919876543210',
  city: 'Pune',
  number: 'PRP-0042',
  version: 1,
  capacityKw: 3,
  systemType: 'on_grid',
  payable: '190575.00',
  standing: 'opened',
  progress: { complete: 11, of: 11 },
  latest: { event: 'opened', at: '2026-11-13T13:10:00.000Z', viewedSeconds: 240 },
  stale: false,
  createdBy: RAHUL,
} satisfies ProposalList['rows']['items'][number];

/** The seven proposals the approved design lists, one of each kind a row can be. */
export const LIST_ROWS: ProposalList['rows']['items'] = [
  ROW,
  {
    ...ROW,
    id: ID('e2'),
    customerName: 'Rohan Kale',
    number: 'PRP-0039',
    payable: '188000.00',
    standing: 'accepted',
    latest: { event: 'accepted', at: '2026-11-12T10:00:00.000Z', viewedSeconds: null },
  },
  {
    ...ROW,
    id: ID('e3'),
    customerName: 'Patil Farms',
    number: 'PRP-0038',
    capacityKw: 25,
    payable: '1340000.00',
    standing: 'negotiating',
    latest: { event: 'change_asked', at: '2026-11-12T08:00:00.000Z', viewedSeconds: null },
  },
  {
    ...ROW,
    id: ID('e4'),
    customerName: 'Kavita Joshi',
    number: null,
    version: null,
    capacityKw: 2,
    payable: '124000.00',
    standing: 'draft',
    progress: { complete: 7, of: 11 },
    latest: { event: 'drafted', at: '2026-11-11T08:00:00.000Z', viewedSeconds: null },
  },
  {
    ...ROW,
    id: ID('e5'),
    customerName: 'Meena Deshpande',
    number: 'PRP-0036',
    payable: '192000.00',
    standing: 'replaced',
    latest: { event: 'replaced', at: '2026-11-09T08:00:00.000Z', viewedSeconds: null },
  },
];

export const LIST: ProposalList = {
  currencyCode: 'INR',
  rows: { items: LIST_ROWS, totalCount: LIST_ROWS.length },
  counts: { all: 7, waiting: 4, draft: 1, accepted: 1, closed: 2 },
  waitingValue: '1828575.00',
  canStart: true,
};

/** A design with no proposal yet, made by Rahul (`T-M05-001b`). */
export const DESIGN_ROW: ProposalEntryDesign = {
  kind: 'design',
  id: ID('d1'),
  leadId: ID('a7'),
  customerName: 'Kavita More',
  customerPhone: '+919876500021',
  city: 'Sangli',
  ordinal: 1,
  mount: 'roof',
  status: 'draft',
  changedAt: '2026-11-13T13:30:00.000Z',
  changedBy: RAHUL,
};

/** The Proposals page: the design first, newest change first, then the seven proposals. */
export const ENTRIES: ProposalEntries = {
  ...LIST,
  rows: {
    items: [DESIGN_ROW, ...LIST_ROWS.map((row) => ({ kind: 'proposal' as const, ...row }))],
    totalCount: LIST_ROWS.length + 1,
  },
  counts: { '3d': 1, ...LIST.counts, all: LIST.counts.all + 1 },
};

const LEAD_PROPOSAL = {
  id: ID('e1'),
  number: 'PRP-0042',
  version: 1,
  standing: 'opened',
  progress: { complete: 11, of: 11 },
  capacityKw: 3,
  payable: '190575.00',
  madeBy: RAHUL,
  madeAt: '2026-11-11T09:20:00.000Z',
  updatedAt: '2026-11-13T12:32:00.000Z',
  live: true,
} satisfies LeadProposals['items'][number];

export type LeadCase = 'none' | 'draft' | 'one' | 'two' | 'closed';

export const LEAD_PROPOSALS: Record<LeadCase, LeadProposals> = {
  none: { items: [], canStart: true, canWithdraw: true, sibling: null },
  closed: { items: [], canStart: false, canWithdraw: false, sibling: null },
  draft: {
    items: [
      {
        ...LEAD_PROPOSAL,
        number: null,
        version: null,
        standing: 'draft',
        progress: { complete: 7, of: 11 },
      },
    ],
    canStart: true,
    canWithdraw: true,
    sibling: null,
  },
  one: { items: [LEAD_PROPOSAL], canStart: true, canWithdraw: true, sibling: null },
  two: {
    items: [
      LEAD_PROPOSAL,
      {
        ...LEAD_PROPOSAL,
        id: ID('e9'),
        number: 'PRP-0040',
        standing: 'shared',
        payable: '184000.00',
        madeBy: { userId: ID('b2'), name: 'Sneha Kulkarni' },
      },
    ],
    canStart: false,
    canWithdraw: true,
    sibling: null,
  },
};

const PLAN = [
  { label: 'Advance', percent: '10', dueOnStage: 'won', amount: '19057.50' },
  { label: 'Material', percent: '60', dueOnStage: 'dispatched', amount: '114345.00' },
  { label: 'Installation', percent: '20', dueOnStage: 'installation', amount: '38115.00' },
  { label: 'Handover', percent: '10', dueOnStage: 'commissioned', amount: '19057.50' },
] satisfies WonBasisWire['plan'];

export type WonCase = 'accepted' | 'newer' | 'none';

export const WON_BASIS: Record<WonCase, WonBasisWire> = {
  accepted: {
    basis: 'accepted_version',
    currencyCode: 'INR',
    proposal: { id: ID('e1'), number: 'PRP-0042' },
    acceptance: {
      version: 1,
      acceptedAt: '2026-11-13T14:12:00.000Z',
      linkLabel: 'Anil',
      contactName: null,
    },
    unansweredVersion: null,
    finalValue: '190575.00',
    plan: PLAN,
    siblingProposal: null,
  },
  newer: {
    basis: 'newer_version_unanswered',
    currencyCode: 'INR',
    proposal: { id: ID('e1'), number: 'PRP-0042' },
    acceptance: {
      version: 1,
      acceptedAt: '2026-11-13T14:12:00.000Z',
      linkLabel: 'Anil',
      contactName: null,
    },
    unansweredVersion: 2,
    finalValue: null,
    plan: PLAN.map((part) => ({ ...part, amount: null })),
    siblingProposal: null,
  },
  none: {
    basis: 'no_acceptance',
    currencyCode: 'INR',
    proposal: null,
    acceptance: null,
    unansweredVersion: null,
    finalValue: null,
    plan: PLAN.map((part) => ({ ...part, amount: null })),
    siblingProposal: null,
  },
};

export const SHARE_MESSAGE = {
  language: 'en',
  text: 'Namaste Anil ji, your 3 kW solar proposal from Suryodaya Solar is ready.\nPrice ₹1,90,575 with GST. You can read it and answer here:\nhttps://app.heliogrid.test/p/7Kq2mXa9Zt4LwB3nP8sR1v\n— Rahul Patil, +91 98220 41817',
  link: 'https://app.heliogrid.test/p/7Kq2mXa9Zt4LwB3nP8sR1v',
  chatUri: null,
};
