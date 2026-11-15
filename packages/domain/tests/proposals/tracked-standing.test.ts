import { describe, expect, it } from 'vitest';
import {
  forecastStageOf,
  listFilterOf,
  matchesListFilter,
  PROPOSAL_STANDINGS,
  proposalStandingOf,
  type StandingEvidence,
} from '../../src/proposals/tracked-standing';

const evidence = (over: Partial<StandingEvidence>): StandingEvidence => ({
  status: 'draft',
  generated: false,
  opened: false,
  changeAsked: false,
  won: false,
  ...over,
});

describe('proposalStandingOf — one word for where a proposal stands (M06-54)', () => {
  it.each([
    [{}, 'draft'],
    [{ generated: true }, 'ready'],
    [{ status: 'shared', generated: true }, 'shared'],
    [{ status: 'shared', generated: true, opened: true }, 'opened'],
    [{ status: 'shared', generated: true, opened: true, changeAsked: true }, 'negotiating'],
    [{ status: 'accepted', generated: true, opened: true }, 'accepted'],
    [{ status: 'accepted', generated: true, opened: true, won: true }, 'won'],
    // A later version shared on a won deal (to put it in force) leaves the deal won.
    [{ status: 'shared', generated: true, won: true }, 'won'],
    [{ status: 'shared', generated: true, opened: true, won: true }, 'won'],
    [{ status: 'shared', generated: true, opened: true, changeAsked: true, won: true }, 'won'],
    [{ generated: true, won: true }, 'ready'],
    [{ status: 'declined', generated: true, won: true }, 'declined'],
    [{ status: 'superseded', generated: true, won: true }, 'replaced'],
    [{ status: 'withdrawn', generated: true, won: true }, 'withdrawn'],
    [{ status: 'declined', generated: true }, 'declined'],
    [{ status: 'superseded', generated: true }, 'replaced'],
    [{ status: 'withdrawn', generated: true }, 'withdrawn'],
  ] as const)('%o reads %s', (over, standing) => {
    expect(proposalStandingOf(evidence(over))).toBe(standing);
  });
});

describe('matchesListFilter — the list’s chips (T-M06-019)', () => {
  it.each([
    ['draft', ['draft', 'ready']],
    ['waiting', ['shared', 'opened', 'negotiating']],
    ['accepted', ['accepted', 'won']],
    ['closed', ['declined', 'replaced', 'withdrawn']],
    ['all', [...PROPOSAL_STANDINGS]],
  ] as const)('%s holds %j', (filter, standings) => {
    expect(PROPOSAL_STANDINGS.filter((standing) => matchesListFilter(standing, filter))).toEqual(
      PROPOSAL_STANDINGS.filter((standing) => (standings as readonly string[]).includes(standing)),
    );
  });
});

describe('listFilterOf — the chip a proposal sits under, from its status and its deal (T-M06-019)', () => {
  it.each([
    ['draft', false, 'draft'],
    ['draft', true, 'draft'],
    ['shared', false, 'waiting'],
    ['shared', true, 'accepted'],
    ['accepted', false, 'accepted'],
    ['accepted', true, 'accepted'],
    ['declined', true, 'closed'],
    ['superseded', false, 'closed'],
    ['withdrawn', true, 'closed'],
  ] as const)('%s, won %s → %s', (status, won, filter) => {
    expect(listFilterOf(status, won)).toBe(filter);
  });
});

describe('forecastStageOf — only an open, priced proposal is forecast (M13-03)', () => {
  it.each([
    ['draft', null],
    ['ready', null],
    ['shared', 'shared'],
    ['opened', 'shared'],
    ['negotiating', 'negotiating'],
    ['accepted', 'accepted'],
    ['won', null],
    ['declined', null],
    ['replaced', null],
    ['withdrawn', null],
  ] as const)('%s → %s', (standing, stage) => {
    expect(forecastStageOf(standing)).toBe(stage);
  });
});
