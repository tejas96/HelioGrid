import {
  type DbTransaction,
  membershipRole,
  notification,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import {
  FOUNDER_ROLE,
  type NotificationType,
  pushDueAt,
  type QuietWindow,
  type SubjectKind,
  type UiLanguage,
} from '@heliogrid/domain';
import { and, eq, isNull } from 'drizzle-orm';
import type { NoticeWords } from './notification.words';

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
 * commit together or neither does, and answers its id — what the push after the commit sends.
 * `push_sent_at` is left null: the record is the truth and push is a later, best-effort act on top
 * of it (`F6-06`), never a condition of the record existing.
 *
 * `push_due_at` is set HERE and never moved (`F6-14`) — only cleared, by the push drain, once no
 * one is owed the push. It is the one emit door, so a held push cannot be a state a caller forgets
 * to set: the window comes from the tenant, and the decision itself is `packages/domain`'s — this
 * binds the two and computes nothing of its own.
 */
export async function recordNotification(
  tx: DbTransaction,
  toWrite: NotificationToWrite,
  quietHours: TenantQuietHours,
): Promise<string> {
  const due = pushDueAt(toWrite.emittedAt.getTime(), quietHours.window, quietHours.timezone);
  const [written] = await tx
    .insert(notification)
    .values({ ...toWrite, pushDueAt: new Date(due) })
    .returning({ id: notification.id });
  if (written === undefined) throw new Error('the notification insert returned no row');
  return written.id;
}

/** A person a notice is written to, and the language it is written in. */
export interface NoticeRecipient {
  readonly userId: string;
  readonly language: UiLanguage;
}

/** One notice to several people: everything but who it goes to, and its words in each language. */
export type NoticeToEach = Omit<
  NotificationToWrite,
  'recipientUserRef' | 'title' | 'body' | 'language'
>;

/**
 * The same notice to each recipient, in that recipient's language, ON THE CALLER'S TRANSACTION;
 * answers the new records' ids for the push after the commit.
 */
export async function recordNotificationsTo(
  tx: DbTransaction,
  recipients: readonly NoticeRecipient[],
  notice: NoticeToEach,
  wordsIn: (language: UiLanguage) => NoticeWords,
  quietHours: TenantQuietHours,
): Promise<string[]> {
  const ids: string[] = [];
  for (const recipient of recipients) {
    const words = wordsIn(recipient.language);
    ids.push(
      await recordNotification(
        tx,
        {
          ...notice,
          recipientUserRef: recipient.userId,
          title: words.title,
          body: words.body,
          language: recipient.language,
        },
        quietHours,
      ),
    );
  }
  return ids;
}

/**
 * The `epc_owner` recipient rule (`F6-05`): the company's active EPC Owners. Either pool's
 * transaction will do, so the tenant is named in the query itself — under the admin pool it is the
 * only thing keeping one company's notice out of another's.
 */
export async function activeOwnersOf(
  tx: DbTransaction,
  tenantId: string,
): Promise<NoticeRecipient[]> {
  return tx
    .select({ userId: userAccount.id, language: userAccount.interfaceLanguage })
    .from(membershipRole)
    .innerJoin(tenantMembership, eq(tenantMembership.id, membershipRole.membershipId))
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(
      and(
        eq(membershipRole.tenantId, tenantId),
        eq(membershipRole.rolePreset, FOUNDER_ROLE),
        eq(tenantMembership.status, 'active'),
      ),
    );
}

/**
 * The same notice to each recipient who has not still got it unread — the same type, subject and
 * words — so a person who keeps asking for something that keeps failing tells its owner once while
 * that notice waits, and again only after it was read (`F6-06`). The words name what failed, so a
 * second thing failing on the same subject is still told.
 */
export async function recordNotificationsOnceTo(
  tx: DbTransaction,
  recipients: readonly NoticeRecipient[],
  notice: NoticeToEach,
  wordsIn: (language: UiLanguage) => NoticeWords,
  quietHours: TenantQuietHours,
): Promise<string[]> {
  const untold: NoticeRecipient[] = [];
  for (const recipient of recipients) {
    const words = wordsIn(recipient.language);
    const waiting = await tx
      .select({ id: notification.id })
      .from(notification)
      .where(
        and(
          eq(notification.tenantId, notice.tenantId),
          eq(notification.recipientUserRef, recipient.userId),
          eq(notification.type, notice.type),
          eq(notification.subjectKind, notice.subjectKind),
          eq(notification.subjectRef, notice.subjectRef),
          eq(notification.title, words.title),
          eq(notification.body, words.body),
          isNull(notification.readAt),
        ),
      )
      .limit(1);
    if (waiting.length === 0) untold.push(recipient);
  }
  return recordNotificationsTo(tx, untold, notice, wordsIn, quietHours);
}
