import type { Notification, Paginated, PaginationQuery, UnreadCount } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/**
 * A person's own notifications (`F6-06`): the inbox, the bell's count, and marking one read. The
 * record is the truth, so every one of these reads the record and none of them depends on a push
 * having arrived.
 */
export interface NotificationRepository {
  inbox(query: PaginationQuery, signal?: AbortSignal): Promise<Paginated<Notification>>;
  unreadCount(signal?: AbortSignal): Promise<UnreadCount>;
  /** Up only, and set once (`F6-07`) — a second call returns the record unchanged. */
  markRead(id: string, signal?: AbortSignal): Promise<Notification>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createNotificationRepository(api: ApiClient): NotificationRepository {
  return {
    async inbox(query, signal) {
      try {
        const res = await api.notification.inbox({ query, fetchOptions: { signal } });
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
  };
}
