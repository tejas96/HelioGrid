import type {
  Notification,
  NotificationReadFilter,
  NotificationTypeGroup,
  Paginated,
  PaginationQuery,
  RegisterDevice,
  UnreadCount,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** What the centre's list asks for (`F6-17`): a page, and the two filters, both optional. */
export interface NotificationCentreQuery extends Partial<PaginationQuery> {
  readonly readState?: NotificationReadFilter;
  readonly typeGroups?: readonly NotificationTypeGroup[];
}

/**
 * A person's own notifications (`F6-06`): the inbox, the bell's count, and marking one read. The
 * record is the truth, so every one of these reads the record and none of them depends on a push
 * having arrived.
 */
export interface NotificationRepository {
  /** Inside the centre's horizon, newest first (`F6-19`); `totalCount` counts the same filters. */
  inbox(query: NotificationCentreQuery, signal?: AbortSignal): Promise<Paginated<Notification>>;
  unreadCount(signal?: AbortSignal): Promise<UnreadCount>;
  /** Up only, and set once (`F6-07`) — a second call returns the record unchanged. */
  markRead(id: string, signal?: AbortSignal): Promise<Notification>;
  /**
   * Marks read every unread item the list showed (`F6-07`): `seenThrough` is the newest
   * `emittedAt` it rendered, and `typeGroups` its own filter. Answers how many were marked.
   */
  markAllRead(
    seenThrough: string,
    typeGroups?: readonly NotificationTypeGroup[],
    signal?: AbortSignal,
  ): Promise<number>;
  /**
   * Binds this handset's push token to the signed-in person (`F6-13`). Registering the same
   * token again replaces the row, so a repeat call on every app start is the intended shape.
   */
  registerDevice(device: RegisterDevice, signal?: AbortSignal): Promise<void>;
  /** On sign-out, or when the person turns push off at the platform. Idempotent. */
  forgetDevice(token: string, signal?: AbortSignal): Promise<void>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createNotificationRepository(api: ApiClient): NotificationRepository {
  return {
    async inbox(query, signal) {
      try {
        const { typeGroups, ...rest } = query;
        const res = await api.notification.inbox({
          query: { ...rest, typeGroups: typeGroupList(typeGroups) },
          fetchOptions: { signal },
        });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async unreadCount(signal) {
      try {
        const res = await api.notification.unreadCount({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async markRead(id, signal) {
      try {
        const res = await api.notification.markRead({
          params: { id },
          body: {},
          fetchOptions: { signal },
        });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async markAllRead(seenThrough, typeGroups, signal) {
      try {
        const res = await api.notification.markAllRead({
          body: { seenThrough, typeGroups: typeGroupList(typeGroups) },
          fetchOptions: { signal },
        });
        if (res.status !== 200) throw toApiError(res);
        return res.body.marked;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async registerDevice(device, signal) {
      try {
        const res = await api.notification.registerDevice({
          body: device,
          fetchOptions: { signal },
        });
        if (res.status !== 200) throw toApiError(res);
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async forgetDevice(token, signal) {
      try {
        const res = await api.notification.forgetDevice({
          body: { token },
          fetchOptions: { signal },
        });
        if (res.status !== 200) throw toApiError(res);
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}

/**
 * The type-group filter as the wire carries it: one comma list (`notificationInboxQuerySchema`),
 * because the typed client would encode an array as `typeGroups[0]=…`, which the api cannot read.
 */
function typeGroupList(groups: readonly NotificationTypeGroup[] | undefined): string | undefined {
  return groups === undefined || groups.length === 0 ? undefined : groups.join(',');
}
