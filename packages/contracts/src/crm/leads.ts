import { LEAD_LIST_SORTS, LEAD_SOURCES, TASK_KINDS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  currencyCodeSchema,
  extensibleEnum,
  nonNegativeAmountSchema,
  paginated,
  paginationQuerySchema,
  queryFlagSchema,
  uuidSchema,
} from '../common';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from '../error';
import { calendarDateSchema } from '../tenant-settings';
import {
  customerSchema,
  leadSummarySchema,
  memberRefSchema,
  taskSchema,
  visitSchema,
} from './schemas';
import {
  buyingTimelineSchema,
  decisionMakerSchema,
  disqualifyReasonSchema,
  leadLifecycleStateSchema,
  leadSourceSchema,
  leadStageSchema,
  lostReasonSchema,
  roofOwnershipSchema,
  roofTypeSchema,
  shadingSchema,
} from './vocabulary';

const c = initContract();

/*
 * The leads reads (`SCR-M02-02` … `04`): the list, the inbox and one lead. Every read applies the
 * reader's visibility scope (`F2-12`…`F2-14`); a lead outside it answers 404.
 */

/**
 * The list's state filter: the active leads, or one parked or closed state. Junk is never listed —
 * it lives in search alone (`M02-55`, `M02-58`).
 */
export const leadListStateSchema = z.enum([
  'active',
  ...leadLifecycleStateSchema.exclude(['junk']).options,
]);
export type LeadListState = z.infer<typeof leadListStateSchema>;

/** What the list orders by (`M02-40`: the bill is sortable); each runs newest or largest first by default. */
export const leadListSortSchema = z.enum(LEAD_LIST_SORTS);
export type LeadListSort = z.infer<typeof leadListSortSchema>;

/**
 * The Leads list (`SCR-M02-03`). With no `state` it lists the open work — active and snoozed
 * leads; `unassigned` keeps leads with no owner and wins over an `ownerId`. The bill bounds
 * are in the tenant's currency and keep only leads whose bill is known; `q` keeps a name, city or
 * number match.
 */
export const leadListQuerySchema = paginationQuerySchema.extend({
  stage: leadStageSchema.optional(),
  state: leadListStateSchema.optional(),
  source: leadSourceSchema.optional(),
  ownerId: uuidSchema.optional(),
  unassigned: queryFlagSchema.optional(),
  billMin: nonNegativeAmountSchema.optional(),
  billMax: nonNegativeAmountSchema.optional(),
  sort: leadListSortSchema.default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().trim().min(1).max(100).optional(),
});
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

/**
 * One lead as the Leads list shows it: its summary, the day a snoozed lead wakes, the failed tries
 * since its last answered call (`M02-43`) and its next step — the soonest-due open task, with a
 * custom task's own words; `null` when none is open.
 */
export const leadListRowSchema = leadSummarySchema.extend({
  wakeOn: calendarDateSchema.nullable(),
  unansweredCalls: z.number().int().nonnegative(),
  nextTask: z
    .object({
      kind: extensibleEnum(TASK_KINDS),
      title: z.string().nullable(),
      dueAt: z.string().datetime(),
    })
    .nullable(),
});
export type LeadListRow = z.infer<typeof leadListRowSchema>;

/**
 * The pipeline the list sits in, counted under the reader's scope and the owner filter alone —
 * whatever else is filtered, so the meter keeps its shape while a filter narrows the rows: each
 * stage's active and snoozed leads (a stage with none is absent) and the dormant leads (`M02-52`).
 */
export const leadPipelineSchema = z.object({
  byStage: z.array(z.object({ stage: leadStageSchema, count: z.number().int().nonnegative() })),
  dormant: z.number().int().nonnegative(),
});
export type LeadPipeline = z.infer<typeof leadPipelineSchema>;

/** A page of leads, with the currency every bill on it is in, and the pipeline it sits in. */
export const leadListSchema = paginated(leadListRowSchema).extend({
  currencyCode: currencyCodeSchema,
  pipeline: leadPipelineSchema,
});
export type LeadList = z.infer<typeof leadListSchema>;

/**
 * The Lead Inbox (`SCR-M02-02`, `M02-23`): unassigned active leads from every channel, newest
 * first, with how many came by each source, how many have waited MORE than 24 hours (the
 * escalation's rule, `M02-50`), and when the oldest waiting one arrived — `null` when none waits.
 */
