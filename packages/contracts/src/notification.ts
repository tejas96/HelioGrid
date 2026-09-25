import {
  NOTIFICATION_READ_FILTERS,
  NOTIFICATION_TYPE_GROUPS,
  NOTIFICATION_TYPES,
  PUSH_PLATFORMS,
} from '@heliogrid/domain';
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
import { uiLanguageResponseSchema } from './locale';

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
  language: uiLanguageResponseSchema,
  emittedAt: z.string().datetime(),
  /** Null until it is read. It only ever moves from null, and only once (`F6-07`). */
  readAt: z.string().datetime().nullable(),
  /** Whether a push was sent — best-effort, and never what the inbox depends on (`F6-06`). */
  pushSentAt: z.string().datetime().nullable(),
  /**
   * Items with equal keys are drawn as one group; null never groups (`F6-12`). Opaque: the server
   * decides what groups, and the screen only collects equal keys.
   */
  groupKey: z.string().nullable(),
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

/** Everything, or only the unread (`F6-17`). Derived from the domain tuple, never restated. */
export const notificationReadFilterSchema = z.enum(NOTIFICATION_READ_FILTERS);
export type NotificationReadFilter = z.infer<typeof notificationReadFilterSchema>;

/**
 * One or more type groups, comma-separated: `sales,payments`. A comma list and not an array,
 * because the typed client encodes an array as `typeGroups[0]=…` and Express 5's query parser
 * does not read that back as an array — the filter would silently match nothing.
 */
const oneTypeGroup = NOTIFICATION_TYPE_GROUPS.join('|');
const typeGroupListSchema = z
  .string()
  .regex(new RegExp(`^(${oneTypeGroup})(,(${oneTypeGroup}))*$`))
  .transform((list) => [
    ...new Set(list.split(',').map((group) => notificationTypeGroupSchema.parse(group))),
  ]);

/**
 * The centre's list (`F6-17`, `F6-19`): newest first, inside the horizon, and filtered.
 * `totalCount` counts the SAME filters, so "3 of 46 match" is one query's answer.
 */
export const notificationInboxQuerySchema = paginationQuerySchema.extend({
  readState: notificationReadFilterSchema.default('all'),
  typeGroups: typeGroupListSchema.optional(),
});
export type NotificationInboxQuery = z.infer<typeof notificationInboxQuerySchema>;

/**
 * Mark all read (`F6-07`). `seenThrough` is the newest `emittedAt` the reader's list showed, so a
 * notification that lands between the render and the tap stays unread. `typeGroups` is the list's
 * own filter, so the act reaches exactly the list the reader is looking at.
 */
export const markAllReadSchema = z
  .object({
    seenThrough: z.string().datetime(),
    typeGroups: typeGroupListSchema.optional(),
  })
  .strict();
export type MarkAllRead = z.infer<typeof markAllReadSchema>;

/**
 * A handset registering itself for push (`F6-13`).
 *
 * The token travels in the BODY and never in a path or query: it is long, it identifies a
 * device, and `common/logging.ts` redacts structured fields while a raw URL keeps whatever was
 * in it. Registering the same token twice replaces the row rather than adding one, so a handset
 * that signs in again does not collect duplicates and a person is not pushed twice.
 */
/** Derived from the domain tuple; the migration mirrors the same list as a pgEnum (`M17`). */
export const pushPlatformSchema = z.enum(PUSH_PLATFORMS);
export type PushPlatform = z.infer<typeof pushPlatformSchema>;

export const registerDeviceSchema = z
  .object({
    platform: pushPlatformSchema,
    /** Opaque to us — FCM mints it and only FCM reads it. */
    token: z.string().min(1).max(4096),
  })
  .strict();
export type RegisterDevice = z.infer<typeof registerDeviceSchema>;

export const forgetDeviceSchema = z.object({ token: z.string().min(1).max(4096) }).strict();

/**
 * The reader's own notifications. Every route is `member` access and none is billing-gated:
 * the inbox, the badge and the history are reads, and reads always work (`F6-09`).
 */
export const notificationContract = c.router({
  inbox: {
    method: 'GET',
    path: '/notifications',
    query: notificationInboxQuerySchema,
    summary:
      "The reader's own notifications inside the centre's horizon, newest first, filtered — in every billing state",
    responses: {
      200: paginated(notificationSchema),
      401: unauthenticatedEnvelope,
    },
  },
  unreadCount: {
    method: 'GET',
    path: '/notifications/unread-count',
    summary: "The bell's count — the reader's own unread records inside the centre's horizon",
    responses: {
      200: unreadCountSchema,
      401: unauthenticatedEnvelope,
    },
  },
  registerDevice: {
    method: 'POST',
    path: '/notifications/devices',
    body: registerDeviceSchema,
    summary: 'Register this handset for push — the same token twice replaces, never duplicates',
    responses: {
      200: z.object({ registered: z.literal(true) }),
      401: unauthenticatedEnvelope,
    },
  },
  forgetDevice: {
    method: 'POST',
    path: '/notifications/devices/forget',
    body: forgetDeviceSchema,
    /** Idempotent: forgetting a token that is already gone is a success, not a 404. */
    summary: 'Stop pushing to this handset — on sign-out, or when the person declines',
    responses: {
      200: z.object({ registered: z.literal(false) }),
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
  markAllRead: {
    method: 'POST',
    path: '/notifications/read-all',
    body: markAllReadSchema,
    summary:
      'Mark every unread item the reader saw as read — up only, inside the horizon, deleting nothing',
    responses: {
      200: z.object({ marked: z.number().int().nonnegative() }),
      401: unauthenticatedEnvelope,
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
