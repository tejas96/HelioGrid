import { NOTIFICATION_TYPE_GROUPS, NOTIFICATION_TYPES } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  extensibleEnum,
  paginated,
  paginationQuerySchema,
  subjectKindSchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from './error';
import { uiLanguageSchema } from './locale';

const c = initContract();

/**
 * What the product is telling someone (`F6-05`). Built from `NOTIFICATION_TYPES` in
 * `@heliogrid/domain`, never restated: the migration mirrors the same tuple as a pgEnum (`M17`),
 * so a value on one side alone is a row the API can never return or a value the database rejects.
 * This closed form is the WRITE side and the mirror; the read below carries the growing form.
 */
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/**
 * One notification, as its recipient reads it (`F6-06`) — the record IS the truth, so a dropped
 * push loses nothing and this shape is what the inbox and the badge are both derived from.
 *
 * `title` and `body` are the words as they were RENDERED at emit, and `language` is the language
 * they were rendered in (`F6-08`): a reader who later switches language keeps the words their old
 * items were written in, because nothing re-renders them.
 */
export const notificationSchema = z.object({
  id: uuidSchema,
  /** Grows with every module's slice; a reader keeps a fallback for a value it does not know. */
  type: extensibleEnum(NOTIFICATION_TYPES),
  /** Where it points — the suite's one polymorphic pointer, never absent (`F6-02`). */
  subjectKind: extensibleEnum(subjectKindSchema.options),
  subjectRef: uuidSchema,
  title: z.string(),
  body: z.string(),
  language: uiLanguageSchema,
  emittedAt: z.string().datetime(),
  /** Null until it is read. It only ever moves from null, and only once (`F6-07`). */
  readAt: z.string().datetime().nullable(),
  /** Whether a push was sent — best-effort, and never what the inbox depends on (`F6-06`). */
  pushSentAt: z.string().datetime().nullable(),
});
export type Notification = z.infer<typeof notificationSchema>;

/** What the bell shows: the reader's own unread count, derived from the records (`F6-06`). */
export const unreadCountSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
});
export type UnreadCount = z.infer<typeof unreadCountSchema>;

/**
 * The five groups a person may switch push off for (`F6-15`). Derived from the domain tuple like
 * every other vocabulary (`M17`); the migration mirrors the same list as a pgEnum. Closed on the
 * WRITE side so an unknown group is refused before any query runs, and growing on the read, which
 * is the same pair `notificationTypeSchema` and `notificationSchema` already use above.
 */
export const notificationTypeGroupSchema = z.enum(NOTIFICATION_TYPE_GROUPS);
export type NotificationTypeGroup = z.infer<typeof notificationTypeGroupSchema>;

/**
 * One group as its owner sees it. `mutable` is the server's answer, not the screen's to work out:
 * `F6-15` withholds the billing group from a holder of the EPC Owner preset, and a client that
 * re-derived that rule would be a second copy of it.
 */
export const notificationPreferenceSchema = z.object({
  group: extensibleEnum(NOTIFICATION_TYPE_GROUPS),
  /** True when this person has switched push off for the group. The record still lands (`F6-06`). */
  pushMuted: z.boolean(),
  /** False where the rule refuses the mute however it is asked for. */
  mutable: z.boolean(),
});
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export const notificationPreferencesSchema = z.object({
  preferences: z.array(notificationPreferenceSchema),
});

/**
 * The reader's own notifications. Every route is `member` access and none is billing-gated:
 * the inbox, the badge and the history are reads, and reads always work (`F6-09`).
 */
export const notificationContract = c.router({
  inbox: {
    method: 'GET',
    path: '/notifications',
    query: paginationQuerySchema,
    summary: "The reader's own notifications, newest first — in every billing state",
    responses: {
      200: paginated(notificationSchema),
      401: unauthenticatedEnvelope,
    },
  },
  unreadCount: {
    method: 'GET',
    path: '/notifications/unread-count',
    summary: "The bell's count — the reader's own unread records",
    responses: {
      200: unreadCountSchema,
      401: unauthenticatedEnvelope,
    },
  },
  preferences: {
    method: 'GET',
    path: '/notifications/preferences',
    summary: "The reader's own push mutes, one row per group, with which of them may be changed",
    responses: {
      200: notificationPreferencesSchema,
      401: unauthenticatedEnvelope,
    },
  },
  setPreference: {
    method: 'PUT',
    path: '/notifications/preferences/:group',
    /** Declared, so an unknown group is refused as bad input before any query runs. */
    pathParams: z.object({ group: notificationTypeGroupSchema }),
    body: z.object({ pushMuted: z.boolean() }).strict(),
    summary: 'Switch push on or off for one group — never the record, which always lands',
    responses: {
      200: notificationPreferenceSchema,
      401: unauthenticatedEnvelope,
      /** `F6-15` — the billing group is not the Owner's to mute. */
      403: errorEnvelope(baseError('FORBIDDEN')),
    },
  },
  markRead: {
    method: 'POST',
    path: '/notifications/:id/read',
    /**
     * Declared, so a malformed id is refused as bad input BEFORE any query runs. Without this the
     * param reaches the database as text, which rejects it — a 500 for what is plainly a bad
     * request. It leaks nothing either way: a string that is not a uuid can never be a real id.
     */
    pathParams: z.object({ id: uuidSchema }),
    /** Read state is set, never toggled, so the request carries nothing to set it TO (`F6-07`). */
    body: z.object({}).strict(),
    summary: 'Mark one as read — up only, and only once; reading again changes nothing',
    responses: {
      200: notificationSchema,
      401: unauthenticatedEnvelope,
      404: errorEnvelope(baseError('NOT_FOUND')),
    },
  },
});
