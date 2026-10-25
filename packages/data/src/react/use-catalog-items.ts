'use client';
import { DEFAULT_PAGE_LIMIT, type ResolvedCatalogItemWire } from '@heliogrid/contracts';
import {
  badgedSchemesOf,
  type CatalogFilter,
  type CatalogSort,
  catalogTeaches,
  holdsOutright,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import type { CatalogItemsAsk } from '../catalog/repository';
import { useRepositories } from './context';
import { companyRead } from './shell-reads';
import { ownersRead } from './use-owners';
import { usePagedList } from './use-paged-list';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/** What the list is narrowed and ordered by — the screen's state, the server's question. */
export interface CatalogView {
  readonly q: string;
  readonly filter: CatalogFilter;
  readonly sort: CatalogSort;
}

/**
 * The list's question: Catalog settings always keeps hidden items (`M01-37` — hide reaches
 * pickers, never this list), and a flag that is off is no filter at all.
 */
export function catalogAskOf(view: CatalogView, page: number, limit: number): CatalogItemsAsk {
  const { filter } = view;
  const q = view.q.trim();
  return {
    page,
    limit,
    sort: view.sort,
    includeHidden: 'true',
    ...(q === '' ? {} : { q }),
    ...(filter.source === null ? {} : { source: filter.source }),
    ...(filter.kinds.length === 0 ? {} : { kinds: filter.kinds.join(',') }),
    ...(filter.wattMin === null ? {} : { wattMin: filter.wattMin }),
    ...(filter.wattMax === null ? {} : { wattMax: filter.wattMax }),
    ...(filter.technology === null ? {} : { technology: filter.technology }),
    ...(filter.schemes.length === 0 ? {} : { schemes: filter.schemes.join(',') }),
    ...(filter.preferredOnly ? { preferred: 'true' } : {}),
    ...(filter.archived ? { archived: 'true' } : {}),
  };
}

/**
 * The item just added stands first, once (`SCR-M01-16` decision 1): a page that brings it back
 * after the catalog refreshes drops its own copy, so the list never names it twice.
 */
function pinnedFirst<Item extends { readonly id: string }>(
  items: readonly Item[],
  added: Item | null,
): readonly Item[] {
  if (added === null) return items;
  /* Once the page reads it back, the fresh copy stands first: a star or a price set on it shows. */
  const shown = items.find((item) => item.id === added.id) ?? added;
  return [shown, ...items.filter((item) => item.id !== added.id)];
}

/** One numbered page of the list — the 1536 table and its pager — with the added item first. */
export function useCatalogPage(
  view: CatalogView,
  page: number,
  added: ResolvedCatalogItemWire | null = null,
) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const list = usePagedList({
    queryKey: queryKeys.catalog.items(tenantId, { ...view, mode: 'page' }),
    fetchPage: (n) => repositories.catalog.items(catalogAskOf(view, n, DEFAULT_PAGE_LIMIT)),
    page,
    enabled: tenantId !== '',
  });
  const items = useMemo(() => pinnedFirst(list.items, added), [list.items, added]);
  return { ...list, items };
}

/** The list growing as the person scrolls — the phone's cards — with the added item first. */
export function useCatalogScroll(view: CatalogView, added: ResolvedCatalogItemWire | null = null) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const list = usePaginatedList({
    queryKey: queryKeys.catalog.items(tenantId, { ...view, mode: 'scroll' }),
    fetchPage: (n) => repositories.catalog.items(catalogAskOf(view, n, DEFAULT_PAGE_LIMIT)),
    enabled: tenantId !== '',
    keepPreviousWhileLoading: true,
  });
  const items = useMemo(() => pinnedFirst(list.items, added), [list.items, added]);
  return { ...list, items };
}

/**
 * Every item the company changed — its own SKUs and the platform items its override sets something
 * on — by name: the Rates panel's attribution table. Under the items prefix, so every catalog act
 * refreshes it.
 */
