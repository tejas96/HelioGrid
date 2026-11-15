import { LINK_TEXT_LIMIT } from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum, uuidSchema } from '../common';
import { capturedAtSchema, memberRefSchema, monthlyBillWriteSchema } from '../crm/schemas';
import { dealSegmentSchema } from '../crm/vocabulary';
import { errorEnvelopeWithFacts } from '../error';
import { calendarDateSchema } from '../tenant-settings';
import { generateVerdictSchema } from './checklist';
import { proposalDetailSchema } from './detail';
import { areaRefSchema } from './document';
import { proposalFieldsEditSchema } from './field-set';
import {
  proposalActRefusalSchema,
  proposalStepSchema,
  shareChannelSchema,
  supplyPhaseSchema,
} from './vocabulary';

/*
 * What a proposal's acts carry and answer (`M06`): the start, each commit, Generate, the share and
 * the words a person sends. The routes are `./proposals`.
 */

export const proposalParamsSchema = z.object({ id: uuidSchema });
export const proposalVersionParamsSchema = proposalParamsSchema.extend({
  version: z.coerce.number().int().positive(),
});

/** An act the status machine or the lead's state does not allow, with domain's reason (`M06-45`). */
export const PROPOSAL_ACT_REFUSED = 'PROPOSAL_ACT_REFUSED' as const;
export const proposalActRefusedEnvelope = errorEnvelopeWithFacts(
  z.literal(PROPOSAL_ACT_REFUSED),
  z.object({ refusal: proposalActRefusalSchema }),
);

/**
 * A commit the draft could not take (`M06-25`): another device changed it first, or the lead was
 * given to someone else. The typed value stays on screen; nothing was overwritten.
 */
export const PROPOSAL_CHANGED_ELSEWHERE = 'PROPOSAL_CHANGED_ELSEWHERE' as const;
export const PROPOSAL_LEAD_MOVED = 'PROPOSAL_LEAD_MOVED' as const;
export const proposalConflictEnvelope = errorEnvelopeWithFacts(
  extensibleEnum([PROPOSAL_CHANGED_ELSEWHERE, PROPOSAL_LEAD_MOVED]),
  z.object({
    /** The revision now stored — what a reload reads. */
    revision: z.number().int().nonnegative(),
    /** Who the lead moved to, for *This lead moved to {person}*; `null` otherwise. */
    movedTo: memberRefSchema.nullable(),
  }),
);

/** Generate was stopped by its checklist (`M06-23`): every block, as one list to tap through. */
export const PROPOSAL_NOT_READY = 'PROPOSAL_NOT_READY' as const;
export const proposalNotReadyEnvelope = errorEnvelopeWithFacts(
  z.literal(PROPOSAL_NOT_READY),
  z.object({ verdict: generateVerdictSchema }),
);

/** Where a new draft starts: the mode picked on the entry sheet, or a copy of an earlier proposal. */
export const startProposalSchema = z
  .object({
    quickMode: z.boolean(),
    /** *Same as {customer}* and *Copy for another lead* (`M06-48`): every step arrives filled. */
    copyOf: uuidSchema.nullable(),
    capturedAt: capturedAtSchema,
  })
  .strict();
export type StartProposal = z.infer<typeof startProposalSchema>;

/**
 * The lead's own facts a step writes (`M06-09`, `M06-16`, `T-M06-007`): saved on the lead in the
 * same act, each a timeline entry — step 5's monthly bill is the lead's, carried both ways. The
 * customer's phone is not here — it is the customer's identity.
 */
export const proposalDealEditSchema = z
  .object({
    segment: dealSegmentSchema,
    monthlyBill: monthlyBillWriteSchema.nullable(),
    area: areaRefSchema.nullable(),
    siteAddress: z.string().trim().min(1).max(500).nullable(),
    sanctionedLoadKw: z.number().positive().max(100000).nullable(),
    supplyPhase: supplyPhaseSchema.nullable(),
  })
  .partial()
  .strict();

/** One commit (`M06-25`): the steps changed, the lead facts typed, and the revision it was made on. */
const editProposalObject = z
  .object({
    revision: z.number().int().nonnegative(),
    fields: proposalFieldsEditSchema.optional(),
    deal: proposalDealEditSchema.optional(),
    /** The Quick switch; the hidden steps keep their values either way (`M06-19`). */
    quickMode: z.boolean().optional(),
    capturedAt: capturedAtSchema,
  })
  .strict();
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface EditProposalSchema extends EditProposalSchemaObject {}
type EditProposalSchemaObject = typeof editProposalObject;
export const editProposalSchema: EditProposalSchema = editProposalObject;
export type EditProposal = z.infer<typeof editProposalSchema>;

const stepActSchema = z.object({
  revision: z.number().int().nonnegative(),
  capturedAt: capturedAtSchema,
});

/** Fill the generation from the source of record, or put the filled values back after an edit. */
export const fillEnergySchema = stepActSchema.extend({ mode: z.enum(['fill', 'reset']) }).strict();

/** *Reset*: the step takes the company's template in force again (`M06-12`, `M06-13`). */
export const resetStepSchema = stepActSchema
  .extend({ step: proposalStepSchema.extract(['timeline', 'payment']) })
  .strict();

export const generateProposalSchema = stepActSchema
  .extend({
    /** What changed and why — asked from the second version on (`M06-42`). */
    changeNote: z.string().trim().min(1).max(LINK_TEXT_LIMIT).nullable(),
    /** The person read the below-cost warning and goes on (`M06-37`). */
    belowCostConfirmed: z.boolean(),
  })
  .strict();
export type GenerateProposal = z.infer<typeof generateProposalSchema>;

export const generatedProposalSchema = z.object({
  proposal: proposalDetailSchema,
  number: z.string(),
  version: z.number().int().positive(),
});

/** The tap that marks a proposal shared (`M06-53`): which of the two acts it was. */
export const shareProposalSchema = z
  .object({ channel: shareChannelSchema, capturedAt: capturedAtSchema })
  .strict();

/** Where the customer's link goes in words composed before the link exists (`F5-20`). */
export const SHARE_LINK_SLOT = '{link}' as const;

/**
 * The words a person sends, in the customer's language (`M06-53`, `F5-48`, `F5-68`): composed by the
 * server, sent by the person — nothing here claims a delivery. Before the first share no link
 * exists, so `link` is `null` and the text holds `SHARE_LINK_SLOT` in its place.
 */
export const shareableMessageSchema = z.object({
  language: z.string(),
  text: z.string(),
  link: z.string().url().nullable(),
  /** The message opened in the customer's chat, ready to send; `null` where the market names no chat app. */
  chatUri: z.string().nullable(),
});
export type ComposedMessage = z.infer<typeof shareableMessageSchema>;

export const sharedProposalSchema = z.object({
  proposal: proposalDetailSchema,
  message: shareableMessageSchema,
  /**
   * The follow-up the share raised or moved, on the lead's owner (`M06-55`); `null` when it raised
   * none — a share again of a version the customer already answered chases nobody.
   */
  followUpOn: calendarDateSchema.nullable(),
});
