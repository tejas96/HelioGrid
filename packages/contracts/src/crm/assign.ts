import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { uuidSchema } from '../common';
import {
  baseError,
  errorEnvelope,
  errorEnvelopeWithFacts,
  unauthenticatedEnvelope,
} from '../error';
import { leadDetailSchema, leadParamsSchema } from './leads';
import { leadTransitionRefusedEnvelope } from './lifecycle';
import { crmReasonSchema, memberRefSchema } from './schemas';

const c = initContract();

/*
 * Assignment (`M02-27`…`M02-31`): manual, one tap, with each person's load in view. Every
 * assignment appends who, to whom, when and the assignee's open count, and tells the new owner.
 */

/**
 * One person a lead can go to (`M02-28`): an active member holding `crm.add_edit_leads`, with
 * their open leads (assigned, neither parked nor closed) and their open tasks past due. A
 * deactivated member is never listed.
 */
export const assigneeSchema = memberRefSchema.extend({
  openCount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
});
export type Assignee = z.infer<typeof assigneeSchema>;

export const assigneesSchema = z.object({ items: z.array(assigneeSchema) });
export type Assignees = z.infer<typeof assigneesSchema>;

/**
 * Assign one lead, compare-and-set on its owner (`M02-67`): `expectedOwnerId` is the owner the
 * screen showed — `null` for an unassigned lead — so the second of two people assigning at once
 * is refused naming who holds it. A reassignment may say why (`M02-30`).
 */
export const assignLeadSchema = z
  .object({
    assigneeId: uuidSchema,
    expectedOwnerId: uuidSchema.nullable(),
    reason: crmReasonSchema.optional(),
  })
  .strict();
export type AssignLead = z.infer<typeof assignLeadSchema>;

/**
 * Assign a selection to one person (`M02-29`), each lead on its own. `reason` is the intent to
 * reassign (`M02-30`): with it, a lead someone else owns moves too and the reason is recorded;
 * without it — the inbox's send — such a lead stays and answers who holds it.
 */
export const bulkAssignSchema = z
  .object({
    leadIds: z.array(uuidSchema).min(1).max(100),
    assigneeId: uuidSchema,
    reason: crmReasonSchema.optional(),
  })
  .strict();
export type BulkAssign = z.infer<typeof bulkAssignSchema>;

/**
 * What became of each lead: assigned; already the assignee's, so nothing moved; someone else's,
 * kept by a send that gave no reason, naming who holds it; or not one the person may assign —
 * gone, outside their scope, junk or closed.
 */
export const bulkAssignOutcomeSchema = z.enum([
  'assigned',
  'unchanged',
  'already_assigned',
  'unavailable',
]);
export type BulkAssignOutcome = z.infer<typeof bulkAssignOutcomeSchema>;

export const bulkAssignResultSchema = z.discriminatedUnion('outcome', [
  z.object({
    leadId: uuidSchema,
    outcome: z.literal(bulkAssignOutcomeSchema.enum.already_assigned),
    owner: memberRefSchema,
  }),
  z.object({
    leadId: uuidSchema,
    outcome: bulkAssignOutcomeSchema.exclude(['already_assigned']),
  }),
]);
export type BulkAssignResult = z.infer<typeof bulkAssignResultSchema>;

export const bulkAssignedSchema = z.object({ results: z.array(bulkAssignResultSchema) });
export type BulkAssigned = z.infer<typeof bulkAssignedSchema>;

/**
 * The assign refusals: the lead was assigned by someone else first; the assignee cannot hold a
 * lead (deactivated, or without the capability).
 */
export const assignErrorCodes = ['LEAD_ALREADY_ASSIGNED', 'ASSIGNEE_UNAVAILABLE'] as const;
export const assignErrorCodeSchema = z.enum(assignErrorCodes);

const notFound = errorEnvelope(baseError('NOT_FOUND'));
const assigneeRefusals = errorEnvelope(assignErrorCodeSchema.extract(['ASSIGNEE_UNAVAILABLE']));

export const leadAssignContract = c.router({
  assignees: {
    method: 'GET',
    path: '/lead-assignees',
    summary: 'The people a lead can go to, each with their open and overdue counts at this moment',
    responses: { 200: assigneesSchema, 401: unauthenticatedEnvelope },
  },
  assign: {
    method: 'POST',
    path: '/leads/:id/assign',
    pathParams: leadParamsSchema,
    body: assignLeadSchema,
    summary:
      'Give one lead to a person, if it is still held by the owner the screen showed — the new owner is told',
    responses: {
      200: leadDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      /** Someone assigned it first; `facts.owner` is who holds it now. */
      409: errorEnvelopeWithFacts(
        assignErrorCodeSchema.extract(['LEAD_ALREADY_ASSIGNED']),
        z.object({ owner: memberRefSchema.nullable() }),
      ),
      /** The assignee cannot hold it, or the lead is junk or closed: reopen it first. */
      422: z.union([leadTransitionRefusedEnvelope, assigneeRefusals]),
    },
  },
  bulkAssign: {
    method: 'POST',
    path: '/leads/assign',
    body: bulkAssignSchema,
    summary:
      'Give a selection of leads to one person and report each lead’s result — each recipient is told once',
    responses: {
      200: bulkAssignedSchema,
      401: unauthenticatedEnvelope,
      422: assigneeRefusals,
    },
  },
});
