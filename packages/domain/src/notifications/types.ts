/**
 * What the product can tell someone (`F6-05`). This vocabulary is COMPLETE from day one and
 * forward-compatible — the row says so in its own words — which is the one place Law 9's
 * grow-with-the-slice is overridden, and deliberately: the registry beside it is what stops the
 * first module that needs a notification from inventing a private one (`F6-01`).
 *
 * A readonly tuple, so contracts derives its `z.enum` and the migration mirrors the pgEnum from
 * this one list. A V2 module extends it by REGISTRATION — a value here and a row in the
 * registry — never by writing a notification the registry has never heard of.
 */
export const NOTIFICATION_TYPES = [
  'proposal_opened',
  'agent_escalation',
  'follow_up_due',
  'survey_submitted',
  'design_returned',
  'signoff_requested',
  'payment_due',
  'lead_unassigned_24h',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Where a notification can be delivered, and nowhere else (`F6-11`). The in-app record is the
 * truth and is always written; push is best-effort on top of it (`F6-06`). The one sanctioned
 * exception — the billing family riding the market pack's channels — belongs to the slice that
 * raises those types and is not authored here.
 */
export const NOTIFICATION_CHANNELS = ['in_app', 'push'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/**
 * How soon, fixed per TYPE and never improvised per event (`F6-13`): `immediate` is pushed at
 * once and never grouped; `standard` is everything else. Whether a type groups is read from this
 * and from nothing else, which is why the registry carries no grouping class of its own.
 */
export const NOTIFICATION_URGENCIES = ['immediate', 'standard'] as const;
export type NotificationUrgency = (typeof NOTIFICATION_URGENCIES)[number];

/**
 * Who a type is addressed to, in KIND (`F6-05`). Turning one of these plus a record into actual
 * people is `F6-16`'s scope resolution, which is a different row and a different slice — this
 * says only which relationship to the subject the recipient stands in.
 */
export const NOTIFICATION_RECIPIENT_RULES = [
  /** Whoever owns the record the notification points at — the deal's rep, the design's author. */
  'subject_owner',
  /** Whoever the record is assigned to, where that is someone other than its owner. */
  'subject_assignee',
  /** Everyone whose presets grant the act the subject is waiting on — a sign-off queue. */
  'capability_holders',
  /** The company's EPC Owner, who is also the recipient of last resort when nothing else matches. */
  'epc_owner',
] as const;
export type NotificationRecipientRule = (typeof NOTIFICATION_RECIPIENT_RULES)[number];

/**
 * The five groups a person may mute push for (`F6-15`) and the notification centre filters by
 * (`F6-17`). `F6` never enumerates them; the raising module is the only grouping it offers, so
 * these ARE that grouping, named for the work rather than for a module id. One taxonomy, not
 * two: `F6-12`'s grouping is not a vocabulary at all — records group by type and subject within
 * a day, and whether a type groups is its urgency.
 *
 * A type does not carry its group. The group is derived from what RAISES the type
 * (`registry.ts`), so the two can never disagree.
 */
export const NOTIFICATION_TYPE_GROUPS = [
  'sales',
  'delivery',
  'payments',
  'team',
  'billing',
] as const;
export type NotificationTypeGroup = (typeof NOTIFICATION_TYPE_GROUPS)[number];

/**
 * Which read state the centre lists (`F6-17`): everything, or only what is still unread. Read
 * state moves one way (`F6-07`), so there is no "read only" view to offer — a read item is
 * simply one the reader has already seen.
 */
export const NOTIFICATION_READ_FILTERS = ['all', 'unread'] as const;
export type NotificationReadFilter = (typeof NOTIFICATION_READ_FILTERS)[number];

/**
 * The platforms a push can be addressed to (`F6-13`). Closed: a handset runs one of these, and
 * the transport needs to know which to shape its payload. Mirrored as a pgEnum (`M17`).
 */
export const PUSH_PLATFORMS = ['ios', 'android'] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

/**
 * What raises a notification — named for the work it does, never for a document id. A type
 * belongs to exactly one of these, and that is the only grouping `F6` itself offers.
 */
export const NOTIFICATION_SOURCES = [
  'crm',
  'survey',
  'design',
  'proposals',
  'sales_execution',
  'payments',
  'platform',
] as const;
export type NotificationSource = (typeof NOTIFICATION_SOURCES)[number];
