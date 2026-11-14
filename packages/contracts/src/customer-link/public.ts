import { LINK_TEXT_LIMIT, PROPOSAL_ACT_REFUSALS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extensibleEnum, uuidSchema } from '../common';
import { baseError, errorEnvelope, errorEnvelopeWithFacts } from '../error';
import { fileDownloadSchema } from '../file';
import { proposalDocumentSchema } from '../proposals/document';
import { customerPageSchema } from './pages';
import { deviceClassSchema, linkSectionSchema } from './vocabulary';

const c = initContract();

/*
 * The customer's side of the link (`F5`): public — the token is the customer's whole authority
 * (`F5-21`), so no route here declares a 401 and none takes a session. No path or query carries a
 * name, a number or a company (`F5-77`). An unknown token is a plain 404; a link that is known and
 * cannot serve answers its honest page (`F5-25`); the ceiling across all links answers 429.
 */

/** The secret in the address: 32 random bytes, base64url. The store holds its hash, never the value. */
export const linkTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const tokenParamsSchema = z.object({ token: linkTokenSchema });

const notFound = errorEnvelope(baseError('NOT_FOUND'));
const rateLimited = errorEnvelope(baseError('RATE_LIMITED'));

/**
 * An answer the server did not record (`F5-47`): the version is no longer the one the link serves,
 * it already took its answer, the deal is won or closed, or the link's hourly ceiling is met.
 * Nothing partial is written.
 */
export const LINK_ACT_NOT_TAKEN = 'LINK_ACT_NOT_TAKEN' as const;
const LINK_REFUSALS = [...PROPOSAL_ACT_REFUSALS, 'link_off', 'ceiling_met'] as const;
const notTaken = errorEnvelopeWithFacts(
  z.literal(LINK_ACT_NOT_TAKEN),
  /** The page is read again after a refusal: it then shows the earlier answer or the newer version. */
  z.object({ refusal: extensibleEnum(LINK_REFUSALS) }),
);

const words = z.string().trim().min(1).max(LINK_TEXT_LIMIT);

/**
 * The version the customer was reading when they answered, by its id — re-checked by the server
 * (`F5-47`). Its number alone would name a newer proposal's version 1 on the same lead.
 */
const answerSchema = z.object({ versionId: uuidSchema });

export const acceptSchema = answerSchema.strict();
export const negotiateSchema = answerSchema.extend({ words }).strict();
export const declineSchema = answerSchema.extend({ reason: words.nullable() }).strict();
export const questionSchema = z.object({ text: words }).strict();
/** A call asked for (`F5-54`): the time the customer named, or `null` for the next lawful moment. */
export const callRequestSchema = z.object({ at: z.string().datetime().nullable() }).strict();

const pageAnswers = { 200: customerPageSchema, 404: notFound, 422: notTaken, 429: rateLimited };

export const customerLinkPublicContract = c.router({
  page: {
    method: 'GET',
    path: '/customer-link/:token',
    pathParams: tokenParamsSchema,
    summary:
      'The customer’s page for this link: the proposal, the progress, the solar file, or why the link cannot serve — public',
    responses: { 200: customerPageSchema, 404: notFound, 429: rateLimited },
  },
  opened: {
    method: 'POST',
    path: '/customer-link/:token/opened',
    pathParams: tokenParamsSchema,
    body: z.object({ deviceClass: deviceClassSchema }).strict(),
    summary:
      'The page drew for a person: one open, with the device class and nothing else (`F5-29`) — never sent by a link preview',
    responses: { 204: c.noBody(), 404: notFound, 429: rateLimited },
  },
  sectionViewed: {
    method: 'POST',
    path: '/customer-link/:token/viewed',
    pathParams: tokenParamsSchema,
    body: z
      .object({ section: linkSectionSchema, seconds: z.number().int().positive().max(3600) })
      .strict(),
    summary: 'How long a section was on screen — the product’s own evidence of a read',
    responses: { 204: c.noBody(), 404: notFound, 429: rateLimited },
  },
  accept: {
    method: 'POST',
    path: '/customer-link/:token/accept',
    pathParams: tokenParamsSchema,
    body: acceptSchema,
    summary:
      'Accept the version on the page — the only way an acceptance is ever recorded (`F5-43`); a person still confirms the win',
    responses: pageAnswers,
  },
  negotiate: {
    method: 'POST',
    path: '/customer-link/:token/negotiate',
    pathParams: tokenParamsSchema,
    body: negotiateSchema,
    summary: 'Ask for a change, in the customer’s words — a new version appears at this address',
    responses: pageAnswers,
  },
  decline: {
    method: 'POST',
    path: '/customer-link/:token/decline',
    pathParams: tokenParamsSchema,
    body: declineSchema,
    summary:
      'Decline the proposal — the company is told; nobody marks the deal lost for the customer',
    responses: pageAnswers,
  },
  question: {
    method: 'POST',
    path: '/customer-link/:token/questions',
    pathParams: tokenParamsSchema,
    body: questionSchema,
    summary: 'Ask a question in any phase — received, never answered here: the reply is a call',
    responses: pageAnswers,
  },
  callRequest: {
    method: 'POST',
    path: '/customer-link/:token/call-requests',
    pathParams: tokenParamsSchema,
    body: callRequestSchema,
    summary: 'Ask for a call — the customer’s own timestamped consent to be called (`F5-54`)',
    responses: pageAnswers,
  },
  file: {
    method: 'GET',
    path: '/customer-link/:token/files/:fileId',
    pathParams: tokenParamsSchema.extend({ fileId: uuidSchema }),
    summary:
      'A short-lived link to a file the page lists — a receipt, a handover document — checked against the link’s phase',
    responses: { 200: fileDownloadSchema, 404: notFound, 429: rateLimited },
  },
  pdf: {
    method: 'GET',
    path: '/customer-link/:token/pdf',
    pathParams: tokenParamsSchema,
    summary: 'The PDF of the version the page shows; null while it is made',
    responses: {
      200: z.object({ download: fileDownloadSchema.nullable() }),
      404: notFound,
      429: rateLimited,
    },
  },
  print: {
    method: 'GET',
    path: '/proposal-print/:versionId',
    pathParams: z.object({ versionId: uuidSchema }),
    query: z.object({ grant: z.string().min(16).max(200) }),
    summary:
      'A frozen version for the document renderer alone, behind a short-lived signed grant — exactly what the pages draw',
    responses: { 200: z.object({ document: proposalDocumentSchema }), 404: notFound },
  },
});
