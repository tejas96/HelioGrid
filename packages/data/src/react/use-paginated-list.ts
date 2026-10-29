'use client';
import type { Paginated } from '@heliogrid/contracts';
import { mapRead, type Read } from '@heliogrid/domain';
import { keepPreviousData, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { readFailureOf, readOf } from './read';

interface PaginatedListOptions<TItem extends { id: string }> {
  queryKey: QueryKey;
  fetchPage: (page: number) => Promise<Paginated<TItem>>;
  enabled?: boolean;
  /**
   * While a new key's first page loads, keep showing the last key's pages — a filter change then
   * swaps the list in place instead of blanking it to a skeleton.
   */
  keepPreviousWhileLoading?: boolean;
}

/**
 * ACCUMULATING pagination — RN infinite scroll, web load-more (foundation-dx spec §4.3).
 * Flattened `items` dedupe by id: a row inserted mid-scroll shifts pages, and without the
 * dedupe it would render twice. For numbered-pager tables use usePagedList instead.
 */
export function usePaginatedList<TItem extends { id: string }>({
  queryKey,
  fetchPage,
  enabled,
  keepPreviousWhileLoading = false,
}: PaginatedListOptions<TItem>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // An empty page ends the list even when totalCount disagrees. The recipe counts rows
      // and totals in two separate queries (apps/api/CLAUDE.md), so a concurrent delete can
      // leave totalCount above what the table will actually yield — without this the button
      // stays live forever and every press fetches another empty page.
      if (lastPage.items.length === 0) {
        return undefined;
      }
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0);
      return loaded < lastPage.totalCount ? lastPageParam + 1 : undefined;
    },
    enabled,
    placeholderData: keepPreviousWhileLoading ? keepPreviousData : undefined,
  });

  /* One array per answer, so a screen that memoises on the rows redraws only when they move. */
  const items = useMemo(
    () => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []),
    [query.data],
  );
  /* A next page is a new read, not a re-read of what is shown: when it fails the list says so and
   *Try again* reads the list again (`F7-23` N10). */
  const read: Read<readonly TItem[]> = query.isFetchNextPageError
    ? { kind: 'failed', failure: readFailureOf(query.error), retry: () => void query.refetch() }
    : mapRead(readOf(query), () => items);

  return {
    /** Ready once the first page is in; failed when a later page fails. */
    read,
    /** The rows of the pages already in, whatever the next page did. */
    shown: items,
    totalCount: query.data?.pages.at(-1)?.totalCount ?? 0,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    /** The next page failed while the pages already shown stand. */
    isFetchNextPageError: query.isFetchNextPageError,
  };
}

function dedupeById<TItem extends { id: string }>(rows: readonly TItem[]): TItem[] {
  const seen = new Set<string>();
  const out: TItem[] = [];
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      out.push(row);
    }
  }
  return out;
}
