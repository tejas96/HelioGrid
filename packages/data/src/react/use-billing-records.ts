'use client';
import type {
  BillingDocumentRow,
  BillingDocuments,
  BillingHistory,
  BillingReminders,
} from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { type InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';

/** A page of a record list; more arrive on *Show more*, never all at once. */
const PAGE = 50;

/** The invoice list's chips (decision 12). */
export type DocumentChip = 'all' | 'paid' | 'failed';

/** A record list as both screens draw it: its rows, and whether more remain. */
export interface BillingList<T> {
  readonly read: Read<readonly T[]>;
  readonly total: number;
  readonly more: boolean;
  showMore(): void;
}

export interface BillingDocumentsList extends BillingList<BillingDocumentRow> {
  readonly query: string;
  readonly chip: DocumentChip;
  /** Each chip's count under the search; zeros until the first page answers. */
  readonly counts: BillingDocuments['counts'];
  search(query: string): void;
  choose(chip: DocumentChip): void;
}

const NO_COUNTS: BillingDocuments['counts'] = { all: 0, paid: 0, failed: 0 };

/** Every invoice and credit note, searched and filtered on the server (`M12-46`). */
export function useBillingDocuments(open: boolean): BillingDocumentsList {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useSession().user?.tenant?.id ?? '';
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<DocumentChip>('all');
  const queryKey = queryKeys.billing.documents(tenantId, query, chip, 0);
  const list = usePaginatedList({
    queryKey,
    fetchPage: (page) =>
      repositories.billing.documents({
        page,
        limit: PAGE,
        ...(query === '' ? {} : { q: query }),
        ...(chip === 'all' ? {} : { status: chip }),
      }),
    enabled: open && tenantId !== '',
    keepPreviousWhileLoading: true,
  });
  // The chips' counts ride the first page, which the list's own read already holds.
  const first = queryClient.getQueryData<InfiniteData<BillingDocuments>>(queryKey)?.pages[0];
  return {
    ...listOf(list),
    query,
    chip,
    counts: first?.counts ?? NO_COUNTS,
    search: setQuery,
    choose: setChip,
  };
}

type Reminder = BillingReminders['items'][number];
type HistoryEntry = BillingHistory['items'][number];

/** The payment reminders, newest first, and the one the ladder tells next (decision 13). */
export function useBillingReminders(
  open: boolean,
): BillingList<Reminder> & { readonly upcoming: BillingReminders['next'] } {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useSession().user?.tenant?.id ?? '';
  const queryKey = queryKeys.billing.reminders(tenantId, 0);
  const list = usePaginatedList({
    queryKey,
    fetchPage: (page) => repositories.billing.reminders({ page, limit: PAGE }),
    enabled: open && tenantId !== '',
  });
  const first = queryClient.getQueryData<InfiniteData<BillingReminders>>(queryKey)?.pages[0];
  return { ...listOf(list), upcoming: first?.next ?? null };
}

/** Every state the company's subscriptions entered, newest first (§M12.2). */
export function useBillingHistory(open: boolean): BillingList<HistoryEntry> {
  const repositories = useRepositories();
  const tenantId = useSession().user?.tenant?.id ?? '';
  const list = usePaginatedList({
    queryKey: queryKeys.billing.history(tenantId, 0),
    fetchPage: (page) => repositories.billing.history({ page, limit: PAGE }),
    enabled: open && tenantId !== '',
  });
  return listOf(list);
}

function listOf<T>(list: {
  readonly read: Read<readonly T[]>;
  readonly totalCount: number;
  readonly hasNextPage: boolean;
  fetchNextPage(): unknown;
}): BillingList<T> {
  return {
    read: list.read,
    total: list.totalCount,
    more: list.hasNextPage,
    showMore: () => void list.fetchNextPage(),
  };
}
