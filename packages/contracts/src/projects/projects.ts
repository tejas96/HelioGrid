import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { paginated, paginationQuerySchema, uuidSchema } from '../common';
import { leadParamsSchema } from '../crm/leads';
import { baseError, errorEnvelope, unauthenticatedEnvelope } from '../error';
import { shareableMessageSchema } from '../proposals/acts';
import { calendarDateSchema } from '../tenant-settings';
import { versionInForcePreviewSchema, wonBasisSchema } from './proposal-handoff';
import {
  projectBoardSchema,
  projectCardSchema,
  projectDetailSchema,
  projectParamsSchema,
  projectPersonSchema,
  projectStageReadSchema,
} from './schemas';

const c = initContract();

/** A project out of the reader's reach, or gone. */
export const projectNotFound = errorEnvelope(baseError('NOT_FOUND'));

/** The handover's own read: the rows still waiting, and the message in the customer's language. */
export const handoverPreviewSchema = z.object({
  pendingRows: z.array(z.string()),
  /** How many files the pack made at handover holds: each done row's, each shown to the customer. */
  pack: z.object({ files: z.number().int().nonnegative() }),
  message: z.object({ language: z.string(), text: z.string() }),
});
export type HandoverPreview = z.infer<typeof handoverPreviewSchema>;

/** The installer's job (`SCR-M08-05`): only what the work needs — never a price (`M08-43`). */
export const projectJobSchema = z.object({
  id: uuidSchema,
  number: z.string(),
  name: z.string().nullable(),
  place: z.string().nullable(),
  phoneE164: z.string(),
  stage: projectStageReadSchema,
  accessNote: z.string().nullable(),
  /** The steps and their ticks; their photos are the project's own read (`M08-45`). */
  steps: z.array(projectDetailSchema.shape.steps.element.omit({ files: true })),
});
export type ProjectJob = z.infer<typeof projectJobSchema>;

export const closedProjectsQuerySchema = paginationQuerySchema.extend({
  stage: z.enum(['handed_over', 'cancelled']),
  /** Only those closed on or after this company day — the board's handed-over stop looks back 30. */
  since: calendarDateSchema.optional(),
});

/*
 * `people` and `jobs` stand before `detail`: a router matches in order, and `/projects/:id` would
 * take `/projects/jobs` as an id.
 */
export const projectsContract = c.router({
  board: {
    method: 'GET',
    path: '/projects/board',
    summary:
      'The board — the company’s today, each stage’s count and oldest entry, and every live project the reader may see',
    responses: { 200: projectBoardSchema, 401: unauthenticatedEnvelope },
  },
  closed: {
    method: 'GET',
    path: '/projects/closed',
    query: closedProjectsQuerySchema,
    summary: 'Handed-over or cancelled projects, newest first — never deleted (`M08-49`, `M08-53`)',
    responses: { 200: paginated(projectCardSchema), 401: unauthenticatedEnvelope },
  },
  people: {
    method: 'GET',
    path: '/projects/people',
    query: z.object({ role: z.enum(['manager', 'crew']) }),
    summary: 'Who can manage a project, or be on its crew, with their live projects',
    responses: { 200: z.array(projectPersonSchema), 401: unauthenticatedEnvelope },
  },
  jobs: {
    method: 'GET',
    path: '/projects/jobs',
    summary: 'The installer’s assigned live jobs — steps, access and photos, never a price',
    responses: { 200: z.array(projectJobSchema), 401: unauthenticatedEnvelope },
  },
  detail: {
    method: 'GET',
    path: '/projects/:id',
    pathParams: projectParamsSchema,
    summary: 'One project — every block on one screen (`M08-16`)',
    responses: { 200: projectDetailSchema, 401: unauthenticatedEnvelope, 404: projectNotFound },
  },
  versionInForcePreview: {
    method: 'GET',
    path: '/projects/:id/version-in-force/:version',
    pathParams: projectParamsSchema.extend({ version: z.coerce.number().int().positive() }),
    summary:
      'What putting a version in force would do: the new total, what is paid and stays, and the plan for the rest',
    responses: {
      200: versionInForcePreviewSchema,
      401: unauthenticatedEnvelope,
      404: projectNotFound,
    },
  },
  crewMessage: {
    method: 'GET',
    path: '/projects/:id/crew-message',
    pathParams: projectParamsSchema,
    summary:
      'The evening-before installation message a person sends, in the customer’s language (`F5-68`)',
    responses: { 200: shareableMessageSchema, 401: unauthenticatedEnvelope, 404: projectNotFound },
  },
  wonBasis: {
    method: 'GET',
    path: '/leads/:id/won-basis',
    pathParams: leadParamsSchema,
    summary:
      'What Mark won takes from the lead’s proposal: the accepted version’s value and plan, or why it is typed',
    responses: { 200: wonBasisSchema, 401: unauthenticatedEnvelope, 404: projectNotFound },
  },
  handoverPreview: {
    method: 'GET',
    path: '/projects/:id/handover',
    pathParams: projectParamsSchema,
    summary: 'What handover checks, and the message it hands over in the customer’s language',
    responses: { 200: handoverPreviewSchema, 401: unauthenticatedEnvelope, 404: projectNotFound },
  },
});
