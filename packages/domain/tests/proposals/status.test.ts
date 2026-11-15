import { describe, expect, it } from 'vitest';
import type { LeadLifecycle } from '../../src/crm/lifecycle-model';
import { freshnessOf } from '../../src/format/freshness';
import {
  answerProposal,
  type ProposalStatusFacts,
  shareProposal,
  statusWhenLeadCloses,
  statusWhenSuperseded,
  withdrawProposal,
} from '../../src/proposals/status';

const lead = (over: Partial<LeadLifecycle> = {}): LeadLifecycle => ({
  stage: 'qualified',
  state: null,
  ownerId: 'rep',
  wakeOn: null,
  resurfaceOn: null,
  noCallUntil: null,
  close: null,
  reopenCount: 0,
  ...over,
});

const proposal = (over: Partial<ProposalStatusFacts> = {}): ProposalStatusFacts => ({
  status: 'draft',
  latestVersion: 1,
  sharedVersion: null,
  answer: null,
  ...over,
});

const SHARED = proposal({ status: 'shared', sharedVersion: 1 });
const ENGINES = { proposal: '1' } as const;
/** The served version's figures as they stand: computed by the engine still running, or by an older one. */
const CURRENT = freshnessOf({ engines: ENGINES }, { engines: ENGINES, recomputeInFlight: false });
const STALE = freshnessOf(
  { engines: ENGINES },
  { engines: { proposal: '2' }, recomputeInFlight: false },
);
const CLOSED = lead({ state: 'lost', close: { state: 'lost', reason: 'price', at: 1, by: 'rep' } });

describe('shareProposal — the person’s mark that the latest version went out (M06-45, M06-53)', () => {
  it('the first share: the version goes live and the lead reads proposal', () => {
    const result = shareProposal(proposal(), lead());
    expect(result).toEqual({
      kind: 'moved',
      next: { status: 'shared', latestVersion: 1, sharedVersion: 1, answer: null },
      lead: {
        lead: lead({ stage: 'proposal' }),
        transitions: [
          { moveKind: 'funnel_stage', from: 'qualified', to: 'proposal', cause: 'automation' },
        ],
      },
      raisesTask: 'proposal_shared',
      closesFollowUp: false,
      supersedesOthers: true,
    });
  });

  it('sharing the same version again changes nothing but the follow-up’s date', () => {
    const result = shareProposal(SHARED, lead({ stage: 'proposal' }));
    expect(result).toMatchObject({
      kind: 'moved',
      next: SHARED,
      lead: { transitions: [] },
      raisesTask: 'proposal_shared',
      supersedesOthers: false,
    });
  });

  it.each(['accept', 'negotiate', 'decline'] as const)(
    'sharing again a version the customer already answered (%s) raises no follow-up: nobody chases an answer (M06-55)',
    (answer) => {
      const answered = proposal({ status: 'shared', sharedVersion: 1, answer });
      expect(shareProposal(answered, lead({ stage: 'proposal' }))).toMatchObject({
        kind: 'moved',
        next: answered,
        raisesTask: null,
      });
    },
  );

  it('a newer version shared opens answering again, the earlier answer left to history', () => {
    const accepted = proposal({
      status: 'accepted',
      latestVersion: 2,
      sharedVersion: 1,
      answer: 'accept',
    });
    const result = shareProposal(accepted, lead({ stage: 'negotiating' }));
    expect(result).toMatchObject({
      kind: 'moved',
      next: { status: 'shared', latestVersion: 2, sharedVersion: 2, answer: null },
      supersedesOthers: true,
    });
  });

  it.each(['proposal', 'negotiating', 'won'] as const)(
    'a lead already at %s is success, and the funnel never runs back',
    (stage) => {
      const result = shareProposal(proposal(), lead({ stage }));
      expect(result).toMatchObject({ kind: 'moved', lead: { lead: { stage }, transitions: [] } });
    },
  );

  it.each(['snoozed', 'dormant'] as const)('a %s lead wakes, then moves', (state) => {
    const result = shareProposal(proposal(), lead({ state, wakeOn: '2026-12-01' }));
    expect(result).toMatchObject({
      kind: 'moved',
      lead: {
        lead: { state: null, wakeOn: null, stage: 'proposal' },
        transitions: [
          { moveKind: 'lifecycle_state', from: state, to: null, cause: 'automation' },
          { moveKind: 'funnel_stage', from: 'qualified', to: 'proposal', cause: 'automation' },
        ],
      },
    });
  });

  it.each([
    ['a draft never generated', proposal({ latestVersion: null }), lead(), 'not_generated'],
    ['a closed lead: reopen it first', proposal(), CLOSED, 'lead_closed'],
    [
      'withdrawn, with nothing newer: nothing revives by itself',
      proposal({ status: 'withdrawn', sharedVersion: 1 }),
      lead(),
      'nothing_new_to_share',
    ],
    [
      'superseded, with nothing newer',
      proposal({ status: 'superseded', sharedVersion: 1 }),
      lead(),
      'nothing_new_to_share',
    ],
  ])('%s is refused', (_, facts, on, refusal) => {
    expect(shareProposal(facts, on)).toEqual({ kind: 'refused', refusal });
  });

  it('a withdrawn proposal returns through a newly shared version', () => {
    const result = shareProposal(
      proposal({ status: 'withdrawn', latestVersion: 2, sharedVersion: 1 }),
      lead(),
    );
    expect(result).toMatchObject({ kind: 'moved', next: { status: 'shared', sharedVersion: 2 } });
  });
});

