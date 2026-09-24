import type {
  MarkAllRead,
  Notification,
  NotificationInboxQuery,
  Paginated,
} from '@heliogrid/contracts';
import { centreHorizonStart, type NotificationTypeGroup, typesInGroups } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { type CentreView, NotificationRepository } from './notification.repository';

/**
 * A person's own notifications, read back (`F6-06`). Their records: the inbox and the badge both
 * derive from the same rows, so a push that never arrived changes nothing about what they see,
 * and both answer in every billing state (`F6-09`).
 *
 * Every read is bounded by the centre's horizon (`F6-19`), taken at the moment of the request, so
 * the list, its count and the badge always agree on what the centre holds.
 */
@Injectable()
export class NotificationService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(NotificationRepository) private readonly records: NotificationRepository) {}

  async inbox(
    tenantId: string,
    recipientUserRef: string,
    query: NotificationInboxQuery,
  ): Promise<Paginated<Notification>> {
    const view = centreView(query.typeGroups, query.readState === 'unread');
    return this.records.inbox(tenantId, recipientUserRef, view, {
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async unreadCount(tenantId: string, recipientUserRef: string): Promise<number> {
    return this.records.unreadCount(tenantId, recipientUserRef, horizonNow());
  }

  /**
   * Up only, and set once (`F6-07`): reading on one device reads everywhere, and reading again
   * changes nothing. Null is a record this person does not have — someone else's, or another
   * company's — and the route answers 404 rather than revealing that it exists.
   */
  async markRead(
    tenantId: string,
    recipientUserRef: string,
    id: string,
  ): Promise<Notification | null> {
    return this.records.markRead(tenantId, recipientUserRef, id, new Date());
  }

  /** Marks read what the reader's list showed, and nothing that landed after it (`F6-07`). */
  async markAllRead(
    tenantId: string,
    recipientUserRef: string,
    request: MarkAllRead,
  ): Promise<number> {
    return this.records.markAllRead(
      tenantId,
      recipientUserRef,
      centreView(request.typeGroups, true),
      new Date(request.seenThrough),
      new Date(),
    );
  }
}

function horizonNow(): Date {
  return new Date(centreHorizonStart(Date.now()));
}

function centreView(
  typeGroups: readonly NotificationTypeGroup[] | undefined,
  unreadOnly: boolean,
): CentreView {
  return {
    since: horizonNow(),
    unreadOnly,
    types: typeGroups === undefined ? undefined : typesInGroups(typeGroups),
  };
}
