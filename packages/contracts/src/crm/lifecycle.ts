import { LEAD_ACT_REFUSALS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extensibleEnum } from '../common';
import {
  baseError,
  errorEnvelope,
  errorEnvelopeWithFacts,
  unauthenticatedEnvelope,
} from '../error';
import { calendarDateSchema } from '../tenant-settings';
import { leadDetailSchema, leadParamsSchema } from './leads';
import { capturedAtSchema } from './schemas';
import { disqualifyReasonSchema, lostReasonSchema } from './vocabulary';

const c = initContract();

/*
 * The R9 acts (`M02-49`…`M02-56`) and Mark qualified (`M02-45`): each its own route, so each body
 * is one plain object. A move the machine does not allow from where the lead stands is refused
 * with domain's reason (`F4-16`); stage and state stay two fields, and no parking state moves the
 * stage. Mark lost (`M07-63`) is one of them, with its seven reasons and a postponed loss's date.
 */

/** Every act carries when the person did it (`F4-19`). */
export const leadActSchema = z.object({ capturedAt: capturedAtSchema }).strict();
export type LeadAct = z.infer<typeof leadActSchema>;

/** Snooze (`M02-51`): the wake date is mandatory; the lead wakes at 09:00 tenant time that day. */
export const snoozeLeadSchema = leadActSchema.extend({ wakeOn: calendarDateSchema }).strict();
export type SnoozeLead = z.infer<typeof snoozeLeadSchema>;

/** Disqualify (`M02-42`, `M02-53`): one of the six reasons, mandatory. `wrong_number` stops every dial. */
export const disqualifyLeadSchema = leadActSchema
  .extend({ reason: disqualifyReasonSchema })
  .strict();
export type DisqualifyLead = z.infer<typeof disqualifyLeadSchema>;

/**
 * Mark lost (`M07-63`, `M02-54`): one of the seven reasons, mandatory. *Postponed* carries the day
 * the lead comes back at 09:00 tenant time; *not interested* holds calls back for six months.
 */
export const markLostSchema = leadActSchema
  .extend({ reason: lostReasonSchema, resurfaceOn: calendarDateSchema.optional() })
  .strict();
export type MarkLost = z.infer<typeof markLostSchema>;

/**
 * A move the lead's standing does not allow — a wake on a lead not snoozed, a snooze to a day not
 * ahead, a reopen of an open lead, an act on a closed one. `facts.refusal` is domain's reason.
 */
export const LEAD_TRANSITION_REFUSED = 'LEAD_TRANSITION_REFUSED' as const;
export const leadTransitionRefusedEnvelope = errorEnvelopeWithFacts(
  z.literal(LEAD_TRANSITION_REFUSED),
  z.object({ refusal: extensibleEnum(LEAD_ACT_REFUSALS) }),
);

const notFound = errorEnvelope(baseError('NOT_FOUND'));
const answers = {
  200: leadDetailSchema,
  401: unauthenticatedEnvelope,
  404: notFound,
  422: leadTransitionRefusedEnvelope,
} as const;

export const leadLifecycleContract = c.router({
  markQualified: {
    method: 'POST',
    path: '/leads/:id/qualified',
    pathParams: leadParamsSchema,
    body: leadActSchema,
    summary:
      'Mark the lead qualified — a person decides; the six answers inform and never move the stage',
    responses: answers,
  },
  snooze: {
    method: 'POST',
    path: '/leads/:id/snooze',
    pathParams: leadParamsSchema,
    body: snoozeLeadSchema,
    summary:
      'Snooze the lead until a date — hidden from My Day, back at 09:00 tenant time that day with a follow-up task',
    responses: answers,
  },
  wake: {
    method: 'POST',
    path: '/leads/:id/wake',
    pathParams: leadParamsSchema,
    body: leadActSchema,
    summary: 'Wake a snoozed lead now — it returns to its stage',
    responses: answers,
  },
  disqualify: {
    method: 'POST',
    path: '/leads/:id/disqualify',
    pathParams: leadParamsSchema,
    body: disqualifyLeadSchema,
    summary:
      'Disqualify the lead with one of the six reasons — a wrong number removes every dial offer for it',
    responses: answers,
  },
  lost: {
    method: 'POST',
    path: '/leads/:id/lost',
    pathParams: leadParamsSchema,
    body: markLostSchema,
    summary:
      'Mark the lead lost with one of the seven reasons — a postponed loss comes back on its day, and the lead’s open tasks are cancelled',
    responses: answers,
  },
  junk: {
    method: 'POST',
    path: '/leads/:id/junk',
    pathParams: leadParamsSchema,
    body: leadActSchema,
    summary:
      'Bin the lead as junk — it leaves every queue and list, is never deleted, and search still finds it',
    responses: answers,
  },
  reopen: {
    method: 'POST',
    path: '/leads/:id/reopen',
    pathParams: leadParamsSchema,
    body: leadActSchema,
    summary:
      'Reopen a disqualified, lost, dormant or junk lead at its prior stage — the close stays on the record and the reopen is counted',
    responses: answers,
  },
});
