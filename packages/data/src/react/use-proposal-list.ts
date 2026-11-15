'use client';
import type { ProposalList, ProposalListFilter, ProposalRow } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { type InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useTenantId } from './use-tenant-id';

/** One page of proposals: a screen of rows on a laptop, two thumbs' worth on a phone. */
const PROPOSALS_PAGE = 20;

/** What rides on every page beside its rows: each chip's count and what the waiting ones are worth. */
export type ProposalListHead = Pick<
  ProposalList,
  'counts' | 'waitingValue' | 'canStart' | 'currencyCode'
>;

type Page = ProposalList['rows'] & { readonly head: ProposalListHead };

/**
 * The proposals list (`SCR-M06-19`): the proposals of the leads the reader may see, under one
 * filter chip at a time, with every chip's count whatever chip is on. A chip swaps the rows in
 * place — the last ones stay until the new read lands.
 */
export interface ProposalListRead {
  readonly filter: ProposalListFilter;
  setFilter(filter: ProposalListFilter): void;
  /** Loading, failed with its retry, or the rows of the pages in — none included. */
  readonly read: Read<readonly ProposalRow[]>;
  /** How many match the chip that is on. */
  readonly totalCount: number;
  /** The counts, the waiting value and whether *New proposal* is offered; `null` until a page is in. */
  readonly head: ProposalListHead | null;
  /** A chip's read is out while the last rows stay shown. */
  readonly refreshing: boolean;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  showMore(): void;
  /** A pull: the rows in are read again, and `pulled` holds while that read is out. */
  readonly pulled: boolean;
  refresh(): void;
  /**
   * The screen came back into view: rows read past the cache's freshness are read again, so a
   * proposal made elsewhere appears without a pull; fresh rows are left alone.
   */
  refreshIfStale(): void;
}

export function useProposalList(): ProposalListRead {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const [filter, setFilter] = useState<ProposalListFilter>('all');
  const key = queryKeys.proposals.list(tenantId, { filter });
  const list = usePaginatedList<ProposalRow>({
    queryKey: key,
    fetchPage: async (page): Promise<Page> => {
      const { rows, ...head } = await repositories.proposals.list({
        filter,
        limit: PROPOSALS_PAGE,
        page,
      });
      return { ...rows, head };
    },
    enabled: tenantId !== '',
    keepPreviousWhileLoading: true,
  });
  /* The head rides on each page; while a chip's first page is out, the last one read holds. */
  const answered = queryClient.getQueryData<InfiniteData<Page>>(key)?.pages.at(-1);
  const lastHead = useRef<ProposalListHead | null>(null);
  if (answered !== undefined) lastHead.current = answered.head;

  return {
    filter,
    setFilter,
    read: list.read,
    totalCount: list.totalCount,
    head: lastHead.current,
    refreshing: list.read.kind === 'ready' && answered === undefined,
    hasMore: list.hasNextPage,
    loadingMore: list.isFetchingNextPage,
    showMore: () => {
      if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
    },
    pulled: list.pulling,
    refresh: list.pull,
    refreshIfStale: () => void queryClient.refetchQueries({ queryKey: key, stale: true }),
  };
}
