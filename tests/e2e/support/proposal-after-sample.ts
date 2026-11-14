import type {
  CustomerLinks,
  ProposalDetail,
  ProposalVersion,
  ProposalVersionSummary,
  VersionInForcePreview,
} from '@heliogrid/contracts';

/**
 * The proposal's sample after it is built, which the after-build parts' story and specs both name:
 * Anil Sharma's PRP-0042 from Suryodaya Solar, as the approved design draws it, in the shapes the
 * server answers. Nothing here is a word of the product's. Kept apart from any Playwright import:
 * a story runs in the browser.
 */
export const ID = (tail: string) => `00000000-0000-4000-8000-0000000000${tail}`;
export const RAHUL = { userId: ID('b1'), name: 'Rahul Patil' };

export type TrackStanding =
  | 'ready'
  | 'shared'
  | 'opened'
  | 'negotiating'
  | 'accepted'
  | 'declined'
  | 'won';

const TRACKING = {
  generatedAt: '2026-11-13T12:32:00.000Z',
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
} satisfies ProposalDetail['tracking'];

const SHARED = { ...TRACKING, sharedAt: '2026-11-13T12:35:00.000Z', sharedBy: RAHUL };
const OPENED = {
  ...SHARED,
  firstOpenedAt: '2026-11-13T13:10:00.000Z',
  lastOpenedAt: '2026-11-13T13:10:00.000Z',
  deviceClass: 'phone',
  viewedSeconds: 240,
  longestSection: 'price',
};
const ANSWERED = { ...OPENED, answeredAt: '2026-11-13T14:12:00.000Z' };

const TRACKING_AT: Record<TrackStanding, ProposalDetail['tracking']> = {
  ready: TRACKING,
  shared: SHARED,
  opened: OPENED,
  negotiating: {
    ...ANSWERED,
    answer: 'negotiate',
    answerWords: 'Can you do 5 kW? We are adding an AC.',
  },
  accepted: { ...ANSWERED, answer: 'accept', answeredVia: { label: 'Anil', contactName: null } },
  declined: { ...ANSWERED, answer: 'decline', answerWords: 'We are going with another company.' },
  won: { ...ANSWERED, answer: 'accept', answeredVia: { label: 'Anil', contactName: null } },
};

const FOLLOW_UP: NonNullable<ProposalDetail['followUp']> = {
  id: ID('d1'),
  leadId: ID('a1'),
  kind: 'call',
  title: null,
  status: 'open',
  dueAt: '2026-11-15T04:30:00.000Z',
  assignee: RAHUL,
  provenance: 'proposal_shared',
  doneAt: null,
};

/**
 * The detail the track screen reads, at one standing. Only what the screen reads is filled: the
 * document's steps are the builder's sample and are not drawn here, so they are left out and the
 * shape is asserted once, on this line.
 */
export function detailAt(standing: TrackStanding): ProposalDetail {
  const shared = standing !== 'ready';
  const partial = {
    id: ID('e1'),
    status: 'shared',
    standing,
    quickMode: true,
    revision: 12,
    updatedAt: '2026-11-13T12:32:00.000Z',
    progress: { complete: 11, of: 11 },
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
    tracking: TRACKING_AT[standing],
    followUp: standing === 'shared' || standing === 'opened' ? FOLLOW_UP : null,
    links: shared ? { count: 2, labels: ['Anil', 'Sunita'] } : { count: 0, labels: [] },
    project: standing === 'won' ? { id: ID('f1'), number: 'PRJ-0031' } : null,
    shareBlockedBy: null,
    // Version 1, as the wire always carries the versions made: Track names the latest of them.
    versions: [
      {
        version: 1,
        generatedAt: '2026-11-13T12:32:00.000Z',
        generatedBy: null,
        trigger: 'first_generate',
        changeNote: null,
        payable: '190575.00',
        sharedAt: shared ? '2026-11-13T12:35:00.000Z' : null,
        answer: null,
        answeredAt: null,
        onLink: shared,
        inForce: false,
      },
    ],
    document: {
      number: 'PRP-0042',
      version: 1,
      language: 'en',
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
      deal: { clientName: 'Anil Sharma' },
    },
  };
  return partial as unknown as ProposalDetail;
}

