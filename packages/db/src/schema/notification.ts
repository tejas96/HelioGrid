import { NOTIFICATION_TYPES } from '@heliogrid/domain';
import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { userAccount } from './identity';
import { subjectKind } from './subject';
import { tenant, uiLanguage } from './tenant';

/** pgEnum hand-mirrors domain's tuple (`M17` proves the pair equal). */
export const notificationType = pgEnum('notification_type', NOTIFICATION_TYPES);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * What the product told one person (`F6-06`). The RECORD is the truth: the inbox and the badge
 * are both derived from it, so a push that never arrives loses nothing and a push that does is
 * only a tap on the shoulder.
 *
 * Tenant-scoped, all four always. `recipient_user_ref` keys `user_account` — a notification with
 * no person is meaningless, unlike an audit entry, which records a person who may be gone — and
 * the pair with this row's own `tenant_id` IS the membership, with no key to that: a membership
 * can be deactivated, and a delivered record must keep resolving to whoever received it.
 *
 * `subject_kind` + `subject_ref` are NOT NULL, both: `F6-02` says a notification points at a real
 * record and is never a dead announcement, so that is made unwritable rather than discouraged.
 * The one type with no record of its own is `system`, whose subject is the tenant it addresses.
 *
 * `title` and `body` are the words as RENDERED at emit and `language` is the language they were
 * rendered in (`F6-08`), so nothing re-translates when a reader switches language later.
 *
 * The grants are SELECT, INSERT and UPDATE on `read_at` ALONE. No role may change any other
 * column, and the writer sets `read_at` only where it is still null — so `F6-07`'s up-only and
 * set-once is a privilege plus a predicate rather than a discipline the code keeps.
 */
export const notification = pgTable(
  'notification',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    /** The person this was delivered to — a `user_account`, the one home of a human (`F6-04`). */
    recipientUserRef: uuid('recipient_user_ref')
      .notNull()
      .references(() => userAccount.id),
    type: notificationType('type').notNull(),
    subjectKind: subjectKind('subject_kind').notNull(),
    subjectRef: uuid('subject_ref').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    language: uiLanguage('language').notNull(),
    emittedAt: instant('emitted_at').notNull(),
    /** Set once, from null, and never back (`F6-07`) — the column grant is what makes that true. */
    readAt: instant('read_at'),
    /** Best-effort: null means no push was sent, never that the record is missing (`F6-06`). */
    pushSentAt: instant('push_sent_at'),
  },
  (table) => [
    /** The inbox, newest first — and the badge, which counts over it where `read_at` is null. */
    index('notification_tenant_recipient_emitted_idx').on(
      table.tenantId,
      table.recipientUserRef,
      table.emittedAt.desc(),
    ),
  ],
);
