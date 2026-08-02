'use client';
import { DEFAULT_PAGE_LIMIT, type Paginated } from '@heliogrid/contracts';
import { keepPreviousData, type QueryKey, useQuery } from '@tanstack/react-query';

interface PagedListOptions<TItem> {
  queryKey: QueryKey;
  fetchPage: (page: number) => Promise<Paginated<TItem>>;
  page: number;
  /** Must match the limit `fetchPage` requests — pageCount is derived from it. */
  limit?: number;
  enabled?: boolean;
}

/**
 * SINGLE-PAGE pagination — web numbered-pager tables (foundation-dx spec §4.3).
 * keepPreviousData keeps the old page rendered while the next loads, so page flips never
 * flash empty. For infinite scroll / load-more use usePaginatedList instead.
 */
export function usePagedList<TItem>({
  queryKey,
  fetchPage,
  page,
  limit = DEFAULT_PAGE_LIMIT,
  enabled,
}: PagedListOptions<TItem>) {
  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => fetchPage(page),
    placeholderData: keepPreviousData,
    enabled,
  });

  const totalCount = query.data?.totalCount ?? 0;
  return {
    items: query.data?.items ?? [],
    totalCount,
    pageCount: Math.ceil(totalCount / limit),
    status: query.status,
    error: query.error,
    isPlaceholderData: query.isPlaceholderData,
    refetch: query.refetch,
  };
}