export const leadInboxSchema = paginated(leadSummarySchema).extend({
  currencyCode: currencyCodeSchema,
  bySource: z.array(
    z.object({ source: extensibleEnum(LEAD_SOURCES), count: z.number().int().nonnegative() }),
  ),
  past24Hours: z.number().int().nonnegative(),
  oldestAt: z.string().datetime().nullable(),
});
export type LeadInbox = z.infer<typeof leadInboxSchema>;

/** The six qualifying answers beside the bill (`M02-39`), each a gap while null. */
export const qualifyAnswersSchema = z.object({
  roofOwnership: roofOwnershipSchema.nullable(),
  roofType: roofTypeSchema.nullable(),
  shading: shadingSchema.nullable(),
  timeline: buyingTimelineSchema.nullable(),
  decisionMaker: decisionMakerSchema.nullable(),
});
export type QualifyAnswers = z.infer<typeof qualifyAnswersSchema>;

/**
 * The R9 facts beside the lead's state (`M02-49`…`M02-56`). `wakeOn` is set while snoozed,
 * `resurfaceOn` while a loss is postponed, `noCallUntil` while "not interested" holds calls off.
 * `lastClose` keeps the latest disqualify, loss or junk — reason, when and who — after a reopen too.
 */
export const leadLifecycleSchema = z.object({
  wakeOn: calendarDateSchema.nullable(),
  resurfaceOn: calendarDateSchema.nullable(),
  noCallUntil: calendarDateSchema.nullable(),
  lastClose: z
    .object({
      state: leadLifecycleStateSchema.extract(['disqualified', 'lost', 'junk']),
      disqualifyReason: disqualifyReasonSchema.nullable(),
      lostReason: lostReasonSchema.nullable(),
      at: z.string().datetime(),
      by: memberRefSchema.nullable(),
    })
    .nullable(),
  reopenCount: z.number().int().nonnegative(),
});
export type LeadLifecycleWire = z.infer<typeof leadLifecycleSchema>;

/**
 * One lead, as Lead Detail shows it (`M02-32`): the header facts, its customer with contacts, the
 * qualifying answers, the R9 standing, the call facts, where it came from, the booked visit, open
 * tasks and each section's count. Designs and proposals count 0 until their modules land.
 */
const leadDetailShape = {
  currencyCode: currencyCodeSchema,
  lead: leadSummarySchema,
  customer: customerSchema,
  qualify: qualifyAnswersSchema,
  qualifiedAt: z.string().datetime().nullable(),
  lifecycle: leadLifecycleSchema,
  /** Failed manual attempts since the last answered call (`M02-43`). */
  unansweredCalls: z.number().int().nonnegative(),
  /** False when the customer is do-not-call or a wrong number: no dial offer anywhere (`M02-44`). */
  canDial: z.boolean(),
  /** The referrer — a customer's record, or the name the person typed (`M02-16`). */
  cameFrom: z.object({ customerId: uuidSchema.nullable(), name: z.string().nullable() }).nullable(),
  visit: visitSchema.nullable(),
  openTasks: z.array(taskSchema),
  sections: z.object({
    designs: z.number().int().nonnegative(),
    proposals: z.number().int().nonnegative(),
    files: z.number().int().nonnegative(),
  }),
  /** The project a won lead became (`M07-62`, `M08-02`); null before the win. */
  project: z.object({ id: uuidSchema, number: z.string() }).nullable().optional(),
};

/**
 * Named, so the many routes answering a lead reference it rather than each spelling its whole type:
 * written out in every one of them, the root router's type grows past what the compiler serializes.
 */
export interface LeadDetailSchema extends z.ZodObject<typeof leadDetailShape> {}
export const leadDetailSchema: LeadDetailSchema = z.object(leadDetailShape);
export type LeadDetail = z.infer<typeof leadDetailSchema>;

export const leadParamsSchema = z.object({ id: uuidSchema });

const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const leadsContract = c.router({
  list: {
    method: 'GET',
    path: '/leads',
    query: leadListQuerySchema,
    summary:
      'The leads the reader may see, filtered by stage, state, source, owner and bill and sorted — never a junk lead',
    responses: { 200: leadListSchema, 401: unauthenticatedEnvelope },
  },
  inbox: {
    method: 'GET',
    path: '/lead-inbox',
    query: paginationQuerySchema,
    summary:
      'The one triage queue: unassigned active leads from every source, newest first, with the counts the head shows',
    responses: { 200: leadInboxSchema, 401: unauthenticatedEnvelope },
  },
  detail: {
    method: 'GET',
    path: '/leads/:id',
    pathParams: leadParamsSchema,
    summary:
      'One lead with its customer, answers, R9 standing, visit, open tasks and section counts',
    responses: { 200: leadDetailSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
});
