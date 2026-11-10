import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, extensibleEnum, uuidSchema } from '../common';
import {
  baseError,
  errorEnvelope,
  IDEMPOTENCY_KEY_REUSED,
  unauthenticatedEnvelope,
} from '../error';
import { calendarDateSchema, clockTimeSchema } from '../tenant-settings';
import { leadDetailSchema, leadParamsSchema } from './leads';
import { leadTransitionRefusedEnvelope } from './lifecycle';
import { capturedAtSchema, memberRefSchema, visitAddressSchema } from './schemas';

const c = initContract();

/*
 * The site-visit booking (`M02-46`…`M02-48`): the lead's half of the visit M04 owns. A booking moves
 * the lead to `survey` and lands on the timeline; a no-show reschedules into a successor visit.
 * The confirmation and the one reminder are composed as text (`messages.ts`).
 */

/** Date and time on the tenant's clock, the surveyor — anyone holding survey — and the address. */
export const bookVisitSchema = z
  .object({
    date: calendarDateSchema,
    time: clockTimeSchema,
    surveyorId: uuidSchema,
    address: visitAddressSchema,
    capturedAt: capturedAtSchema,
  })
  .strict();
export type BookVisit = z.infer<typeof bookVisitSchema>;

/** A no-show's new slot (`M02-48`); the surveyor and address carry over unless sent. */
export const rescheduleVisitSchema = bookVisitSchema
  .partial({ surveyorId: true, address: true })
  .strict();
export type RescheduleVisit = z.infer<typeof rescheduleVisitSchema>;

/**
 * Who can take the visit (`M02-46`, D15): every active member holding survey, by name — the same
 * rule a booking's `surveyorId` is held to, so whoever this lists a booking accepts.
 */
export const visitSurveyorsSchema = z.object({ items: z.array(memberRefSchema) });
export type VisitSurveyors = z.infer<typeof visitSurveyorsSchema>;

/**
 * The visit refusals: the surveyor is not an active member holding survey; the lead already has a
 * visit booked (reschedule it instead); the visit was already rescheduled.
 */
export const visitErrorCodes = [
  'SURVEYOR_UNAVAILABLE',
  'VISIT_ALREADY_BOOKED',
  'VISIT_ALREADY_RESCHEDULED',
] as const;
export const visitErrorCodeSchema = z.enum(visitErrorCodes);

const notFound = errorEnvelope(baseError('NOT_FOUND'));
/** The refusal carrying facts goes first: the open set would otherwise take it and drop them. */
const createRefusals = z.union([
  leadTransitionRefusedEnvelope,
  errorEnvelope(
    extensibleEnum([visitErrorCodeSchema.enum.SURVEYOR_UNAVAILABLE, IDEMPOTENCY_KEY_REUSED]),
  ),
]);

export const visitsContract = c.router({
  surveyors: {
    method: 'GET',
    path: '/visit-surveyors',
    summary: 'The people a site visit can go to: every active member who holds survey, by name',
    responses: { 200: visitSurveyorsSchema, 401: unauthenticatedEnvelope },
  },
  book: {
    method: 'POST',
    path: '/leads/:id/visits',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: bookVisitSchema,
    summary:
      'Book the site visit — date, time, surveyor and confirmed address; the lead moves to survey',
    responses: {
      201: leadDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      409: errorEnvelope(visitErrorCodeSchema.extract(['VISIT_ALREADY_BOOKED'])),
      /** The surveyor cannot take it, the lead is closed or junk, or the retry key is reused. */
      422: createRefusals,
    },
  },
  reschedule: {
    method: 'POST',
    path: '/visits/:id/reschedule',
    pathParams: z.object({ id: uuidSchema }),
    headers: createHeadersSchema,
    body: rescheduleVisitSchema,
    summary:
      'Reschedule a no-show into a new visit — the one reminder is composed from the new one',
    responses: {
      201: leadDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      409: errorEnvelope(visitErrorCodeSchema.extract(['VISIT_ALREADY_RESCHEDULED'])),
      422: createRefusals,
    },
  },
});
