import type { Notification, Paginated, PaginationQuery } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';

/**
 * A person's own notifications, read back (`F6-06`). Their records: the inbox and the badge both
 * derive from the same rows, so a push that never arrived changes nothing about what they see,
 * and both answer in every billing state (`F6-09`).
 */
@Injectable()
export class NotificationService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(NotificationRepository) private readonly records: NotificationRepository) {}

  async inbox(
    tenantId: string,
    recipientUserRef: string,
    query: PaginationQuery,
  ): Promise<Paginated<Notification>> {
    return this.records.inbox(tenantId, recipientUserRef, {
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async unreadCount(tenantId: string, recipientUserRef: string): Promise<number> {
    return this.records.unreadCount(tenantId, recipientUserRef);
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
}
