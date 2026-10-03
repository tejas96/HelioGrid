'use client';
import type { Notification } from '@heliogrid/contracts';
import {
  NOTIFICATION_TYPE_GROUPS,
  type NotificationReadFilter,
  type NotificationTypeGroup,
} from '@heliogrid/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';

/**
 * The bell's count (`F6-17`): the reader's unread records, never a push's say-so. Read apart
 * from the list, so the bell shows it without loading the centre. Null while it is unknown.
 */
export function useUnreadCount(): number | null {
  const { tenantId, reading } = useReader();
  const repositories = useRepositories();
  const count = useQuery({
    queryKey: queryKeys.notifications.unreadCount(tenantId),
    queryFn: ({ signal }) => repositories.notification.unreadCount(signal),
    enabled: reading,
  });
  return count.data?.unreadCount ?? null;
}

/** The centre's list and its acts, as both platforms render them (Law 11). */
export interface NotificationCentre {
  /** Newest first, inside the horizon, under the filters (`F6-17`, `F6-19`). */
  readonly items: readonly Notification[];
  /**
   * The list itself: `error` only when nothing could be shown. A failed older page leaves the list
   * standing and says so in `olderFailed` — never an error frame over items already read (`F4-27`).
   */
  readonly status: 'pending' | 'error' | 'success';
  /** How many records match the filters — more than `items` while older ones remain. */
  readonly totalCount: number;
  /** An older page can be loaded — the list's own answer, which Show older follows. */
  readonly hasMore: boolean;
  readonly olderFailed: boolean;
  /** The last mark-one failed: the item stays unread, and the screen says why at the attempt. */
  readonly readFailed: boolean;
  /** The bell's count, which the head names beside the matches. */
  readonly unreadCount: number | null;
  readonly readState: NotificationReadFilter;
  readonly typeGroups: readonly NotificationTypeGroup[];
  readonly filtered: boolean;
  readonly loadingOlder: boolean;
  setReadState(readState: NotificationReadFilter): void;
  setTypeGroups(groups: readonly NotificationTypeGroup[]): void;
  clearFilters(): void;
  showOlder(): void;
  /** Up only, and once (`F6-07`): reading a read item changes nothing. */
  markRead(notification: Notification): void;
  /**
   * Marks read what the list showed under its own filter (`F6-07`): `seenThrough` is the newest
   * `emittedAt` shown, so an item that lands after the render stays unread. Answers how many.
   */
  markAllRead(seenThrough: string): Promise<number>;
  retry(): void;
}

export function useNotificationCentre(): NotificationCentre {
  const { tenantId, reading } = useReader();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const [readState, setReadState] = useState<NotificationReadFilter>('all');
  const [chosenGroups, setChosenGroups] = useState<readonly NotificationTypeGroup[]>([]);
  /* In the vocabulary's order, so one set of chips is one cache entry however it was picked. */
  const typeGroups = NOTIFICATION_TYPE_GROUPS.filter((group) => chosenGroups.includes(group));
  const everything = queryKeys.notifications.all(tenantId);

  const list = usePaginatedList({
    queryKey: queryKeys.notifications.inbox(tenantId, readState, typeGroups),
    fetchPage: (page) => repositories.notification.inbox({ page, readState, typeGroups }),
    enabled: reading,
  });
  const unreadCount = useUnreadCount();

  /* The list and the badge share one prefix: a read refreshes both, so they cannot disagree. */
  const refreshAll = () => queryClient.invalidateQueries({ queryKey: everything });
  const readOne = useMutation({
    mutationFn: (id: string) => repositories.notification.markRead(id),
    onSettled: refreshAll,
  });
  const readAll = useMutation({
    mutationFn: (seenThrough: string) =>
      repositories.notification.markAllRead(seenThrough, typeGroups),
    onSettled: refreshAll,
  });

  const olderFailed = list.isFetchNextPageError;
  return {
    items: list.items,
    status: olderFailed ? 'success' : list.status,
    totalCount: list.totalCount,
    hasMore: list.hasNextPage,
    olderFailed,
    readFailed: readOne.isError,
    unreadCount,
    readState,
    typeGroups,
    filtered: readState !== 'all' || typeGroups.length > 0,
    loadingOlder: list.isFetchingNextPage,
    setReadState,
    setTypeGroups: setChosenGroups,
    clearFilters: () => {
      setReadState('all');
      setChosenGroups([]);
    },
    showOlder: () => void list.fetchNextPage(),
    markRead: (notification) => {
      if (notification.readAt === null) readOne.mutate(notification.id);
    },
    markAllRead: (seenThrough) => readAll.mutateAsync(seenThrough),
    retry: () => void list.refetch(),
  };
}

/**
 * Whose notifications, and whether to read them at all: a removed member reads nothing, since
 * every read would be refused (`S1.wrong.4`), and a session with no company has none.
 */
function useReader(): { tenantId: string; reading: boolean } {
  const { user, ended } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  return { tenantId, reading: tenantId !== '' && ended === null };
}
