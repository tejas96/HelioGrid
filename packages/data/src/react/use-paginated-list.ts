'use client';
import type { Paginated } from '@heliogrid/contracts';
import { type QueryKey, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface PaginatedListOptions<TItem extends { id: string }> {
  queryKey: QueryKey;
  fetchPage: (page: number) => Promise<Paginated<TItem>>;
  enabled?: boolean;
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
  });

  const items = useMemo(
    () => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []),
    [query.data],
  );

  return {
    items,
    totalCount: query.data?.pages.at(-1)?.totalCount ?? 0,
    status: query.status,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
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
