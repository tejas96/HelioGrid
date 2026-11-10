import {
  ACTIVITY_KINDS,
  type ActivityKind,
  LEAD_SOURCES,
  MERGE_FIELDS,
  MESSAGE_TEMPLATE_KEYS,
  TASK_KINDS,
  TRANSITION_CAUSES,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extensibleEnum, paginated, paginationQuerySchema, uuidSchema } from '../common';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from '../error';
import { calendarDateSchema, clockTimeSchema } from '../tenant-settings';
import { leadFieldSchema } from './lead-edits';
import { leadParamsSchema } from './leads';
import { mergeSideSchema } from './merge';
import { memberRefSchema } from './schemas';
import {
  activityActorSchema,
  callOutcomeSchema,
  dealSegmentSchema,
  disqualifyReasonSchema,
  leadLifecycleStateSchema,
  leadStageSchema,
  lostReasonSchema,
} from './vocabulary';

const c = initContract();

/*
 * The timeline (`M02-35`, `M02-36`, `T-M02-012`): one append-only stream per customer, each entry
 * optionally naming its lead, newest first by the server's apply order. A customer's stream reads
 * through the merge tombstone: every entry of the customer and of each customer merged into it.
 */

const entryShape = {
  id: uuidSchema,
  leadId: uuidSchema.nullable(),
  /** Who did it (`M02-35`); `id` and `name` are null for the system. A name survives deactivation. */
  actor: z.object({
    kind: activityActorSchema,
    id: uuidSchema.nullable(),
    name: z.string().nullable(),
  }),
  /** When it happened by the device's clock — shown, never what orders the stream (`F4-19`). */
  capturedAt: z.string().datetime(),
  /** When the server applied it; the stream is ordered by apply, newest first. */
  appliedAt: z.string().datetime(),
};

/** One kind's entry: the shared facts, the kind, and the body that kind carries. */
function entryOf<K extends ActivityKind, B extends z.ZodRawShape>(kind: K, body: B) {
  return z.object({ ...entryShape, kind: z.literal(kind), body: z.object(body) });
}

const cause = extensibleEnum(TRANSITION_CAUSES);
const visitFacts = {
  visitId: uuidSchema,
  date: calendarDateSchema,
  time: clockTimeSchema,
  surveyor: memberRefSchema,
  address: z.string(),
};

/**
 * An entry of a kind this build knows; its `kind` narrows its `body`. Every kind domain declares has
 * its body here (`tests/crm-activity.test.ts`).
 */
export const knownActivitySchema = z.discriminatedUnion('kind', [
  entryOf('lead_created', {
    source: extensibleEnum(LEAD_SOURCES),
    segment: dealSegmentSchema.nullable(),
  }),
  entryOf('note', { text: z.string() }),
  entryOf('call', { outcome: callOutcomeSchema, note: z.string().nullable() }),
  /** What the capture typed (`M02-11`); `askedBy` is the colleague who asked the owner (`M02-08`). */
  entryOf('enquiry', {
    channel: extensibleEnum(LEAD_SOURCES),
    name: z.string().nullable(),
    city: z.string().nullable(),
    segment: dealSegmentSchema.nullable(),
    phoneE164: z.string(),
    askedBy: memberRefSchema.nullable(),
  }),
  entryOf('stage_change', { from: leadStageSchema.nullable(), to: leadStageSchema, cause }),
  /** `null` on either side is the active lead; a close names its reason, a snooze its wake day. */
  entryOf('state_change', {
    from: leadLifecycleStateSchema.nullable(),
    to: leadLifecycleStateSchema.nullable(),
    cause,
    disqualifyReason: disqualifyReasonSchema.nullable(),
    lostReason: lostReasonSchema.nullable(),
    wakeOn: calendarDateSchema.nullable(),
  }),
  /** The assignee's open count at that moment, and why, on a reassignment (`M02-30`). */
  entryOf('assignment', {
    from: memberRefSchema.nullable(),
    to: memberRefSchema,
    openCount: z.number().int().nonnegative(),
    reason: z.string().nullable(),
  }),
  /** A value as stored — text, an amount, a vocabulary key, `true` or `false`; `null` is a gap. */
  entryOf('field_change', {
    field: extensibleEnum(leadFieldSchema.options),
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
  entryOf('duplicate_kept', {
    otherCustomerId: uuidSchema,
    otherName: z.string().nullable(),
    reason: z.string(),
  }),
  /** On the referred lead it names the referrer; on the referrer's stream, the lead referred. */
  entryOf('referral', {
    referrerCustomerId: uuidSchema.nullable(),
    referrerName: z.string().nullable(),
    referredLeadId: uuidSchema,
  }),
  /** Text handed to the person to send themselves — no delivery is ever claimed (`M02-33`). */
  entryOf('message_copied', {
    templateKey: extensibleEnum(MESSAGE_TEMPLATE_KEYS),
    visitId: uuidSchema.nullable(),
  }),
  entryOf('visit_booked', visitFacts),
  entryOf('visit_rescheduled', { ...visitFacts, previousVisitId: uuidSchema }),
  entryOf('task_done', {
    taskId: uuidSchema,
    kind: extensibleEnum(TASK_KINDS),
    title: z.string().nullable(),
  }),
  /** What merged into what, and the side each differing field was taken from (`M02-61`). */
  entryOf('customer_merged', {
    survivorId: uuidSchema,
    mergedId: uuidSchema,
    choices: z.array(z.object({ field: extensibleEnum(MERGE_FIELDS), kept: mergeSideSchema })),
  }),
]);
export type KnownActivity = z.infer<typeof knownActivitySchema>;

/**
 * An entry of a kind a newer server has learned: every module writes into the one stream, so a
 * reader shows it as a plain system entry rather than refusing the page (`M02-35`).
 */
const laterActivitySchema = z.object({
  ...entryShape,
  kind: extensibleEnum(ACTIVITY_KINDS),
  body: z.record(z.string(), z.unknown()),
});

export const activitySchema = z.union([knownActivitySchema, laterActivitySchema]);
export type Activity = z.infer<typeof activitySchema>;

/** Named, so each timeline route references the page rather than spelling its whole type. */
export interface ActivityPageSchema extends ReturnType<typeof paginated<typeof activitySchema>> {}
export const activityPageSchema: ActivityPageSchema = paginated(activitySchema);
export type ActivityPage = z.infer<typeof activityPageSchema>;

const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const activitiesContract = c.router({
  leadTimeline: {
    method: 'GET',
    path: '/leads/:id/activities',
    pathParams: leadParamsSchema,
    query: paginationQuerySchema,
    summary: 'The lead’s timeline, newest first by the server’s apply order',
    responses: { 200: activityPageSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  customerTimeline: {
    method: 'GET',
    path: '/customers/:id/activities',
    pathParams: z.object({ id: uuidSchema }),
    query: paginationQuerySchema,
    summary:
      'The customer’s one stream — every lead’s entries and every customer merged into it — newest first',
    responses: { 200: activityPageSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
});