const V1: ProposalVersionSummary = {
  version: 1,
  generatedAt: '2026-11-13T12:32:00.000Z',
  generatedBy: RAHUL,
  trigger: 'first_generate',
  changeNote: null,
  payable: '190575.00',
  sharedAt: '2026-11-13T12:35:00.000Z',
  answer: 'negotiate',
  answeredAt: '2026-11-13T14:12:00.000Z',
  onLink: true,
  inForce: false,
};
const V2: ProposalVersionSummary = {
  ...V1,
  version: 2,
  generatedAt: '2026-11-13T14:45:00.000Z',
  changeNote: 'Anil asked for 5 kW. They are adding an AC.',
  payable: '305000.00',
  sharedAt: null,
  answer: null,
  answeredAt: null,
  onLink: false,
};

export const VERSIONS: readonly ProposalVersionSummary[] = [V2, V1];

/** Version 2 with what moved in it; its document is not drawn on the versions screen. */
export const LATEST_VERSION = {
  ...V2,
  proposalId: ID('e1'),
  diff: {
    changes: [
      { fact: 'capacity', from: { kind: 'power', kw: 3 }, to: { kind: 'power', kw: 5 } },
      {
        fact: 'payable',
        from: { kind: 'money', amount: '190575.00' },
        to: { kind: 'money', amount: '305000.00' },
      },
      {
        fact: 'panels',
        from: { kind: 'text', text: '6 × 550 W' },
        to: { kind: 'text', text: '10 × 550 W' },
      },
      {
        fact: 'payment_plan',
        from: { kind: 'text', text: '10 · 60 · 20 · 10' },
        to: { kind: 'text', text: '30 · 60 · 10' },
      },
    ],
    pagesUnchanged: 7,
  },
} as unknown as ProposalVersion;

export const IN_FORCE: VersionInForcePreview = {
  version: 2,
  currencyCode: 'INR',
  newTotal: '305000.00',
  paid: '19057.50',
  remaining: '285942.50',
  surplus: null,
  plan: [
    {
      label: 'Advance',
      amount: '19057.50',
      state: 'paid',
      dueOnStage: 'won',
      shareOfRest: null,
      paidOn: '2026-11-14',
    },
    {
      label: 'Material',
      amount: '171565.50',
      state: 'new',
      dueOnStage: 'dispatched',
      shareOfRest: '60.00',
      paidOn: null,
    },
    {
      label: 'Handover',
      amount: '114377.00',
      state: 'new',
      dueOnStage: 'commissioned',
      shareOfRest: null,
      paidOn: null,
    },
  ],
};

const LINK = {
  id: ID('c1'),
  label: 'Anil',
  contact: { id: ID('c9'), name: 'Anil Sharma' },
  status: 'active',
  mintedAt: '2026-11-13T12:35:00.000Z',
  mintedBy: RAHUL,
  opens: 3,
  lastOpenedAt: '2026-11-13T13:10:00.000Z',
  lastDeviceClass: 'phone',
  answered: false,
  revokedAt: null,
} satisfies CustomerLinks['links'][number];

export const LINKS: CustomerLinks = {
  links: [
    LINK,
    {
      ...LINK,
      id: ID('c2'),
      label: 'Sunita',
      contact: { id: ID('c8'), name: 'Sunita Sharma' },
      opens: 0,
      lastOpenedAt: null,
      lastDeviceClass: null,
    },
    {
      ...LINK,
      id: ID('c3'),
      label: 'First link',
      status: 'revoked',
      revokedAt: '2026-11-12T10:00:00.000Z',
    },
  ],
  contacts: [
    { id: ID('c9'), name: 'Anil Sharma' },
    { id: ID('c8'), name: 'Sunita Sharma' },
  ],
  acts: { mint: true, revoke: true },
};
