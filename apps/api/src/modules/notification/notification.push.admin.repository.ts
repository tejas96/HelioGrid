import { type Db, notification } from '@heliogrid/db';
import type { NotificationType, SubjectKind } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** Everything a send needs from the record, and nothing else. */
export interface NotificationToPush {
  readonly recipientUserRef: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string;
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  readonly pushDueAt: Date | null;
  readonly pushSentAt: Date | null;
}

/**
 * The record, as the SENDER reads and marks it (`F6-06`, `F6-13`).
 *
 * The ADMIN pool, for one reason worth stating: `notification`'s grant to `app_user` is SELECT,
 * INSERT and `UPDATE (read_at)` alone — `push_sent_at` carries no grant at all, deliberately, so
 * that nothing a person's client can reach is able to claim a push was sent. The marker is the
 * server's word, and the server writes it on the path that has no tenant pin to be filtered by.
 *
 * The tenant predicate is still in every query: the pool is admin, the scoping is not optional.
 */
@Injectable()
export class NotificationPushAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async forPush(tenantId: string, id: string): Promise<NotificationToPush | null> {
    const [row] = await this.db
      .select({
        recipientUserRef: notification.recipientUserRef,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        subjectKind: notification.subjectKind,
        subjectRef: notification.subjectRef,
        pushDueAt: notification.pushDueAt,
        pushSentAt: notification.pushSentAt,
      })
      .from(notification)
      .where(and(eq(notification.id, id), eq(notification.tenantId, tenantId)));
    return row ?? null;
  }

  /**
   * Sets the marker once. `isNull(pushSentAt)` is what makes it once: two senders racing the same
   * record — the emit path and a later drain — settle on one, and the loser writes nothing.
   */
  async markPushSent(tenantId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(notification)
      .set({ pushSentAt: at })
      .where(
        and(
          eq(notification.id, id),
          eq(notification.tenantId, tenantId),
          isNull(notification.pushSentAt),
        ),
      );
  }
}
