import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LINK_SCOPES,
  effectiveRights,
  type LinkFacts,
  linkPhaseOf,
  linkServing,
  mayRespond,
} from '../../src/customer-link/rights';
import { LINK_CEILINGS, LINK_SCOPES } from '../../src/customer-link/vocabulary';

describe('linkPhaseOf — read from the deal, never stored (F5-19)', () => {
  it.each([
    [null, 'proposal'],
    ['won', 'progress'],
    ['installation', 'progress'],
    ['incentive_claimed', 'progress'],
    ['cancelled', 'progress'],
    ['handed_over', 'handover'],
  ] as const)('a project at %s is the %s phase', (stage, phase) => {
    expect(linkPhaseOf(stage)).toBe(phase);
  });
});

describe('effectiveRights — the token’s scopes ∩ the phase (F5-21)', () => {
  it.each([
    ['proposal', ['view_proposal', 'respond']],
    ['progress', ['view_progress']],
    ['handover', ['view_handover_pack']],
  ] as const)('a full token in the %s phase grants %j', (phase, rights) => {
    expect(effectiveRights(DEFAULT_LINK_SCOPES, phase)).toEqual(rights);
  });

  it('a respond scope grants nothing once the deal is past the proposal', () => {
    expect(effectiveRights(['respond'], 'progress')).toEqual([]);
    expect(effectiveRights(['respond'], 'handover')).toEqual([]);
  });

  it('a token never grants what it does not carry', () => {
    expect(effectiveRights(['view_proposal'], 'proposal')).toEqual(['view_proposal']);
    expect(effectiveRights([], 'proposal')).toEqual([]);
  });

  it('a new link carries all four scopes', () => {
    expect(DEFAULT_LINK_SCOPES).toEqual(LINK_SCOPES);
  });
});

const ACTIVE = { status: 'active', tokenRevoked: false, scopes: DEFAULT_LINK_SCOPES } as const;

function facts(over: Partial<LinkFacts> = {}): LinkFacts {
  return {
    link: ACTIVE,
    viewsInWindow: 1,
    leadState: null,
    projectStage: null,
    proposalStatus: 'shared',
    ...over,
  };
}

describe('linkServing — it serves, or it fails honestly (F5-25, F5-76, F5-78)', () => {
  it('a shared proposal serves the proposal, with both rights', () => {
    expect(linkServing(facts())).toEqual({
      kind: 'serves',
      phase: 'proposal',
      rights: ['view_proposal', 'respond'],
    });
  });

  it.each(['accepted', 'declined'] as const)(
    'an %s proposal still serves: the page shows the answer',
    (status) => {
      expect(linkServing(facts({ proposalStatus: status })).kind).toBe('serves');
    },
  );

  it.each([
    ['a token the product never minted', { link: null }, 'revoked'],
    ['a revoked token dies at once', { link: { ...ACTIVE, tokenRevoked: true } }, 'revoked'],
    ['a revoked link', { link: { ...ACTIVE, status: 'revoked' as const } }, 'revoked'],
    ['a legacy-expired link', { link: { ...ACTIVE, status: 'expired' as const } }, 'revoked'],
    ['the 61st view in the hour', { viewsInWindow: LINK_CEILINGS.viewsPerHour + 1 }, 'busy'],
    ['a lost lead', { leadState: 'lost' as const }, 'ended'],
    ['a disqualified lead', { leadState: 'disqualified' as const }, 'ended'],
    ['a junk lead', { leadState: 'junk' as const }, 'ended'],
    [
      'a proposal a person withdrew on an open lead',
      { proposalStatus: 'withdrawn' as const },
      'none',
    ],
    [
      'a superseded proposal with nothing shared in its place',
      { proposalStatus: 'superseded' as const },
      'none',
    ],
    ['a reopened lead with only a draft', { proposalStatus: 'draft' as const }, 'none'],
    ['no proposal at all', { proposalStatus: null }, 'none'],
  ])('%s → %s', (_, over, reason) => {
    expect(linkServing(facts(over))).toEqual({ kind: 'fails', reason });
  });

  it('the 60th view in the hour still serves', () => {
    expect(linkServing(facts({ viewsInWindow: LINK_CEILINGS.viewsPerHour })).kind).toBe('serves');
  });

  it('a revoked link says revoked even when it is also over its ceiling', () => {
    expect(
      linkServing(facts({ link: { ...ACTIVE, tokenRevoked: true }, viewsInWindow: 999 })),
    ).toEqual({
      kind: 'fails',
      reason: 'revoked',
    });
  });

  it('a snoozed or dormant lead is open: its link serves', () => {
    expect(linkServing(facts({ leadState: 'snoozed' })).kind).toBe('serves');
    expect(linkServing(facts({ leadState: 'dormant' })).kind).toBe('serves');
  });

  it.each([
    ['a won deal', 'installation', 'progress', ['view_progress']],
    [
      'a cancelled project keeps serving its honest state',
      'cancelled',
      'progress',
      ['view_progress'],
    ],
    [
      'a handed-over project is the solar file, for life',
      'handed_over',
      'handover',
      ['view_handover_pack'],
    ],
  ] as const)('%s', (_, projectStage, phase, rights) => {
    expect(linkServing(facts({ projectStage, proposalStatus: null }))).toEqual({
      kind: 'serves',
      phase,
      rights,
    });
  });
});

describe('mayRespond — five respond acts in the hour, and only in the proposal phase (F5-78)', () => {
  it.each([
    [['view_proposal', 'respond'], 0, true],
    [['view_proposal', 'respond'], 4, true],
    [['view_proposal', 'respond'], 5, false],
    [['view_progress'], 0, false],
  ] as const)('rights %j with %i sent → %s', (rights, sent, may) => {
    expect(mayRespond(rights, sent)).toBe(may);
  });
});
