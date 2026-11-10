'use client';
import type { LeadList, LeadListRow, LeadPipeline } from '@heliogrid/contracts';
import {
  billSortStepped,
  can,
  LEADS_QUERY_SETTLE_MS,
  type LeadSource,
  type LeadStage,
  type LeadsListFilters,
  type LeadsListSort,
  type LeadsListView,
  type LeadsWhose,
  leadsInboxOffered,
  leadsListAskOf,
  leadsListFiltersFor,
  leadsListViewOf,
  leadsPipelineOf,
  leadsWhoseOf,
  offersDoor,
  type Read,
  shellViewFor,
} from '@heliogrid/domain';
import { type InfiniteData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';
import { useSettled } from './use-settled';

/** One page of leads: a screen of rows on a laptop, two thumbs' worth on a phone. */
const LEADS_PAGE = 20;
/** The inbox beside the list is read for its count alone. */
const INBOX_COUNT_ASK = { limit: 1 } as const;

/**
 * The Leads list (`SCR-M02-03`) as both screens draw it, assembled once (Law 11): whose leads, the
 * filters and the order, the pipeline meter, each row's next step, the inbox's count beside it
 * and *Show more*. A filter swaps the rows in place — the last ones stay until the new read lands.
 */
export interface LeadsListScreen {
  /** The reader's shell offers Leads; anyone else meets not found. */
  readonly allowed: boolean;
  /** Whose leads, narrowest first; a single choice draws no switch. */
  readonly whoseChoices: readonly LeadsWhose[];
  /** The inbox is offered beside the list: the reader's scope reaches the unassigned queue. */
  readonly inboxOffered: boolean;
  /** The reader may import leads (`crm.import_leads`): only then is *Import* offered. */
  readonly canImport: boolean;
  /** How many wait in the inbox; null while it is read, failed, or not offered. */
  readonly inboxWaiting: number | null;
  /** The filters as set — the query as typed, ahead of the read it settles into. */
  readonly filters: LeadsListFilters;
  /** Loading, failed with its retry, the first run (`empty`), or the list — no match included. */
  readonly read: Read<LeadsListView<LeadListRow>>;
  /** A filter's read is out while the last rows stay shown. */
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  showMore(): void;
  setWhose(whose: LeadsWhose): void;
  /** A stage of the meter: filters to it, or clears it when it is the one already chosen. */
  pickStage(stage: LeadStage): void;
  toggleDormant(): void;
  setSource(source: LeadSource | null): void;
  setSort(sort: LeadsListSort): void;
  /** The phone's Bill chip: largest first, smallest first, then newest first again. */
  stepBillSort(): void;
  setQuery(query: string): void;
  /** Every filter off and the widest choice of whose leads; the order stays. */
  clearFilters(): void;
}

export function useLeadsListScreen(): LeadsListScreen {
  const { user, chosenHome } = useSession();
  const queryClient = useQueryClient();
  const repositories = useRepositories();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles ?? [];
  const rolesKey = roles.join();
  // biome-ignore lint/correctness/useExhaustiveDependencies: the choices follow the held roles, keyed by their joined names
  const whose = useMemo(() => leadsWhoseOf(roles), [rolesKey]);
  const allowed = offersDoor(shellViewFor(roles, chosenHome), 'leads');
  const inboxOffered = leadsInboxOffered(roles);
  /* The person's own choice of whose leads, once made; until then the widest the roles hold, which
     the session may name only after the screen mounts. */
  const [chosenWhose, setWhose] = useState<LeadsWhose | null>(null);
  const [narrowing, setFilters] = useState<LeadsListFilters>(() => leadsListFiltersFor(whose));
  const filters: LeadsListFilters = {
    ...narrowing,
    whose:
      chosenWhose !== null && whose.includes(chosenWhose)
        ? chosenWhose
        : leadsListFiltersFor(whose).whose,
  };
  const settledQuery = useSettled(filters.query, LEADS_QUERY_SETTLE_MS);
  const ask = leadsListAskOf({ ...filters, query: settledQuery }, user?.id ?? '', whose);
  const key = queryKeys.crm.leads(tenantId, ask);
  const list = usePaginatedList<LeadListRow>({
    queryKey: key,
    fetchPage: (page) => repositories.leads.list({ ...ask, limit: LEADS_PAGE, page }),
    enabled: tenantId !== '' && allowed,
    keepPreviousWhileLoading: true,
  });
  /* The meter rides on each page; while a filter's first page is out, the last one counted holds. */
  const answered = queryClient.getQueryData<InfiniteData<LeadList>>(key)?.pages.at(-1);
  const pipeline = useLastPipeline(answered?.pipeline);
  const inbox = useQuery({
    queryKey: queryKeys.crm.inbox(tenantId, INBOX_COUNT_ASK),
    queryFn: ({ signal }) => repositories.leads.inbox(INBOX_COUNT_ASK, signal),
    enabled: tenantId !== '' && allowed && inboxOffered,
    select: (page) => page.totalCount,
  });

  const read = listReadOf(list.read, () =>
    pipeline === null
      ? undefined
      : leadsListViewOf(
          list.shown,
          { matching: list.totalCount, pipeline: leadsPipelineOf(pipeline) },
          filters,
          whose,
          Date.now(),
        ),
  );
  const change = (next: Partial<LeadsListFilters>) => setFilters((now) => ({ ...now, ...next }));

  return {
    allowed,
    whoseChoices: whose,
    inboxOffered,
    canImport: can(roles, 'crm.import_leads'),
    inboxWaiting: inbox.data ?? null,
    filters,
    read,
    refreshing: list.read.kind === 'ready' && answered === undefined,
    loadingMore: list.isFetchingNextPage,
    showMore: () => {
      if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
    },
    setWhose,
    pickStage: (stage) =>
      setFilters((now) => ({ ...now, stage: now.stage === stage ? null : stage })),
    toggleDormant: () => setFilters((now) => ({ ...now, dormant: !now.dormant })),
    setSource: (source) => change({ source }),
    setSort: (sort) => change({ sort }),
    stepBillSort: () => setFilters((now) => ({ ...now, sort: billSortStepped(now.sort) })),
    setQuery: (query) => change({ query }),
    clearFilters: () => {
      setWhose(null);
      setFilters((now) => ({ ...leadsListFiltersFor(whose), sort: now.sort }));
    },
  };
}

/**
 * The list's read once its rows are in: the first run reads as `empty`; a page with no pipeline
 * counted yet is still loading.
 */
function listReadOf<V>(rows: Read<unknown>, viewOf: () => V | null | undefined): Read<V> {
  if (rows.kind !== 'ready') return rows;
  const view = viewOf();
  if (view === undefined) return { kind: 'loading' };
  return view === null ? { kind: 'empty' } : { kind: 'ready', value: view };
}

/** The pipeline last counted — held across a filter's read, so the meter never blanks. */
function useLastPipeline(counted: LeadPipeline | undefined): LeadPipeline | null {
  const last = useRef<LeadPipeline | null>(null);
  if (counted !== undefined) last.current = counted;
  return last.current;
}
