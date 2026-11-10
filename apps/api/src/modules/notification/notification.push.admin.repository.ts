import { type Db, notification } from '@heliogrid/db';
import type { NotificationType, SubjectKind } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, isNotNull, isNull, lte, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** Everything a send needs from the record, and nothing else. */
export interface NotificationToPush {
  readonly tenantId: string;
  readonly id: string;
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
 * What one try at a push came to: it left; no one is owed it — the group is muted, the type never
 * pushes, the person has no handset; it is held until its quiet window ends; or the provider
 * refused it, and a later drain tries again.
 */
export interface PushAttempt {
  readonly outcome: 'sent' | 'owed_to_nobody' | 'held' | 'failed';
}

const pushColumns = {
  tenantId: notification.tenantId,
  id: notification.id,
  recipientUserRef: notification.recipientUserRef,
  type: notification.type,
  title: notification.title,
  body: notification.body,
  subjectKind: notification.subjectKind,
  subjectRef: notification.subjectRef,
  pushDueAt: notification.pushDueAt,
  pushSentAt: notification.pushSentAt,
};

/** What each try writes on the record, `at` the drain's moment. */
const SETTLED_BY: Readonly<
  Record<PushAttempt['outcome'], (at: Date) => Partial<typeof notification.$inferInsert>>
> = {
  sent: (at) => ({ pushSentAt: at }),
  owed_to_nobody: () => ({ pushDueAt: null }),
  held: (at) => ({ pushTriedAt: at }),
  failed: (at) => ({ pushTriedAt: at }),
};

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
      .select(pushColumns)
      .from(notification)
      .where(and(eq(notification.id, id), eq(notification.tenantId, tenantId)));
    return row ?? null;
  }

  /**
   * The push drain (`F6-14`): every company's pushes that fell due between `from` and `to`, of a
   * type that pushes, not yet sent — the ones no drain has failed first, then those failed longest
   * ago — each sent in a short transaction of its own (`pushOnce`), so a drain that dies part way keeps
   * every push it already sent marked, and one the provider keeps refusing never holds back the
   * fresh pushes behind it. Answers how many left.
   */
  async drainDue(
    due: { readonly from: Date; readonly to: Date; readonly now: Date },
    types: readonly NotificationType[],
    limit: number,
    send: (push: NotificationToPush) => Promise<PushAttempt>,
  ): Promise<number> {
    const owed = await this.db
      .select({ tenantId: notification.tenantId, id: notification.id })
      .from(notification)
      .where(
        and(
          isNull(notification.pushSentAt),
          gte(notification.pushDueAt, due.from),
          lte(notification.pushDueAt, due.to),
          inArray(notification.type, [...types]),
        ),
      )
      .orderBy(
        sql`${notification.pushTriedAt} asc nulls first`,
        asc(notification.pushDueAt),
        asc(notification.id),
      )
      .limit(limit);
    let pushed = 0;
    for (const push of owed) {
      if ((await this.pushOnce(push, due.now, send)) === 'sent') pushed += 1;
    }
    return pushed;
  }

  /**
   * One push, LOCKED while it is sent and its outcome written — skipped when another drain holds
   * it or it was settled since it was listed, so two drains at one moment never send it twice.
   * One that left is marked sent; one owed to no one is settled — its due instant cleared, so no
   * later drain claims it again; one that did not leave is stamped tried, behind the fresh ones.
   */
  private pushOnce(
    listed: { readonly tenantId: string; readonly id: string },
    now: Date,
    send: (push: NotificationToPush) => Promise<PushAttempt>,
  ): Promise<PushAttempt['outcome'] | 'taken'> {
    const unsent = and(
      eq(notification.id, listed.id),
      eq(notification.tenantId, listed.tenantId),
      isNull(notification.pushSentAt),
    );
    return this.db.transaction(async (tx) => {
      const [push] = await tx
        .select(pushColumns)
        .from(notification)
        .where(and(unsent, isNotNull(notification.pushDueAt)))
        .for('update', { skipLocked: true });
      if (push === undefined) return 'taken';
      const { outcome } = await send(push);
      await tx.update(notification).set(SETTLED_BY[outcome](now)).where(unsent);
      return outcome;
    });
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
