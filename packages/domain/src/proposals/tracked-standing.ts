import type { ForecastStage } from './forecast-stage';
import type { ProposalStatus } from './vocabulary';

/**
 * Where a proposal stands as a person reads it (`M06-54`, `T-M06-018`, `T-M06-019`): one word a
 * list row, the detail's hero and a search result all show — a mark, a word and a tint, never a
 * colour alone. Derived from the status and the link's own evidence, never stored.
 */
export const PROPOSAL_STANDINGS = [
  'draft',
  'ready',
  'shared',
  'opened',
  'negotiating',
  'accepted',
  'declined',
  'won',
  'replaced',
  'withdrawn',
] as const;
export type ProposalStanding = (typeof PROPOSAL_STANDINGS)[number];

export interface StandingEvidence {
  readonly status: ProposalStatus;
  /** A version exists: the proposal was generated at least once. */
  readonly generated: boolean;
  /** The customer opened the link since the version it serves was shared (`F5-27`). */
  readonly opened: boolean;
  /** The customer asked for a change on the version the link serves, and no newer one is shared. */
  readonly changeAsked: boolean;
  /** The proposal's lead was marked won: its deal has a project. */
  readonly won: boolean;
}

/** The one standing a proposal shows. Opens are the product's own evidence; nothing reads "delivered" (`F5-28`). */
export function proposalStandingOf(evidence: StandingEvidence): ProposalStanding {
  switch (evidence.status) {
    case 'draft':
      return evidence.generated ? 'ready' : 'draft';
    case 'shared':
      // A version shared after Won only waits to be put in force: the link answers nothing more.
      if (evidence.won) return 'won';
      if (evidence.changeAsked) return 'negotiating';
      return evidence.opened ? 'opened' : 'shared';
    case 'accepted':
      return evidence.won ? 'won' : 'accepted';
    case 'declined':
      return 'declined';
    case 'superseded':
      return 'replaced';
    case 'withdrawn':
      return 'withdrawn';
  }
}

/** The proposals list's quick filters (`T-M06-019`), in the order its chips are drawn. */
export const PROPOSAL_LIST_FILTERS = ['all', 'waiting', 'draft', 'accepted', 'closed'] as const;
export type ProposalListFilter = (typeof PROPOSAL_LIST_FILTERS)[number];

const FILTER_OF: Readonly<Record<ProposalStanding, Exclude<ProposalListFilter, 'all'>>> = {
  draft: 'draft',
  ready: 'draft',
  shared: 'waiting',
  opened: 'waiting',
  negotiating: 'waiting',
  accepted: 'accepted',
  won: 'accepted',
  declined: 'closed',
  replaced: 'closed',
  withdrawn: 'closed',
};

/**
 * The chip a proposal sits under, from its status and whether its deal is won alone — what the
 * link saw never moves a proposal between chips, so a database filter can hold this rule.
 */
export function listFilterOf(
  status: ProposalStatus,
  won: boolean,
): Exclude<ProposalListFilter, 'all'> {
  return FILTER_OF[
    proposalStandingOf({ status, won, generated: false, opened: false, changeAsked: false })
  ];
}

/** Whether a proposal belongs under a filter chip: with the customer, not yet sent, said yes, or closed. */
export function matchesListFilter(standing: ProposalStanding, filter: ProposalListFilter): boolean {
  return filter === 'all' || FILTER_OF[standing] === filter;
}

const FORECAST_OF: Partial<Record<ProposalStanding, ForecastStage>> = {
  shared: 'shared',
  opened: 'shared',
  negotiating: 'negotiating',
  accepted: 'accepted',
};

/**
 * Where an open proposal sits in the forecast (`M13-03`), or `null` for one that prices nothing
 * yet or is closed — a draft, a won deal (it is revenue, never forecast), a declined one.
 */
export function forecastStageOf(standing: ProposalStanding): ForecastStage | null {
  return FORECAST_OF[standing] ?? null;
}
