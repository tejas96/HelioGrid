import { MERGE_FIELDS, type MergeSide } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extensibleEnum, phoneE164Schema, uuidSchema } from '../common';
import {
  baseError,
  errorEnvelope,
  errorEnvelopeWithFacts,
  unauthenticatedEnvelope,
} from '../error';
import { capturedAtSchema, customerSchema } from './schemas';

const c = initContract();

/*
 * Customer merge (`M02-59`…`M02-63`, `crm/merge-plan.ts`): pick the survivor, choose a side for
 * every field the two disagree on, and confirm. Everything re-points to the survivor, the loser
 * becomes a tombstone — never deleted — and no money moves. Both must be in the person's scope.
 */

/** A field the compare step asks a side for (`M02-60`). Grows with the record; a read is extensible. */
export const mergeFieldSchema = z.enum(MERGE_FIELDS);
export const mergeSideSchema = z.enum(['survivor', 'loser']) satisfies z.ZodType<MergeSide>;

/** The side each differing field is taken from; a pick for a field that agrees is ignored. */
export const mergePicksSchema = z.record(mergeFieldSchema, mergeSideSchema);
export type MergePicksWire = z.infer<typeof mergePicksSchema>;

export const mergePairSchema = z.object({ survivorId: uuidSchema, loserId: uuidSchema });

/** Why the two cannot merge: one is outside the person's scope, or is already a tombstone. */
export const mergeBlockSchema = z.enum(['out_of_scope', 'already_merged']);

const mergeCustomerSchema = z.object({
  customerId: uuidSchema,
  name: z.string().nullable(),
  phoneE164: phoneE164Schema,
  city: z.string().nullable(),
});

/** What re-points from the loser to the survivor, counted (`M02-63`: the confirm says what moves). */
export const mergeMovesSchema = z.object({
  contacts: z.number().int().nonnegative(),
  leads: z.number().int().nonnegative(),
  activities: z.number().int().nonnegative(),
  referrals: z.number().int().nonnegative(),
  visits: z.number().int().nonnegative(),
  tasks: z.number().int().nonnegative(),
  files: z.number().int().nonnegative(),
});

/**
 * The compare and confirm steps' read. Blocked, it says why and carries nothing of either record;
 * otherwise both customers, each field they disagree on with both values — a primary contact by its
 * name, `null` where it is the customer themself — and what will move.
 */
export const mergePreviewSchema = z.object({
  blocked: mergeBlockSchema.nullable(),
  /**
   * Blocked `out_of_scope`: who holds the record the reader cannot see, by name — never the record
   * itself (`M02-08`'s rule) — so the reader knows whom to ask; `null` while that record waits
   * unassigned, and for every other answer.
   */
  heldBy: z.string().nullable(),
  survivor: mergeCustomerSchema.nullable(),
  loser: mergeCustomerSchema.nullable(),
  differences: z.array(
    z.object({
      field: extensibleEnum(MERGE_FIELDS),
      survivor: z.string().nullable(),
      loser: z.string().nullable(),
    }),
  ),
  moves: mergeMovesSchema.nullable(),
});
export type MergePreview = z.infer<typeof mergePreviewSchema>;

/** The confirmed merge: the pair, a side for every differing field, and when it was confirmed. */
export const mergeCustomersSchema = mergePairSchema
  .extend({ picks: mergePicksSchema, capturedAt: capturedAtSchema })
  .strict()
  .refine((merge) => merge.survivorId !== merge.loserId, {
    path: ['loserId'],
    message: 'a customer is not merged into itself',
  });
export type MergeCustomers = z.infer<typeof mergeCustomersSchema>;

/** The survivor as it now stands, and its newest lead — where *Open customer* lands. */
export const mergedSchema = z.object({ survivor: customerSchema, leadId: uuidSchema });
export type Merged = z.infer<typeof mergedSchema>;

/** The merge refusals: a record outside the person's scope or already merged; a pick still missing. */
export const mergeErrorCodes = [
  'MERGE_OUT_OF_SCOPE',
  'CUSTOMER_ALREADY_MERGED',
  'MERGE_CHOICES_MISSING',
] as const;
export const mergeErrorCodeSchema = z.enum(mergeErrorCodes);

const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const customerMergeContract = c.router({
  preview: {
    method: 'GET',
    path: '/customers/merge-preview',
    query: mergePairSchema,
    summary:
      'What a merge of these two would ask and move — or why it cannot run, saying nothing of a record outside the reader’s scope',
    responses: { 200: mergePreviewSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  merge: {
    method: 'POST',
    path: '/customers/merge',
    body: mergeCustomersSchema,
    summary:
      'Merge the loser into the survivor in one transaction — every reference re-points, the loser is kept as a tombstone, no money moves; it cannot be undone',
    responses: {
      200: mergedSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      409: errorEnvelope(
        mergeErrorCodeSchema.extract(['MERGE_OUT_OF_SCOPE', 'CUSTOMER_ALREADY_MERGED']),
      ),
      /** A field the two disagree on has no side; `facts.unpicked` names each. */
      422: errorEnvelopeWithFacts(
        mergeErrorCodeSchema.extract(['MERGE_CHOICES_MISSING']),
        z.object({ unpicked: z.array(extensibleEnum(MERGE_FIELDS)) }),
      ),
    },
  },
});
