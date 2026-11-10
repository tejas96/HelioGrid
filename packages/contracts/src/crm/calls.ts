import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema } from '../common';
import { baseError, errorEnvelope, keyReusedEnvelope, unauthenticatedEnvelope } from '../error';
import { leadDetailSchema, leadParamsSchema } from './leads';
import { capturedAtSchema, crmTextSchema } from './schemas';
import { callOutcomeSchema } from './vocabulary';

const c = initContract();

/*
 * Logging what happened on a lead (`M02-35`, `M02-43`): a call and its outcome, or a note. Each is
 * one timeline entry, and any entry returns a dormant lead to its stage (`M02-52`). Both answer the
 * lead as it now stands, since a call can move its stage and raise its tasks.
 */

/**
 * A logged call (`M02-43`): answered moves a `new` lead to `contacted`; no answer logs an attempt,
 * schedules one retry inside the market's calling window and raises the failed-try count.
 */
export const logCallSchema = z
  .object({
    outcome: callOutcomeSchema,
    note: crmTextSchema.optional(),
    capturedAt: capturedAtSchema,
  })
  .strict();
export type LogCall = z.infer<typeof logCallSchema>;

export const addNoteSchema = z
  .object({ text: crmTextSchema, capturedAt: capturedAtSchema })
  .strict();
export type AddNote = z.infer<typeof addNoteSchema>;

const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const leadCallsContract = c.router({
  logCall: {
    method: 'POST',
    path: '/leads/:id/calls',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: logCallSchema,
    summary:
      'Log a call and its outcome — no answer schedules one retry in the calling window and counts the attempt',
    responses: {
      201: leadDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: keyReusedEnvelope,
    },
  },
  addNote: {
    method: 'POST',
    path: '/leads/:id/notes',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: addNoteSchema,
    summary: 'Add a note to the lead’s timeline',
    responses: {
      201: leadDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: keyReusedEnvelope,
    },
  },
});
