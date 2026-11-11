import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, nonNegativeAmountSchema, uuidSchema } from '../common';
import { leadParamsSchema } from '../crm/leads';
import { leadTransitionRefusedEnvelope } from '../crm/lifecycle';
import { capturedAtSchema } from '../crm/schemas';
import { errorEnvelopeWithFacts, keyReusedEnvelope, unauthenticatedEnvelope } from '../error';
import { calendarDateSchema } from '../tenant-settings';
import { projectNotFound } from './projects';
import {
  blockerPartySchema,
  blockerReasonSchema,
  cancelReasonSchema,
  projectActRefusalSchema,
  projectDetailSchema,
  projectFileSlotSchema,
  projectParamsSchema,
  projectStageSchema,
  projectTextSchema,
} from './schemas';

const c = initContract();

/*
 * Projects (`M08`) and the act that starts one, *Mark won* (`M07-62`).
 * Every act carries when the person did it (`F4-19`) and answers with the project as it now
 * stands; a move the machine does not allow is refused with domain's reason (`F4-16`).
 */

export const PROJECT_ACT_REFUSED = 'PROJECT_ACT_REFUSED' as const;
export const projectActRefusedEnvelope = errorEnvelopeWithFacts(
  z.literal(PROJECT_ACT_REFUSED),
  z.object({ refusal: projectActRefusalSchema }),
);

const actSchema = z.object({ capturedAt: capturedAtSchema }).strict();
export type ProjectAct = z.infer<typeof actSchema>;
export { actSchema as projectActSchema };

const answers = {
  200: projectDetailSchema,
  401: unauthenticatedEnvelope,
  404: projectNotFound,
  422: projectActRefusedEnvelope,
} as const;

/** A person's forward tap — to the next stage only (`M08-14`). */
export const moveProjectSchema = actSchema.extend({ to: projectStageSchema }).strict();
/**
 * *Dispatched* names its crew; the last crew is the default the screen offers (ruling 2026-11-10).
 * No crew only while the company has no one on the installation team.
 */
export const dispatchProjectSchema = actSchema
  .extend({
    crew: z.array(uuidSchema).max(20),
    /** The day the material left the warehouse: never ahead, never before Material ordered. */
    leftOn: calendarDateSchema,
  })
  .strict();
/** *Move back* from the stage the person saw: a project moved since is refused (ruling 16). */
export const moveBackSchema = actSchema.extend({ from: projectStageSchema }).strict();
/** The one tap *Proof came early* asks for: move to what the proof shows. */
export const confirmProofSchema = actSchema.extend({ to: projectStageSchema }).strict();
/** A wait: who, why, since when (`M08-21`), and the team's own note. */
export const startWaitSchema = actSchema
  .extend({
    party: blockerPartySchema,
    reason: blockerReasonSchema,
    startedOn: calendarDateSchema,
    note: projectTextSchema.nullable(),
  })
  .strict();
/** *Not needed* on a checklist row, with its reason. */
export const documentNotNeededSchema = actSchema
  .extend({ row: z.string().min(1).max(80), reason: projectTextSchema })
  .strict();
/** A row marked *Not needed* by mistake goes back to waiting. */
export const documentReopenSchema = actSchema.extend({ row: z.string().min(1).max(80) }).strict();
/**
 * A stored file put on the project: a row's document (the row is then done), a step's photo, or
 * another file a person names.
 */
export const attachProjectFileSchema = actSchema
  .extend({
    fileId: uuidSchema,
    slot: projectFileSlotSchema,
    slotKey: z.string().min(1).max(80).nullable(),
    name: projectTextSchema,
  })
  .strict();
/** *Show to customer* on an other file (off until switched on). */
export const showFileSchema = actSchema
  .extend({ projectFileId: uuidSchema, shown: z.boolean() })
  .strict();
/** A step ticked by the person, with who did the work where that is someone else (`M08-42`). */
export const tickStepSchema = actSchema
  .extend({ step: z.string().min(1).max(80), doneBy: projectTextSchema.nullable() })
  .strict();
export const untickStepSchema = actSchema.extend({ step: z.string().min(1).max(80) }).strict();
/** What the manager may change: who manages it, the promised date, how the crew gets in. */
export const changeProjectSchema = actSchema
  .extend({
    managerId: uuidSchema.optional(),
    expectedInstallOn: calendarDateSchema.nullable().optional(),
    accessNote: projectTextSchema.nullable().optional(),
  })
  .strict();
/** Cancel (`M08-51`): the reason is mandatory, the state terminal. */
export const cancelProjectSchema = actSchema
  .extend({
    reason: cancelReasonSchema,
    /** The person's words — needed for `something_else`, kept beside any other reason. */
    note: projectTextSchema.nullable(),
  })
  .strict();

/**
 * *Mark won* (`M07-62`): the final value and the expected install date the PRD names, and the
 * project manager (ruling 2026-11-10). The project is created in the same act (`M08-02`).
 */
