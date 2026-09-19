import { NOTIFICATION_TYPE_GROUPS, NOTIFICATION_TYPES, PUSH_PLATFORMS } from '@heliogrid/domain';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { userAccount } from './identity';
import { subjectKind } from './subject';
import { tenant, uiLanguage } from './tenant';

/** pgEnum hand-mirrors domain's tuple (`M17` proves the pair equal). */
export const notificationType = pgEnum('notification_type', NOTIFICATION_TYPES);

/** The five groups a person mutes push for (`F6-15`), mirrored the same way (`M17`). */
export const notificationTypeGroup = pgEnum('notification_type_group', NOTIFICATION_TYPE_GROUPS);

/** What a handset runs, so the transport can shape its payload (`M17`). */
export const pushPlatform = pgEnum('push_platform', PUSH_PLATFORMS);

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
    /**
     * When the push becomes owed (`F6-14`) — the emit instant, or the end of the tenant's quiet
     * window where that held it. Set once at emit and never moved: with `push_sent_at` beside it
     * a sender asks one question, due and not yet sent, and no row can be in a state the pair
     * does not describe.
     */
    pushDueAt: instant('push_due_at'),
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

/**
 * One person's push mute for one group (`F6-15`), and nothing else.
 *
 * Minimal and honest: there is no per-event snooze and no in-app column, because the record
 * always lands and is the truth (`F6-06`). A row's ABSENCE is the default — push on — so a
 * person who has never opened the preferences screen needs no rows at all.
 *
 * Tenant-scoped, all four always. `user_ref` keys `user_account` and the pair with this row's
 * own `tenant_id` IS the membership, bound exactly as `notification.recipient_user_ref` is.
 * The unique key leads with `tenant_id` (`M12`), so the same person in two companies keeps two
 * sets of preferences, which is what a per-tenant setting means.
 *
 * The rule that some groups may not be muted is POLICY and lives in `packages/domain`; this
 * table stores what was written, and the read applies the rule again (`F6-15`).
 */
export const notificationPreference = pgTable(
  'notification_preference',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    userRef: uuid('user_ref')
      .notNull()
      .references(() => userAccount.id),
    typeGroup: notificationTypeGroup('type_group').notNull(),
    /** True when this person has switched push off for the group. Never silences the record. */
    pushMuted: boolean('push_muted').notNull(),
  },
  (table) => [
    /** One row per person per group, and the read path's only lookup. */
    uniqueIndex('notification_preference_tenant_user_group_key').on(
      table.tenantId,
      table.userRef,
      table.typeGroup,
    ),
  ],
);

/**
 * One company's own quiet window (`F6-14`), on its own clock (`F1-10`).
 *
 * Its OWN table rather than two columns on `tenant`, because `tenant` is SELECT-only to
 * `app_user` by design — every tenant-editable setting in this schema lives beside its peers for
 * the same reason. One row per company, and the row's ABSENCE is the market's default: the hours
 * outside its lawful calling window, derived in `packages/domain` from the pack, so no number is
 * stored and a company that never set a window needs no row.
 *
 * A window may CROSS midnight, which is the ordinary shape of a night, and equal ends mean the
 * company keeps no quiet hours at all.
 */
export const notificationSettings = pgTable(
  'notification_settings',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenant.id),
    quietHoursStart: time('quiet_hours_start').notNull(),
    quietHoursEnd: time('quiet_hours_end').notNull(),
  },
  (table) => [uniqueIndex('notification_settings_tenant_key').on(table.tenantId)],
);

/**
 * A handset a person is pushed on (`F6-06`, `F6-13`).
 *
 * GLOBAL, and deliberately: a phone belongs to a PERSON, not a company. Someone holding
 * memberships in two companies carries one handset, and tenant-scoping this would give them two
 * rows, two pushes for one notification, and a token whose uniqueness meant nothing. It keys
 * `user_account` exactly as `session` does.
 *
 * UNREACHABLE to `app_user`: no grant, the admin path alone — the same answer `session` gives,
 * because a row keyed to a person carries no tenant pin to be filtered by.
 *
 * `token` is unique product-wide, so a handset signing in again REPLACES its row rather than
 * adding one. A token the provider calls dead is deleted and never retried (`F6` §F6.2).
 */
export const pushDevice = pgTable(
  'push_device',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userRef: uuid('user_ref')
      .notNull()
      .references(() => userAccount.id),
    platform: pushPlatform('platform').notNull(),
    token: text('token').notNull(),
    registeredAt: instant('registered_at').notNull(),
    /** For a later slice that retires handsets nobody opens; nothing reads it yet. */
    lastSeenAt: instant('last_seen_at').notNull(),
  },
  (table) => [
    uniqueIndex('push_device_token_key').on(table.token),
    index('push_device_user_idx').on(table.userRef),
  ],
);
