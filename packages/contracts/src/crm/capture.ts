import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, phoneE164Schema, uuidSchema } from '../common';
import {
  baseError,
  errorEnvelope,
  errorEnvelopeWithFacts,
  keyReusedEnvelope,
  unauthenticatedEnvelope,
} from '../error';
import { citySchema, personNameSchema } from '../tenant';
import { leadDetailSchema, leadParamsSchema } from './leads';
import { capturedAtSchema, crmReasonSchema, dedupeMatchSchema } from './schemas';
import { dealSegmentSchema } from './vocabulary';

const c = initContract();

/*
 * Capture (`SCR-M02-01`, `M02-01`…`M02-16`, `M02-66`): the live number check, the quick add, and the
 * dedupe sheet's three answers — log an enquiry, ask the owner, or keep both with a reason.
 */

/** The live check on the phone field (`M02-07`): what the number already belongs to, if anything. */
export const customerMatchQuerySchema = z.object({ phone: phoneE164Schema });
export type CustomerMatchQuery = z.infer<typeof customerMatchQuerySchema>;

export const customerMatchSchema = z.object({ match: dedupeMatchSchema.nullable() });
export type CustomerMatch = z.infer<typeof customerMatchSchema>;

/** What a capture typed — the four fields, of which only the number is required (`M02-01`, `M02-03`). */
const typedCaptureShape = {
  phoneE164: phoneE164Schema,
  name: personNameSchema.optional(),
  city: citySchema.optional(),
  segment: dealSegmentSchema.optional(),
  capturedAt: capturedAtSchema,
};

/**
 * Who referred the lead (`M02-16`): an existing customer, or a name typed for someone who is not
 * one — exactly one of the two.
 */
export const referredBySchema = z
  .object({ customerId: uuidSchema.optional(), name: personNameSchema.optional() })
  .strict()
  .refine((by) => (by.customerId === undefined) !== (by.name === undefined), {
    message: 'a referral names a customer or a typed name, exactly one',
  });

/**
 * Create anyway (`M02-12`): the customer the number met, and the mandatory reason. Both records
 * then exist and are linked; the reason joins both timelines and the audit log.
 */
export const keepBothSchema = z.object({
  otherCustomerId: uuidSchema,
  reason: crmReasonSchema,
});

/**
 * Quick add (`M02-01`). A number that already belongs to a customer or a contact is refused with
 * the sheet's facts unless `keepBoth` names that same customer; the server checks again under a
 * lock, so the second of two same-moment saves meets the sheet with its typing kept (`M02-66`).
 */
export const createLeadSchema = z
  .object({
    ...typedCaptureShape,
    referredBy: referredBySchema.optional(),
    keepBoth: keepBothSchema.optional(),
  })
  .strict();
export type CreateLead = z.infer<typeof createLeadSchema>;

/**
 * Log enquiry on existing (`M02-11`): what was typed lands on the existing lead's timeline and its
 * owner is told; nothing about its stage, owner or assignment changes.
 */
export const logEnquirySchema = z.object(typedCaptureShape).strict();
export type LogEnquiry = z.infer<typeof logEnquirySchema>;

/**
 * An enquiry logged on a lead outside the reader's scope (`M02-08`): which lead, and when — no more
 * than the dedupe sheet already showed of it.
 */
export const enquiryLoggedSchema = z.object({
  leadId: uuidSchema,
  loggedAt: z.string().datetime(),
});
export type EnquiryLogged = z.infer<typeof enquiryLoggedSchema>;

/**
 * Open existing on a lead outside the person's scope (`M02-08`, `M02-66`): the enquiry is logged
 * naming the asker, and the lead's owner — or the EPC Owner when it has none — is told.
 */
export const ownerRequestSchema = logEnquirySchema;
export type OwnerRequest = LogEnquiry;

/** The asked owner by name, `null` when the lead has none and the EPC Owner was told. */
export const ownerRequestSentSchema = z.object({
  leadId: uuidSchema,
  ownerName: z.string().nullable(),
  requestedAt: z.string().datetime(),
});
export type OwnerRequestSent = z.infer<typeof ownerRequestSentSchema>;

/** The capture's own refusal: the number belongs to a customer or a contact already (`M02-07`). */
export const captureErrorCodes = ['DUPLICATE_PHONE'] as const;
export const captureErrorCodeSchema = z.enum(captureErrorCodes);

const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const leadCaptureContract = c.router({
  match: {
    method: 'GET',
    path: '/customers/match',
    query: customerMatchQuerySchema,
    summary:
      'The live duplicate check: the customer or contact the number already belongs to — only owner, stage and last contact when it is outside the reader’s scope',
    responses: { 200: customerMatchSchema, 401: unauthenticatedEnvelope },
  },
  create: {
    method: 'POST',
    path: '/leads',
    headers: createHeadersSchema,
    body: createLeadSchema,
    summary:
      'Quick add a lead from a phone number alone — refused with the dedupe sheet’s facts when the number is someone’s already, unless kept both with a reason',
    responses: {
      201: leadDetailSchema,
      401: unauthenticatedEnvelope,
      /** The referring customer, or the customer kept beside, is not one the reader may see. */
      404: notFound,
      /** The number belongs to a customer or contact; `facts` is what the sheet shows. */
      409: errorEnvelopeWithFacts(captureErrorCodeSchema, dedupeMatchSchema),
      /** The retry key made a lead for another request. */
      422: keyReusedEnvelope,
    },
  },
  logEnquiry: {
    method: 'POST',
    path: '/leads/:id/enquiries',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: logEnquirySchema,
    summary:
      'Log an enquiry on an existing lead with what was typed, and tell its owner — its stage, owner and assignment stay',
    responses: {
      /** The lead as it stands — or, for a lead outside the reader's scope, which and when only. */
      201: z.union([leadDetailSchema, enquiryLoggedSchema]),
      401: unauthenticatedEnvelope,
      404: notFound,
      422: keyReusedEnvelope,
    },
  },
  askOwner: {
    method: 'POST',
    path: '/leads/:id/owner-requests',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: ownerRequestSchema,
    summary:
      'Open existing on a lead outside the reader’s scope: the enquiry is logged naming the asker and its owner is told in the app',
    responses: {
      201: ownerRequestSentSchema,
      401: unauthenticatedEnvelope,
      /** No such lead in this company. */
      404: notFound,
      422: keyReusedEnvelope,
    },
  },
});