export const markWonSchema = actSchema
  .extend({
    /** A won deal is worth something: a zero is a slip no later act can mend. */
    finalValue: nonNegativeAmountSchema.refine((amount) => Number(amount) > 0, 'more than zero'),
    expectedInstallOn: calendarDateSchema,
    managerId: uuidSchema,
  })
  .strict();
export type MarkWon = z.infer<typeof markWonSchema>;

export const markWonResultSchema = z.object({ projectId: uuidSchema, number: z.string() });

export const projectActsContract = c.router({
  markWon: {
    method: 'POST',
    path: '/leads/:id/won',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: markWonSchema,
    summary:
      'Mark the lead won — the final value and install date it captures, and its project created in the same act',
    responses: {
      201: markWonResultSchema,
      401: unauthenticatedEnvelope,
      404: projectNotFound,
      422: z.union([leadTransitionRefusedEnvelope, keyReusedEnvelope]),
    },
  },
  move: {
    method: 'POST',
    path: '/projects/:id/move',
    pathParams: projectParamsSchema,
    body: moveProjectSchema,
    summary: 'Move the project to its next stage — the taps no proof can show',
    responses: answers,
  },
  dispatch: {
    method: 'POST',
    path: '/projects/:id/dispatch',
    pathParams: projectParamsSchema,
    body: dispatchProjectSchema,
    summary: 'Move the project to Dispatched with its crew',
    responses: answers,
  },
  moveBack: {
    method: 'POST',
    path: '/projects/:id/move-back',
    pathParams: projectParamsSchema,
    body: moveBackSchema,
    summary: 'Move the project one stage back, recorded with the same weight as a forward move',
    responses: answers,
  },
  undo: {
    method: 'POST',
    path: '/projects/:id/undo',
    pathParams: projectParamsSchema,
    body: actSchema,
    summary: 'Take back your own last move while its undo still shows',
    responses: answers,
  },
  confirmProof: {
    method: 'POST',
    path: '/projects/:id/confirm-proof',
    pathParams: projectParamsSchema,
    body: confirmProofSchema,
    summary: 'Move to what the proof on file shows — the stages passed count as passed',
    responses: answers,
  },
  startWait: {
    method: 'POST',
    path: '/projects/:id/wait',
    pathParams: projectParamsSchema,
    body: startWaitSchema,
    summary: 'Record who the project waits on, why and since when',
    responses: answers,
  },
  endWait: {
    method: 'POST',
    path: '/projects/:id/wait/end',
    pathParams: projectParamsSchema,
    body: actSchema,
    summary: 'The wait is over',
    responses: answers,
  },
  documentNotNeeded: {
    method: 'POST',
    path: '/projects/:id/documents/not-needed',
    pathParams: projectParamsSchema,
    body: documentNotNeededSchema,
    summary: 'Mark a checklist row not needed, with its reason',
    responses: answers,
  },
  documentReopen: {
    method: 'POST',
    path: '/projects/:id/documents/reopen',
    pathParams: projectParamsSchema,
    body: documentReopenSchema,
    summary: 'Put a row marked not needed back to waiting',
    responses: answers,
  },
  attachFile: {
    method: 'POST',
    path: '/projects/:id/files',
    pathParams: projectParamsSchema,
    body: attachProjectFileSchema,
    summary: 'Put a stored file on the project — a row’s document, a step’s photo or another file',
    responses: answers,
  },
  showFile: {
    method: 'POST',
    path: '/projects/:id/files/show',
    pathParams: projectParamsSchema,
    body: showFileSchema,
    summary: 'Switch an other file in or out of the handover pack',
    responses: answers,
  },
  tickStep: {
    method: 'POST',
    path: '/projects/:id/steps/tick',
    pathParams: projectParamsSchema,
    body: tickStepSchema,
    summary: 'Tick an install step — the first and the last move the project by themselves',
    responses: answers,
  },
  untickStep: {
    method: 'POST',
    path: '/projects/:id/steps/untick',
    pathParams: projectParamsSchema,
    body: untickStepSchema,
    summary: 'Take a tick back',
    responses: answers,
  },
  change: {
    method: 'POST',
    path: '/projects/:id/details',
    pathParams: projectParamsSchema,
    body: changeProjectSchema,
    summary: 'Change the manager, the promised install date or the access note',
    responses: answers,
  },
  cancel: {
    method: 'POST',
    path: '/projects/:id/cancel',
    pathParams: projectParamsSchema,
    body: cancelProjectSchema,
    summary: 'Cancel the project with its reason — nothing is deleted',
    responses: answers,
  },
  handover: {
    method: 'POST',
    path: '/projects/:id/handover',
    pathParams: projectParamsSchema,
    body: actSchema,
    summary: 'Hand the project over — only with every checklist row past waiting',
    responses: answers,
  },
});
