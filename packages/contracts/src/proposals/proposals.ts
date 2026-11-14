import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, extensibleEnum } from '../common';
import { leadParamsSchema } from '../crm/leads';
import { capturedAtSchema } from '../crm/schemas';
import {
  baseError,
  errorEnvelope,
  IDEMPOTENCY_KEY_REUSED,
  unauthenticatedEnvelope,
} from '../error';
import { fileDownloadSchema } from '../file';
import {
  editProposalSchema,
  fillEnergySchema,
  generatedProposalSchema,
  generateProposalSchema,
  proposalActRefusedEnvelope,
  proposalConflictEnvelope,
  proposalNotReadyEnvelope,
  proposalParamsSchema,
  proposalVersionParamsSchema,
  resetStepSchema,
  shareableMessageSchema,
  sharedProposalSchema,
  shareProposalSchema,
  startProposalSchema,
} from './acts';
import {
  proposalDetailSchema,
  proposalListQuerySchema,
  proposalListSchema,
  proposalVersionSchema,
  proposalVersionSummarySchema,
} from './detail';

const c = initContract();

/*
 * Proposals (`M06`): the one commercial document on a lead. A draft is edited step by step and
 * saved as it is typed; Generate checks everything once and freezes a version; sharing is a
 * person's tap that mints the customer's link. Every figure is the server's (`F4-04`).
 */

const notFound = errorEnvelope(baseError('NOT_FOUND'));

const detailAnswers = {
  200: proposalDetailSchema,
  401: unauthenticatedEnvelope,
  404: notFound,
  409: proposalConflictEnvelope,
  422: z.union([proposalActRefusedEnvelope, errorEnvelope(baseError('DOMAIN_RULE_VIOLATION'))]),
} as const;

export const proposalsContract = c.router({
  list: {
    method: 'GET',
    path: '/proposals',
    query: proposalListQuerySchema,
    summary:
      'The proposals of the leads the reader may see, by where each stands, with every chip’s count',
    responses: { 200: proposalListSchema, 401: unauthenticatedEnvelope },
  },
  start: {
    method: 'POST',
    path: '/leads/:id/proposals',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: startProposalSchema,
    summary:
      'Start a proposal on the lead, or open its draft again — a lead holds one open draft, and a closed lead none',
    responses: {
      /** The lead's open draft, resumed: nothing was made. */
      200: proposalDetailSchema,
      201: proposalDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: z.union([
        proposalActRefusedEnvelope,
        errorEnvelope(extensibleEnum([IDEMPOTENCY_KEY_REUSED])),
      ]),
    },
  },
  detail: {
    method: 'GET',
    path: '/proposals/:id',
    pathParams: proposalParamsSchema,
    summary:
      'One proposal: its steps, the server’s figures, the checklist, what happened since it was shared, and what the reader may do',
    responses: { 200: proposalDetailSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  edit: {
    method: 'PATCH',
    path: '/proposals/:id',
    pathParams: proposalParamsSchema,
    body: editProposalSchema,
    summary:
      'Save the steps sent on the revision they were typed on — a stale one is refused, never merged',
    responses: detailAnswers,
  },
  fillEnergy: {
    method: 'POST',
    path: '/proposals/:id/energy',
    pathParams: proposalParamsSchema,
    body: fillEnergySchema,
    summary:
      'Fill the generation from the market’s source of record, or the built-in estimate when it does not answer',
    responses: detailAnswers,
  },
  resetStep: {
    method: 'POST',
    path: '/proposals/:id/reset',
    pathParams: proposalParamsSchema,
    body: resetStepSchema,
    summary: 'Put the timeline or the payment plan back to the company’s template in force',
    responses: detailAnswers,
  },
  discard: {
    method: 'POST',
    path: '/proposals/:id/discard',
    pathParams: proposalParamsSchema,
    body: z.object({ capturedAt: capturedAtSchema }).strict(),
    summary: 'Discard a draft that was never generated — a generated proposal is withdrawn instead',
    responses: {
      204: c.noBody(),
      401: unauthenticatedEnvelope,
      404: notFound,
      422: proposalActRefusedEnvelope,
    },
  },
  generate: {
    method: 'POST',
    path: '/proposals/:id/generate',
    pathParams: proposalParamsSchema,
    headers: createHeadersSchema,
    body: generateProposalSchema,
    summary:
      'Run the one checklist and freeze a version — the first takes the proposal’s number; a retry returns the same version',
    responses: {
      201: generatedProposalSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      409: proposalConflictEnvelope,
      422: z.union([
        proposalNotReadyEnvelope,
        proposalActRefusedEnvelope,
        errorEnvelope(extensibleEnum([IDEMPOTENCY_KEY_REUSED])),
      ]),
    },
  },
  versions: {
    method: 'GET',
    path: '/proposals/:id/versions',
    pathParams: proposalParamsSchema,
    summary: 'Every version of the proposal, newest first, each as it was generated',
    responses: {
      200: z.object({ versions: z.array(proposalVersionSummarySchema) }),
      401: unauthenticatedEnvelope,
      404: notFound,
    },
  },
  version: {
    method: 'GET',
    path: '/proposals/:id/versions/:version',
    pathParams: proposalVersionParamsSchema,
    summary: 'One version, frozen — its document and what moved since the version before',
    responses: { 200: proposalVersionSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  versionPdf: {
    method: 'GET',
    path: '/proposals/:id/versions/:version/pdf',
    pathParams: proposalVersionParamsSchema,
    summary:
      'A version’s PDF: made on first ask, then kept; null while it is made — reading it never pauses for billing',
    responses: {
      200: z.object({ download: fileDownloadSchema.nullable() }),
      401: unauthenticatedEnvelope,
      404: notFound,
    },
  },
  shareMessage: {
    method: 'GET',
    path: '/proposals/:id/share-message',
    pathParams: proposalParamsSchema,
    summary: 'The words the share sheet shows before the tap, in the customer’s language',
    responses: { 200: shareableMessageSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  share: {
    method: 'POST',
    path: '/proposals/:id/share',
    pathParams: proposalParamsSchema,
    body: shareProposalSchema,
    summary:
      'Mark the latest version shared — the first share mints the customer’s link, a later one reuses it; a tap, never a delivery',
    responses: {
      200: sharedProposalSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: proposalActRefusedEnvelope,
    },
  },
  withdraw: {
    method: 'POST',
    path: '/proposals/:id/withdraw',
    pathParams: proposalParamsSchema,
    body: z.object({ capturedAt: capturedAtSchema }).strict(),
    summary:
      'Withdraw the proposal — its link then says it is no longer active, with a person to call',
    responses: {
      200: proposalDetailSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: proposalActRefusedEnvelope,
    },
  },
  acceptanceMessage: {
    method: 'GET',
    path: '/proposals/:id/acceptance-message',
    pathParams: proposalParamsSchema,
    summary:
      'The thank-you a person sends after an Accept — the customer’s page already shows the acceptance',
    responses: {
      200: shareableMessageSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: proposalActRefusedEnvelope,
    },
  },
});
