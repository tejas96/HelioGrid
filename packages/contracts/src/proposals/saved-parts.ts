import { PROPOSAL_LIMITS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  createHeadersSchema,
  extensibleEnum,
  paginated,
  paginationQuerySchema,
  queryFlagSchema,
  uuidSchema,
} from '../common';
import {
  baseError,
  errorEnvelope,
  errorEnvelopeWithFacts,
  IDEMPOTENCY_KEY_REUSED,
  unauthenticatedEnvelope,
} from '../error';
import { savedPartKindSchema } from './vocabulary';

const c = initContract();

/*
 * The company's saved parts (`M06-28`, `T-M06-034`): cable, electrical and structure, added once
 * and tapped on every later proposal — brand, specification, warranty and one line for the
 * customer. No price, no count, no stock. A proposal's line keeps its own copy, so editing or
 * archiving a part never changes what a proposal already holds.
 */

const partText = (max: number) => z.string().trim().min(1).max(max);

export const savedPartWriteSchema = z
  .object({
    brand: partText(120),
    specification: partText(120),
    warranty: partText(120).nullable(),
    description: partText(PROPOSAL_LIMITS.componentDescription).nullable(),
  })
  .strict();
export type SavedPartWrite = z.infer<typeof savedPartWriteSchema>;

export const savedPartCreateSchema = savedPartWriteSchema.extend({ kind: savedPartKindSchema });

export const savedPartSchema = z.object({
  id: uuidSchema,
  kind: extensibleEnum(savedPartKindSchema.options),
  brand: z.string(),
  specification: z.string(),
  warranty: z.string().nullable(),
  description: z.string().nullable(),
  archived: z.boolean(),
});
export type SavedPart = z.infer<typeof savedPartSchema>;

/** One page of parts, ordered by kind, brand and id (`apps/api/CLAUDE.md` *List endpoints*). */
export const savedPartsQuerySchema = paginationQuerySchema.extend({
  kind: savedPartKindSchema.optional(),
  /** Archived parts too — the catalog holder's view; a picker never asks for them. */
  archived: queryFlagSchema.optional(),
});
export type SavedPartsQuery = z.infer<typeof savedPartsQuerySchema>;

/** The same brand and specification already saved, ignoring case and spaces: the part it is. */
export const SAVED_PART_DUPLICATE = 'SAVED_PART_DUPLICATE' as const;
const duplicate = errorEnvelopeWithFacts(
  z.literal(SAVED_PART_DUPLICATE),
  z.object({ partId: uuidSchema }),
);

const partParamsSchema = z.object({ id: uuidSchema });
const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const savedPartsContract = c.router({
  list: {
    method: 'GET',
    path: '/saved-parts',
    query: savedPartsQuerySchema,
    summary: 'The company’s saved cable, electrical and structure parts, as a picker offers them',
    responses: {
      200: paginated(savedPartSchema),
      401: unauthenticatedEnvelope,
    },
  },
  add: {
    method: 'POST',
    path: '/saved-parts',
    headers: createHeadersSchema,
    body: savedPartCreateSchema,
    summary: 'Save a part for every later proposal — the same brand and specification is refused',
    responses: {
      201: savedPartSchema,
      401: unauthenticatedEnvelope,
      409: duplicate,
      422: errorEnvelope(extensibleEnum([IDEMPOTENCY_KEY_REUSED])),
    },
  },
  save: {
    method: 'PUT',
    path: '/saved-parts/:id',
    pathParams: partParamsSchema,
    body: savedPartWriteSchema,
    summary: 'Change a saved part — proposals that already hold it keep their own copy',
    responses: {
      200: savedPartSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      409: duplicate,
    },
  },
  archive: {
    method: 'POST',
    path: '/saved-parts/:id/archive',
    pathParams: partParamsSchema,
    body: c.noBody(),
    summary: 'Take a part out of the pickers; versions keep their copy',
    responses: { 200: savedPartSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  restore: {
    method: 'POST',
    path: '/saved-parts/:id/restore',
    pathParams: partParamsSchema,
    body: c.noBody(),
    summary: 'Put an archived part back in the pickers',
    responses: {
      200: savedPartSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      409: duplicate,
    },
  },
});
