import {
  BLOCKER_PARTIES,
  BLOCKER_REASONS,
  LINK_FAILURE_REASONS,
  LINK_PHASES,
  QUESTION_STATES,
  TRANCHE_STATES,
} from '@heliogrid/domain';
import { z } from 'zod';
import { payToSchema } from '../collections-settings';
import {
  currencyCodeSchema,
  extensibleEnum,
  nonNegativeAmountSchema,
  phoneE164Schema,
  uuidSchema,
} from '../common';
import { compliantShadesSchema, hexColourSchema } from '../document-templates';
import { uiLanguageResponseSchema } from '../locale';
import { installationFactsSchema } from '../projects/proposal-handoff';
import { projectStageReadSchema } from '../projects/schemas';
import { proposalDocumentSchema } from '../proposals/document';
import { proposalAnswerReadSchema, systemTypeSchema } from '../proposals/vocabulary';
import { calendarDateSchema } from '../tenant-settings';

/*
 * The customer's one page (`F5-19`): the proposal, then the progress, then the solar file, at one
 * address — or the honest page of a link that cannot serve (`F5-25`). One read answers whichever
 * the deal's state calls for; the page holds no state machine of its own. It carries no other
 * link's label, contact or history (`F5-30`), and nothing the company did not publish (`F5-38`).
 */

const PAGE_KINDS = [...LINK_PHASES, 'off'] as const;

/** The company as the customer's page dresses itself (`F5-81`): presentation, never a figure. */
export const linkCompanySchema = z.object({
  name: z.string(),
  logoUrl: z.string().url().nullable(),
  brandColour: hexColourSchema.nullable(),
  shades: compliantShadesSchema.nullable(),
});

/** The person to call, in every phase and on every failure (`F5-55`, `F5-73`). */
export const namedPersonSchema = z.object({ name: z.string(), phoneE164: phoneE164Schema });
export type NamedPerson = z.infer<typeof namedPersonSchema>;

/** A question the link received (`F5-53`): acknowledged, never answered here — the reply is a call. */
export const linkQuestionSchema = z.object({
  id: uuidSchema,
  text: z.string(),
  askedAt: z.string().datetime(),
  state: extensibleEnum(QUESTION_STATES),
});

/** The proposal phase (`F5-32`): the latest shared version, and what the customer answered on it. */
export const linkProposalSchema = z.object({
  /** The customer's view of the one value set: never our cost, never the margin. */
  document: proposalDocumentSchema,
  /** The served version's id: what an answer names, so it never lands on a newer one (`F5-47`). */
  versionId: uuidSchema,
  /** The customer may still answer this version (scopes ∩ phase, one answer per version). */
  mayRespond: z.boolean(),
  answer: z
    .object({
      kind: proposalAnswerReadSchema,
      at: z.string().datetime(),
      /** The customer's own words on a change request, as written. */
      words: z.string().nullable(),
    })
    .nullable(),
  /** The first payment the plan asks for, once the company confirms; `null` where the plan has none. */
  advance: nonNegativeAmountSchema.nullable(),
  /** The call the customer asked for, and when it will come (`F5-54`). */
  callRequest: z
    .object({ requestedAt: z.string().datetime(), dueAt: z.string().datetime() })
    .nullable(),
});

const STAGE_STATES = ['done', 'current', 'waiting', 'ahead'] as const;

/** One part of the payment plan as the customer reads it (`F5-57`, `F5-59`). */
const linkPaymentPartSchema = z.object({
  label: z.string(),
  amount: nonNegativeAmountSchema,
  state: extensibleEnum(TRANCHE_STATES),
  received: nonNegativeAmountSchema,
  outstanding: nonNegativeAmountSchema,
  /** Receipts the company recorded — never shown as confirmed by a bank (`F5-59`). */
  receipts: z.array(
    z.object({
      number: z.string(),
      amount: nonNegativeAmountSchema,
      receivedOn: calendarDateSchema.nullable(),
      /** The company day the payment was taken back; its receipt then reads reversed (`M11-46`). */
      reversedOn: calendarDateSchema.nullable(),
      /** The receipt as text, there at once; its PDF follows as a file (`M11-45`). */
      text: z.string(),
      fileId: uuidSchema.nullable(),
    }),
  ),
});

/** The progress phase (`F5-61`): stages with their dates, the open wait, the day, the money. */
export const linkProgressSchema = z.object({
  capacityKw: z.number().positive().nullable(),
  systemType: systemTypeSchema.nullable(),
  /** The project was cancelled after Won: the page says so honestly (`F5` §F5.3). */
  cancelledOn: calendarDateSchema.nullable(),
  /** The market's chain with its own labels; a stage the market skips is absent (`F5-62`). */
  stages: z.array(
    z.object({
      stage: projectStageReadSchema,
      label: z.string(),
      state: extensibleEnum(STAGE_STATES),
      on: calendarDateSchema.nullable(),
    }),
  ),
  /** The open wait as published (`F5-63`, `F5-64`): never the internal note. */
  wait: z
    .object({
      party: extensibleEnum(BLOCKER_PARTIES),
      reason: extensibleEnum(BLOCKER_REASONS),
      since: calendarDateSchema,
      /** The pack's typical length, where it declares one; never a computed date (`F5-66`). */
      typicalDays: z.number().int().positive().nullable(),
    })
    .nullable(),
  installation: installationFactsSchema,
  payments: z.object({
    currencyCode: currencyCodeSchema,
    parts: z.array(linkPaymentPartSchema),
    /** How to pay the part now due: the company's own UPI and bank, for its exact amount (`F5-58`). */
    due: z
      .object({
        label: z.string(),
        amount: nonNegativeAmountSchema,
        upiUri: z.string().nullable(),
        note: z.string(),
        payTo: payToSchema,
      })
      .nullable(),
  }),
});

/** The solar file (`F5-70`…`F5-73`): the handover pack, for the life of the system. */
export const linkHandoverSchema = z.object({
  switchedOnAt: calendarDateSchema.nullable(),
  /** The company's number the referral ask names (`F5-72`) — a number to pass on, never a credit. */
  referTo: phoneE164Schema.nullable(),
  documents: z.array(
    z.object({
      fileId: uuidSchema,
      /** The checklist row it proves, or `null` for another file the company chose to show. */
      row: z.string().nullable(),
      name: z.string(),
    }),
  ),
});

const pageShape = {
  kind: extensibleEnum(PAGE_KINDS),
  /** The reader's language: the contact's, else the customer's, else the company's (`F5-08`). */
  language: uiLanguageResponseSchema,
  company: linkCompanySchema,
  /** `null` only where the company has no active member left to name. */
  person: namedPersonSchema.nullable(),
  /** Why the link cannot serve — the only fact an `off` page carries beside company and person. */
  off: z.object({ reason: extensibleEnum(LINK_FAILURE_REASONS) }).optional(),
  proposal: linkProposalSchema.optional(),
  progress: linkProgressSchema.optional(),
  handover: linkHandoverSchema.optional(),
  /** Every question this link received, in every phase (`F5-52`). Absent on an `off` page. */
  questions: z.array(linkQuestionSchema).optional(),
  /** The question and call affordances are open (`F5-52`): the page's shared ceiling is not met. */
  mayAsk: z.boolean(),
};

export interface CustomerPageSchema extends z.ZodObject<typeof pageShape> {}
export const customerPageSchema: CustomerPageSchema = z.object(pageShape);
export type CustomerPage = z.infer<typeof customerPageSchema>;