describe('answerProposal — one answer per version, from the customer’s link (M06-45, F5-43)', () => {
  const atProposal = lead({ stage: 'proposal' });

  it('an Accept on figures no longer current is refused, and nothing moves (F5-47, F8-12)', () => {
    expect(answerProposal(SHARED, atProposal, 'accept', 1, STALE)).toEqual({
      kind: 'refused',
      refusal: 'figures_not_current',
    });
  });

  it.each(['negotiate', 'decline'] as const)(
    'a %s on figures no longer current still stands: it commits no money',
    (answer) => {
      expect(answerProposal(SHARED, atProposal, answer, 1, STALE)).toMatchObject({ kind: 'moved' });
    },
  );

  it('an Accept is recorded, raises Confirm won, and never makes the lead won', () => {
    expect(answerProposal(SHARED, atProposal, 'accept', 1, CURRENT)).toEqual({
      kind: 'moved',
      next: { ...SHARED, status: 'accepted', answer: 'accept' },
      lead: { lead: atProposal, transitions: [] },
      raisesTask: 'proposal_accepted',
      closesFollowUp: true,
      supersedesOthers: false,
    });
  });

  it('a Negotiate moves the lead to negotiating and leaves the proposal shared', () => {
    expect(answerProposal(SHARED, atProposal, 'negotiate', 1, CURRENT)).toMatchObject({
      kind: 'moved',
      next: { status: 'shared', answer: 'negotiate' },
      lead: {
        lead: { stage: 'negotiating' },
        transitions: [
          { moveKind: 'funnel_stage', from: 'proposal', to: 'negotiating', cause: 'automation' },
        ],
      },
      raisesTask: null,
      closesFollowUp: false,
    });
  });

  it('a Decline is recorded, raises its own task, and never marks the lead lost', () => {
    expect(answerProposal(SHARED, atProposal, 'decline', 1, CURRENT)).toMatchObject({
      kind: 'moved',
      next: { status: 'declined', answer: 'decline' },
      lead: { lead: { state: null, stage: 'proposal' }, transitions: [] },
      raisesTask: 'proposal_declined',
      closesFollowUp: true,
    });
  });

  it('an answer wakes a snoozed lead, so its task is never hidden', () => {
    const snoozed = lead({ stage: 'proposal', state: 'snoozed', wakeOn: '2026-12-01' });
    expect(answerProposal(SHARED, snoozed, 'accept', 1, CURRENT)).toMatchObject({
      kind: 'moved',
      lead: { lead: { state: null, wakeOn: null } },
    });
  });

  it.each([
    [
      'a second Accept on an accepted version',
      { ...SHARED, status: 'accepted', answer: 'accept' },
      atProposal,
      1,
      'already_answered',
    ],
    [
      'a Decline after a Negotiate on the same version',
      { ...SHARED, answer: 'negotiate' },
      atProposal,
      1,
      'already_answered',
    ],
    [
      'a version the link no longer serves',
      { ...SHARED, latestVersion: 2, sharedVersion: 2 },
      atProposal,
      1,
      'version_not_current',
    ],
    ['a proposal never shared', proposal(), atProposal, 1, 'not_shared'],
    ['a withdrawn proposal', { ...SHARED, status: 'withdrawn' }, atProposal, 1, 'not_active'],
    ['a superseded proposal', { ...SHARED, status: 'superseded' }, atProposal, 1, 'not_active'],
    ['a lead already lost', SHARED, CLOSED, 1, 'lead_closed'],
    ['a deal already won', SHARED, lead({ stage: 'won' }), 1, 'deal_won'],
  ] as const)('%s is refused, and nothing is recorded', (_, facts, on, version, refusal) => {
    expect(answerProposal(facts, on, 'accept', version, CURRENT)).toEqual({
      kind: 'refused',
      refusal,
    });
  });
});

describe('what a proposal reads when something else moves (M06-45)', () => {
  it.each([
    ['draft', 'draft', 'draft'],
    ['shared', 'superseded', 'withdrawn'],
    ['accepted', 'superseded', 'withdrawn'],
    ['declined', 'superseded', 'withdrawn'],
    ['superseded', 'superseded', 'superseded'],
    ['withdrawn', 'withdrawn', 'withdrawn'],
  ] as const)('%s: a newer one shared → %s; its lead closed → %s', (status, superseded, closed) => {
    expect(statusWhenSuperseded(status)).toBe(superseded);
    expect(statusWhenLeadCloses(status)).toBe(closed);
  });
});

describe('withdrawProposal — a person’s act; nothing withdraws by itself (M06-58)', () => {
  it.each(['draft', 'shared', 'accepted', 'declined'] as const)(
    'a generated %s proposal is withdrawn',
    (status) => {
      const result = withdrawProposal(
        proposal({ status, sharedVersion: status === 'draft' ? null : 1 }),
        lead(),
      );
      expect(result).toMatchObject({
        kind: 'moved',
        next: { status: 'withdrawn' },
        lead: { lead: lead(), transitions: [] },
        closesFollowUp: true,
      });
    },
  );

  it.each([
    ['a draft never generated', proposal({ latestVersion: null }), 'not_generated'],
    ['one already withdrawn', proposal({ status: 'withdrawn' }), 'not_active'],
    ['one already superseded', proposal({ status: 'superseded' }), 'not_active'],
  ])('%s is refused', (_, facts, refusal) => {
    expect(withdrawProposal(facts, lead())).toEqual({ kind: 'refused', refusal });
  });

  it.each(['draft', 'shared', 'accepted'] as const)(
    'a %s proposal on a won lead is refused: the deal is decided, its project runs on it',
    (status) => {
      expect(
        withdrawProposal(proposal({ status, sharedVersion: 1 }), lead({ stage: 'won' })),
      ).toEqual({
        kind: 'refused',
        refusal: 'deal_won',
      });
    },
  );
});
