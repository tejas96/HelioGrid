'use client';
import type { Notification } from '@heliogrid/contracts';
import {
  type CentreView,
  centreView,
  type MarkAllOutcome,
  NOTIFICATION_TYPE_GROUPS,
  type NotificationReadFilter,
  type NotificationTypeGroup,
  type Read,
} from '@heliogrid/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';

/**
 * The bell's count (`F6-17`): the reader's unread records, never a push's say-so. Read apart
 * from the list, so the bell shows it without loading the centre. Null while it is unknown.
 */
export function useUnreadCount(): number | null {
  return useUnreadRead('when stale');
}

/**
 * The count, read `always` when the centre opens: the list it opens on is read then, so the count
 * the head names beside it (and the bell, which shares it) is read then too (`F6-17`).
 */
function useUnreadRead(onMount: 'always' | 'when stale'): number | null {
  const { tenantId, reading } = useReader();
  const repositories = useRepositories();
  const count = useQuery({
    queryKey: queryKeys.notifications.unreadCount(tenantId),
    queryFn: ({ signal }) => repositories.notification.unreadCount(signal),
    enabled: reading,
    refetchOnMount: onMount === 'always' ? 'always' : true,
  });
  return count.data?.unreadCount ?? null;
}

/** The centre's list and its acts, as both platforms render them (Law 11). */
export interface NotificationCentre {
  /**
   * The list as the screen draws it — its days and rows, decided by `centreView` on the tenant's
   * clock (`F6-12`, `F6-17`, `F6-19`).
   */
  readonly view: CentreView<Notification>;
  /**
   * The records read — what the surface shows: the list, or its loading, failed or empty frame.
   * Empty is nothing at all reached the reader; a filter that matches nothing keeps the list, its
   * head "0 match".
   */
  readonly read: Read<readonly Notification[]>;
  /** The filter bar stays on screen whenever there is something to filter or a filter to undo. */
  readonly showsFilters: boolean;
  /** The facts the head words are chosen by. */
  readonly head: {
    readonly readState: NotificationReadFilter;
    readonly filtered: boolean;
    readonly match: number;
    /** Every unread record — the bell's count; null while it is not known. */
    readonly unread: number | null;
    readonly unreadListed: number;
    readonly markAllShows: boolean;
  };
  /** Older pages failed while the pages shown stand: said beside Show older (`F4-27`). */
  readonly olderFailed: boolean;
  /** Mark all read is on its way: a second press sends nothing (`F6-07`). */
  readonly markingAll: boolean;
  readonly filtered: boolean;
  readonly unreadOn: boolean;
  /** The one type group the bar has open, or null for every group (`SCR-SHELL-03`). */
  readonly openGroup: NotificationTypeGroup | null;
  readonly loadingOlder: boolean;
  setUnreadOn(on: boolean): void;
  /** Opens one type group, or none; a value this build does not know opens none. */
  setOpenGroup(group: string | null): void;
  showOlder(): void;
  /** Up only, and once (`F6-07`). Answers false when the read was refused, so the screen says so. */
  markRead(notification: Notification): Promise<boolean>;
  /**
   * Marks read what the list showed under its own filter (`F6-07`): through the newest `emittedAt`
   * shown, so an item that lands after the render stays unread.
   */
  markAllRead(): Promise<MarkAllOutcome>;
}

/** The centre on the tenant's clock; `timeZone` is the market's, which the formatters share. */
export function useNotificationCentre(timeZone: string): NotificationCentre {
  const { tenantId, reading } = useReader();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const [readState, setReadState] = useState<NotificationReadFilter>('all');
  const [chosenGroups, setChosenGroups] = useState<readonly NotificationTypeGroup[]>([]);
  /* In the vocabulary's order, so one set of groups is one cache entry however it was picked. */
  const typeGroups = NOTIFICATION_TYPE_GROUPS.filter((group) => chosenGroups.includes(group));
  const everything = queryKeys.notifications.all(tenantId);

  const list = usePaginatedList({
    queryKey: queryKeys.notifications.inbox(tenantId, readState, typeGroups),
    fetchPage: (page) => repositories.notification.inbox({ page, readState, typeGroups }),
    enabled: reading,
    keepPreviousWhileLoading: true,
  });
  const unread = useUnreadRead('always');

  /* The list and the badge share one prefix: a read refreshes both, so they cannot disagree. */
  const refreshAll = () => queryClient.invalidateQueries({ queryKey: everything });
  const readOne = useMutation({
    mutationFn: (id: string) => repositories.notification.markRead(id),
    onSettled: refreshAll,
  });
  /* A press while one is out sends nothing, and is busy. */
  const readAll = useAction(
    (seenThrough: string) => repositories.notification.markAllRead(seenThrough, typeGroups),
    { onDone: () => refreshAll(), onFailed: () => void refreshAll() },
  );

  const filtered = readState !== 'all' || typeGroups.length > 0;
  /* A *Show older* that failed keeps the list shown, with its note under it (`olderFailed`). */
  const listed: Read<readonly Notification[]> = list.isFetchNextPageError
    ? { kind: 'ready', value: list.shown }
    : list.read;
  const items = listed.kind === 'ready' ? listed.value : [];
  const view = centreView(items, { now: Date.now(), timeZone, hasMore: list.hasNextPage });
  const read: Read<readonly Notification[]> =
    listed.kind === 'ready' && items.length === 0 && !filtered ? { kind: 'empty' } : listed;
  return {
    view,
    read,
    showsFilters: read.kind === 'ready' || filtered,
    head: {
      readState,
      filtered,
      match: list.totalCount,
      unread,
      unreadListed: items.filter((item) => item.readAt === null).length,
      markAllShows: view.markAllShows,
    },
    olderFailed: list.isFetchNextPageError,
    markingAll: readAll.pending,
    filtered,
    unreadOn: readState === 'unread',
    openGroup: typeGroups[0] ?? null,
    loadingOlder: list.isFetchingNextPage,
    setUnreadOn: (on) => setReadState(on ? 'unread' : 'all'),
    setOpenGroup: (group) =>
      setChosenGroups(NOTIFICATION_TYPE_GROUPS.filter((known) => known === group)),
    showOlder: () => void list.fetchNextPage(),
    markRead: async (notification) => {
      if (notification.readAt !== null) return true;
      return readOne.mutateAsync(notification.id).then(
        () => true,
        () => false,
      );
    },
    markAllRead: async () => {
      const seenThrough = view.seenThrough;
      if (seenThrough === null) return BUSY;
      const answer = await readAll.run(seenThrough);
      if (answer.kind === 'done') return { kind: 'marked', count: answer.output };
      return answer.kind === 'failed' ? { kind: 'failed' } : BUSY;
    },
  };
}

const BUSY: MarkAllOutcome = { kind: 'busy' };

/**
 * Whose notifications, and whether to read them at all: a removed member reads nothing, since
 * every read would be refused (`S1.wrong.4`), and a session with no company has none.
 */
function useReader(): { tenantId: string; reading: boolean } {
  const { user, ended } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  return { tenantId, reading: tenantId !== '' && ended === null };
}
