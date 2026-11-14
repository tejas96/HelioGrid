'use client';
import type { ProposalList, ProposalRow } from '@heliogrid/contracts';
import { offersDoor, type ProposalListFilter, type Read, shellViewFor } from '@heliogrid/domain';
import { type NewProposalFlow, useNewProposalFlow } from './use-new-proposal-flow';
import { useProposalList } from './use-proposal-list';
import { useSession } from './use-session';

/** Where the list leads: a proposal's track screen, or the builder for a draft. */
export interface ProposalListMoves {
  toProposal(proposalId: string): void;
  toBuilder(proposalId: string): void;
}

export interface ProposalListScreen {
  /**
   * The reader may open the list: a proposal is seen with its lead (`F2.M02.lead-visibility`), so
   * whoever is offered Leads or Proposals may; anyone else meets the page that does not exist.
   */
  readonly allowed: boolean;
  /** The rows in, with the chips' counts — what `ProposalList` draws. */
  readonly read: Exclude<Read<ProposalList>, { readonly kind: 'empty' }>;
  readonly filter: ProposalListFilter;
  setFilter(filter: ProposalListFilter): void;
  /** How many proposals wait on a customer, and what they are worth together — the page's summary. */
  readonly waiting: { readonly count: number; readonly value: string } | null;
  /** *New proposal* and the copy act are offered only to who can save the lead it starts with. */
  readonly canStart: boolean;
  open(row: ProposalRow): void;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  showMore(): void;
  /** A pull on the list: read again, `pulled` while it is out. */
  readonly pulled: boolean;
  refresh(): void;
  /** The screen is back in view: a list read past its freshness is read again. */
  refreshIfStale(): void;
  readonly flow: NewProposalFlow;
}

/**
 * The proposals list (`SCR-M06-19`, `M06-48`): every proposal the reader's leads hold, under one
 * chip at a time; a draft opens in the builder and any other on its track screen.
 */
export function useProposalListScreen(moves: ProposalListMoves): ProposalListScreen {
  const { user, chosenHome } = useSession();
  const shell = shellViewFor(user?.tenant?.roles ?? [], chosenHome);
  const list = useProposalList();
  const flow = useNewProposalFlow(moves);
  const { head } = list;
  return {
    allowed: offersDoor(shell, 'proposals') || offersDoor(shell, 'leads'),
    read: wholeRead(list.read, head, list.totalCount),
    filter: list.filter,
    setFilter: list.setFilter,
    waiting: head === null ? null : { count: head.counts.waiting, value: head.waitingValue },
    canStart: head?.canStart === true,
    open: (row) => (row.number === null ? moves.toBuilder(row.id) : moves.toProposal(row.id)),
    hasMore: list.hasMore,
    loadingMore: list.loadingMore,
    showMore: list.showMore,
    pulled: list.pulled,
    refresh: list.refresh,
    refreshIfStale: list.refreshIfStale,
    flow,
  };
}

/** The rows and their head as the one list the wire sends: no rows is still a list, with its chips. */
function wholeRead(
  rows: Read<readonly ProposalRow[]>,
  head: ReturnType<typeof useProposalList>['head'],
  totalCount: number,
): ProposalListScreen['read'] {
  if (rows.kind === 'failed') return rows;
  if (rows.kind === 'loading' || head === null) return { kind: 'loading' };
  const items = rows.kind === 'ready' ? [...rows.value] : [];
  return { kind: 'ready', value: { ...head, rows: { items, totalCount } } };
}
