import type { Notification, Paginated } from '@heliogrid/contracts';
import { type DbTransaction, notification, type TenantPool } from '@heliogrid/db';
import type { NotificationType, SubjectKind, UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/**
 * One notification, as the module raising it states it (`F6-06`). The words arrive already
 * RENDERED, in the language they were rendered in (`F6-08`) — this layer stores what it is given
 * and never translates, so an item read years later still says what it said when it was sent.
 */
export interface NotificationToWrite {
  readonly tenantId: string;
  readonly recipientUserRef: string;
  readonly type: NotificationType;
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  readonly title: string;
  readonly body: string;
  readonly language: UiLanguage;
  readonly emittedAt: Date;
}

/**
 * Writes one record ON THE CALLER'S TRANSACTION, so a notification and the change that earned it
 * commit together or neither does. `push_sent_at` is left null: the record is the truth and push
 * is a later, best-effort act on top of it (`F6-06`), never a condition of the record existing.
 */
export async function recordNotification(
  tx: DbTransaction,
  toWrite: NotificationToWrite,
): Promise<void> {
  await tx.insert(notification).values(toWrite);
}

/** The columns the wire declares, in one place: a read and a mark-read return the same shape. */
const wireColumns = {
  id: notification.id,
  type: notification.type,
  subjectKind: notification.subjectKind,
  subjectRef: notification.subjectRef,
  title: notification.title,
  body: notification.body,
  language: notification.language,
  emittedAt: notification.emittedAt,
  readAt: notification.readAt,
  pushSentAt: notification.pushSentAt,
};

type StoredRow = {
  [K in keyof typeof wireColumns]: K extends 'emittedAt'
    ? Date
    : K extends 'readAt' | 'pushSentAt'
      ? Date | null
      : Notification[K & keyof Notification];
};

/**
 * A person's own notifications, inside their own company (`F6-06`, `F6-09`). The runtime pool
 * under the table's policy, with BOTH predicates in the query as well — tenancy is defence in
 * depth, and the recipient predicate is what makes "own" mean own rather than the company's.
 */
@Injectable()
export class NotificationRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async inbox(
    tenantId: string,
    recipientUserRef: string,
    page: { limit: number; offset: number },
  ): Promise<Paginated<Notification>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const where = and(
        eq(notification.tenantId, tenantId),
        eq(notification.recipientUserRef, recipientUserRef),
      );
      const rows = await tx
        .select(wireColumns)
        .from(notification)
        .where(where)
        // Newest first, over the (tenant_id, recipient_user_ref, emitted_at desc) index; the id
        // breaks a tie so a page boundary cannot show one item twice and hide another.
        .orderBy(desc(notification.emittedAt), desc(notification.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ n: count() }).from(notification).where(where);
      return { items: rows.map(onTheWire), totalCount: total?.n ?? 0 };
    });
  }

  /** The bell's count — unread only, over the same index the inbox reads (`F6-06`). */
  async unreadCount(tenantId: string, recipientUserRef: string): Promise<number> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [total] = await tx
        .select({ n: count() })
        .from(notification)
        .where(
          and(
            eq(notification.tenantId, tenantId),
            eq(notification.recipientUserRef, recipientUserRef),
            isNull(notification.readAt),
          ),
        );
      return total?.n ?? 0;
    });
  }

  /**
   * Marks one read, up only and once (`F6-07`). `isNull(readAt)` is what makes it set-once: a
   * second call matches no row, so the first moment stands and nothing un-reads. A record that
   * was already read is not an error — the caller reads it back and returns it unchanged.
   */
  async markRead(
    tenantId: string,
    recipientUserRef: string,
    id: string,
    readAt: Date,
  ): Promise<Notification | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const mine = and(
        eq(notification.id, id),
        eq(notification.tenantId, tenantId),
        eq(notification.recipientUserRef, recipientUserRef),
      );
      const [updated] = await tx
        .update(notification)
        .set({ readAt })
        .where(and(mine, isNull(notification.readAt)))
        .returning(wireColumns);
      if (updated !== undefined) return onTheWire(updated);
      const [already] = await tx.select(wireColumns).from(notification).where(mine);
      return already === undefined ? null : onTheWire(already);
    });
  }
}

/** Instants cross the wire as ISO strings; the columns hold them as instants. */
function onTheWire(row: StoredRow): Notification {
  return {
    ...row,
    emittedAt: row.emittedAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    pushSentAt: row.pushSentAt?.toISOString() ?? null,
  };
}