export function useCatalogChanged(enabled: boolean) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  return usePaginatedList({
    queryKey: queryKeys.catalog.items(tenantId, { mode: 'changed' }),
    fetchPage: (n) =>
      repositories.catalog.items({
        page: n,
        limit: DEFAULT_PAGE_LIMIT,
        changed: 'true',
        sort: 'name',
      }),
    enabled: enabled && tenantId !== '',
  });
}

export interface CatalogFacts {
  /** Every administration act is offered (`F2.M01.manage-catalog` outright). */
  readonly administers: boolean;
  /** The market's declared schemes; empty draws no compliance column and no scheme filter. */
  readonly schemes: readonly string[];
  readonly release: { readonly label: string; readonly publishedAt: string } | null;
  readonly teaches: boolean;
  readonly archivedCount: number;
  /** Every item of the slice and the tenant, hidden ones included: the *Items* tab's figure. */
  readonly allCount: number;
  readonly owners: { readonly names: readonly string[]; readonly more: number } | null;
  readonly surface: 'loading' | 'error' | 'ready';
  retry(): void;
}

/** The page's counts, counted as the list counts — hidden items included, as settings lists them. */
const COUNT_ASKS: Record<'all' | 'archived' | 'changed', CatalogItemsAsk> = {
  all: { page: 1, limit: 1, includeHidden: 'true' },
  archived: { page: 1, limit: 1, includeHidden: 'true', archived: 'true' },
  changed: { page: 1, limit: 1, changed: 'true' },
};

/** The page's own facts beside the list: who may act, the market's schemes, the strip and counts. */
export function useCatalogFacts(): CatalogFacts {
  const repositories = useRepositories();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const reading = tenantId !== '';
  const administers = holdsOutright(user?.tenant?.roles ?? [], 'onboarding.manage_catalog');
  const company = useQuery(companyRead(repositories, tenantId, reading));
  const marketCode = company.data?.marketCode;
  const pack = useQuery({
    queryKey: queryKeys.market.pack(marketCode ?? ''),
    queryFn: ({ signal }) => repositories.market.currentPack(marketCode ?? '', signal),
    enabled: marketCode !== undefined,
  });
  const releases = useQuery({
    queryKey: queryKeys.catalog.releases(tenantId),
    queryFn: ({ signal }) => repositories.catalog.releases({ page: 1, limit: 1 }, signal),
    enabled: reading,
  });
  const counted = (of: keyof typeof COUNT_ASKS) => ({
    queryKey: queryKeys.catalog.count(tenantId, of),
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      (await repositories.catalog.items(COUNT_ASKS[of], signal)).totalCount,
    enabled: reading,
  });
  const archived = useQuery(counted('archived'));
  const changed = useQuery(counted('changed'));
  const all = useQuery(counted('all'));
  const owners = useQuery(ownersRead(repositories, tenantId, reading && !administers));

  const reads = [company, pack, releases, archived, changed, all] as const;
  const failed = reads.some((read) => read.isError) || owners.isError;
  const pending = reads.some((read) => read.isPending);
  const schemes = useMemo(
    () => badgedSchemesOf(pack.data?.certificationSchemes) ?? [],
    [pack.data],
  );
  const retry = useCallback(() => {
    for (const read of [company, pack, releases, archived, changed, all, owners]) {
      if (read.isError) void read.refetch();
    }
  }, [company, pack, releases, archived, changed, all, owners]);
  const latest = releases.data?.items[0];
  return {
    administers,
    schemes,
    release: latest ? { label: latest.label, publishedAt: latest.publishedAt } : null,
    teaches: catalogTeaches({
      releases: releases.data?.totalCount ?? 0,
      changedItems: changed.data ?? 0,
    }),
    archivedCount: archived.data ?? 0,
    allCount: all.data ?? 0,
    owners: owners.data
      ? { names: owners.data.owners.map((owner) => owner.name), more: owners.data.more }
      : null,
    surface: failed ? 'error' : pending ? 'loading' : 'ready',
    retry,
  };
}
