import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, extensibleEnum, uuidSchema } from '../common';
import {
  baseError,
  errorEnvelope,
  IDEMPOTENCY_KEY_REUSED,
  unauthenticatedEnvelope,
} from '../error';
import { leadParamsSchema } from './leads';
import { capturedAtSchema, crmTextSchema, taskSchema } from './schemas';
import { taskKindSchema } from './vocabulary';

const c = initContract();

/*
 * Follow-up tasks (`M07-05`): built once here for the call-backs, retries,
 * wakes and the Tasks section. Overdue is derived from `dueAt`, never stored.
 */

/**
 * A task on a lead: its kind, when it is due, and its words when custom. It goes to the lead's
 * owner unless another assignee is named.
 */
export const createTaskSchema = z
  .object({
    kind: taskKindSchema,
    dueAt: z.string().datetime(),
    title: crmTextSchema.optional(),
    assigneeId: uuidSchema.optional(),
  })
  .strict()
  .refine((task) => task.kind !== 'custom' || task.title !== undefined, {
    path: ['title'],
    message: 'a custom task says what it is',
  });
export type CreateTask = z.infer<typeof createTaskSchema>;

/** Done or reopened, and when the person did it; a task already there answers as it stands. */
export const taskActSchema = z.object({ capturedAt: capturedAtSchema }).strict();
export type TaskAct = z.infer<typeof taskActSchema>;

/**
 * The task refusals: the assignee is not an active member of the company; a call to a number no
 * one may dial — a wrong number or do-not-call (`M02-44`).
 */
export const taskErrorCodes = ['ASSIGNEE_UNAVAILABLE', 'NUMBER_NOT_DIALLABLE'] as const;
export const taskErrorCodeSchema = z.enum(taskErrorCodes);

const notFound = errorEnvelope(baseError('NOT_FOUND'));
const taskParams = z.object({ id: uuidSchema });

export const tasksContract = c.router({
  create: {
    method: 'POST',
    path: '/leads/:id/tasks',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: createTaskSchema,
    summary: 'Add a follow-up task to the lead, due at a time, for its owner or a named person',
    responses: {
      201: taskSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: errorEnvelope(extensibleEnum([...taskErrorCodes, IDEMPOTENCY_KEY_REUSED])),
    },
  },
  done: {
    method: 'POST',
    path: '/tasks/:id/done',
    pathParams: taskParams,
    body: taskActSchema,
    summary: 'Mark a task done — the lead’s timeline records it',
    responses: {
      200: taskSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      /** A cancelled task is history, never done. */
      409: errorEnvelope(baseError('CONFLICT')),
    },
  },
  reopen: {
    method: 'POST',
    path: '/tasks/:id/reopen',
    pathParams: taskParams,
    body: taskActSchema,
    summary: 'Reopen a done task — it is open again, and overdue if its due time has passed',
    responses: {
      200: taskSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      /** A cancelled task is history, never reopened. */
      409: errorEnvelope(baseError('CONFLICT')),
    },
  },
});
