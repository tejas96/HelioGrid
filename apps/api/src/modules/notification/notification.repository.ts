import type { Notification, Paginated } from '@heliogrid/contracts';
import { type DbTransaction, notification, type TenantPool, tenant } from '@heliogrid/db';
import {
  centreGroupKey,
  NOTIFICATION_REGISTRY,
  type NotificationType,
  pushDueAt,
  type QuietWindow,
  type SubjectKind,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
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

/** The tenant's own clock, which decides when a push may sound (`F1-10`, `F6-14`). */
export interface TenantQuietHours {
  readonly window: QuietWindow;
  readonly timezone: string;
}

/**
 * Writes one record ON THE CALLER'S TRANSACTION, so a notification and the change that earned it
 * commit together or neither does. `push_sent_at` is left null: the record is the truth and push
 * is a later, best-effort act on top of it (`F6-06`), never a condition of the record existing.
 *
 * `push_due_at` is set HERE and never moved (`F6-14`). It is the one emit door, so a held push
 * cannot be a state a caller forgets to set: the type's urgency comes from the registry and the
 * window from the tenant, and the decision itself is `packages/domain`'s — this binds the two and
 * computes nothing of its own.
 */
export async function recordNotification(
  tx: DbTransaction,
  toWrite: NotificationToWrite,
  quietHours: TenantQuietHours,
): Promise<void> {
  const due = pushDueAt(
    NOTIFICATION_REGISTRY[toWrite.type].urgency,
    toWrite.emittedAt.getTime(),
    quietHours.window,
    quietHours.timezone,
  );
  await tx.insert(notification).values({ ...toWrite, pushDueAt: new Date(due) });
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

type StoredRow = Pick<typeof notification.$inferSelect, keyof typeof wireColumns>;

/**
 * Which of a person's rows the centre reads (`F6-17`, `F6-19`). `since` is the horizon, so every
 * centre read stays a bounded range on the `(tenant, recipient, emitted_at)` index; `types` is a
 * type-group filter already resolved to types, and an empty list matches nothing.
 */
export interface CentreView {
  readonly since: Date;
  readonly unreadOnly: boolean;
  readonly types?: readonly NotificationType[];
}

function centreRows(tenantId: string, recipientUserRef: string, view: CentreView) {
  return and(
    eq(notification.tenantId, tenantId),
    eq(notification.recipientUserRef, recipientUserRef),
    gte(notification.emittedAt, view.since),
    view.unreadOnly ? isNull(notification.readAt) : undefined,
    view.types === undefined ? undefined : inArray(notification.type, [...view.types]),
  );
}

/** The tenant's own clock, which decides the calendar day an item groups on (`F1-10`). */
async function tenantZone(tx: DbTransaction, tenantId: string): Promise<string> {
  const [row] = await tx
    .select({ timezone: tenant.timezone })
    .from(tenant)
    .where(eq(tenant.id, tenantId));
  if (row === undefined) throw new Error(`tenant ${tenantId} is not readable in its own scope`);
  return row.timezone;
}

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
    view: CentreView,
    page: { limit: number; offset: number },
  ): Promise<Paginated<Notification>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const where = centreRows(tenantId, recipientUserRef, view);
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
      const zone = await tenantZone(tx, tenantId);
      return { items: rows.map((row) => onTheWire(row, zone)), totalCount: total?.n ?? 0 };
    });
  }

  /** The bell's count — unread inside the horizon, over the same rows the list reads (`F6-17`). */
  async unreadCount(tenantId: string, recipientUserRef: string, since: Date): Promise<number> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [total] = await tx
        .select({ n: count() })
        .from(notification)
        .where(centreRows(tenantId, recipientUserRef, { since, unreadOnly: true }));
      return total?.n ?? 0;
    });
  }

  /**
   * Marks read every unread row in the view emitted no later than `seenThrough` (`F6-07`), and
   * answers how many. The bound is what keeps an item that landed after the reader's list
   * rendered unread; `isNull(readAt)` inside the view is what keeps it up only and set once.
   */
  async markAllRead(
    tenantId: string,
    recipientUserRef: string,
    view: CentreView,
    seenThrough: Date,
    readAt: Date,
  ): Promise<number> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const marked = await tx
        .update(notification)
        .set({ readAt })
        .where(
          and(
            centreRows(tenantId, recipientUserRef, { ...view, unreadOnly: true }),
            lte(notification.emittedAt, seenThrough),
          ),
        )
        .returning({ id: notification.id });
      return marked.length;
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
      const row = updated ?? (await tx.select(wireColumns).from(notification).where(mine)).at(0);
      return row === undefined ? null : onTheWire(row, await tenantZone(tx, tenantId));
    });
  }
}

/**
 * Instants cross the wire as ISO strings; the columns hold them as instants. The group key is the
 * domain's decision in the tenant's zone (`F6-12`), never the screen's.
 */
function onTheWire(row: StoredRow, timeZone: string): Notification {
  return {
    ...row,
    emittedAt: row.emittedAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    pushSentAt: row.pushSentAt?.toISOString() ?? null,
    groupKey: centreGroupKey(row.type, row.subjectKind, row.emittedAt.getTime(), timeZone),
  };
}
