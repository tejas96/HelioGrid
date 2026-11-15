import { DEVICE_CLASSES, LINK_SECTIONS } from '@heliogrid/domain';
import { z } from 'zod';
import {
  amountSchema,
  currencyCodeSchema,
  extensibleEnum,
  paginated,
  paginationQuerySchema,
  queryFlagSchema,
  uuidSchema,
} from '../common';
import { memberRefSchema, taskSchema } from '../crm/schemas';
import { leadLifecycleStateSchema, leadStageSchema } from '../crm/vocabulary';
import { trancheTemplateSchema } from '../document-templates';
import { generateVerdictSchema } from './checklist';
import { proposalDocumentSchema } from './document';
import {
  proposalAnswerReadSchema,
  proposalListFilterSchema,
  proposalStandingReadSchema,
  proposalStatusReadSchema,
  proposalStepSchema,
  stepStandingSchema,
  systemTypeSchema,
  versionFactSchema,
  versionTriggerSchema,
} from './vocabulary';

/*
 * A proposal as its screens read it (`SCR-M06-02`…`SCR-M06-19`): ONE read feeds the builder, the
 * check, the track screen and the document, so no two of them can show different facts.
 */

/** What the reader may do here; a screen hides every act they may not (`F2.M06.*`, `F2.M01.*`). */
export const proposalRightsSchema = z.object({
  /** `F2.M06.create-edit-proposals` on a lead the reader reaches. */
  edit: z.boolean(),
  /** `F2.M06.send-proposals`. */
  share: z.boolean(),
  /** `F2.M01.manage-catalog`: our cost and the margin are theirs to see (`M06-37`). */
  seesCost: z.boolean(),
  /** `F2.M01.manage-tenant-settings`: bank details, track record and terms save to the company. */
  writesCompanyFacts: z.boolean(),
  /** `F2.M01.add-own-catalog-items` or manage-catalog: *Add a new part* is offered (`M06-28`). */
  addsParts: z.boolean(),
  /** `F2.M01.manage-catalog` held outright: the spreadsheet path, editing and archiving a saved part. */
  managesParts: z.boolean(),
  mintsLinks: z.boolean(),
  revokesLinks: z.boolean(),
  /** May see and change the plan — *See plans* at the limit (`T-M06-028`). */
  managesBilling: z.boolean(),
});
export type ProposalRights = z.infer<typeof proposalRightsSchema>;

/** One generated version as a list names it (`M06-42`). */
const proposalVersionSummaryObject = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string().datetime(),
  generatedBy: memberRefSchema.nullable(),
  trigger: extensibleEnum(versionTriggerSchema.options),
  /** What changed and why, in the person's words; `null` on the first version. */
  changeNote: z.string().nullable(),
  payable: amountSchema,
  sharedAt: z.string().datetime().nullable(),
  /** The customer's one answer on this version (`M06-45`). */
  answer: proposalAnswerReadSchema.nullable(),
  answeredAt: z.string().datetime().nullable(),
  /** The version the customer's link serves. */
  onLink: z.boolean(),
  /** The version the project runs on, after Won (`M08-50`). */
  inForce: z.boolean(),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface ProposalVersionSummarySchema extends ProposalVersionSummarySchemaObject {}
type ProposalVersionSummarySchemaObject = typeof proposalVersionSummaryObject;
export const proposalVersionSummarySchema: ProposalVersionSummarySchema =
  proposalVersionSummaryObject;
export type ProposalVersionSummary = z.infer<typeof proposalVersionSummarySchema>;

/**
 * What happened after Generate (`M06-54`): the product's own evidence — shared, opened, read for
 * how long — and never a delivery it did not see (`F5-28`).
 */
export const proposalTrackingSchema = z.object({
  generatedAt: z.string().datetime().nullable(),
  sharedAt: z.string().datetime().nullable(),
  sharedBy: memberRefSchema.nullable(),
  /** Opens of the served version since it was shared. */
  firstOpenedAt: z.string().datetime().nullable(),
  lastOpenedAt: z.string().datetime().nullable(),
  deviceClass: extensibleEnum(DEVICE_CLASSES).nullable(),
  viewedSeconds: z.number().int().nonnegative().nullable(),
  longestSection: extensibleEnum(LINK_SECTIONS).nullable(),
  answer: proposalAnswerReadSchema.nullable(),
  answeredAt: z.string().datetime().nullable(),
  /** The customer's own words on a change request, shown as written. */
  answerWords: z.string().nullable(),
  /** Which named link answered, and whose it is — what the confirming call checks (`F5-46`). */
  answeredVia: z.object({ label: z.string(), contactName: z.string().nullable() }).nullable(),
});
export type ProposalTracking = z.infer<typeof proposalTrackingSchema>;

/** A company fact a document would print and the company has not given (`M06-17`). */
export const MISSING_COMPANY_FACTS = [
  'bank_details',
  'logo',
  'tax_registration',
  'address',
] as const;
export type MissingCompanyFact = (typeof MISSING_COMPANY_FACTS)[number];

const detailShape = {
  id: uuidSchema,
  status: proposalStatusReadSchema,
  standing: proposalStandingReadSchema,
  /** The entry toggle (`M06-19`): the builder presents steps 1, 3, 8 and 10 while it is on. */
  quickMode: z.boolean(),
  /** What every commit carries back: a stale one is refused (`M06-25`). */
  revision: z.number().int().nonnegative(),
  /** When the proposal was started — the withdraw sheet's "Made by … · 11 Nov". */
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lead: z.object({
    id: uuidSchema,
    customerId: uuidSchema,
    stage: leadStageSchema,
    state: leadLifecycleStateSchema.nullable(),
    owner: memberRefSchema.nullable(),
    city: z.string().nullable(),
    /**
     * The customer's number as the lead holds it, for step 10's locked client card (`T-M06-012`).
     * A plain string, never the strict E.164 shape: a number the pack's format refuses is still
     * shown, and the checklist names it (`M06-57`).
     */
    customerPhoneE164: z.string().nullable(),
    /**
     * False when the customer is do-not-call or a wrong number: Track offers no dial then
     * (`M02-44`). Absent on an api built before Track's *Call* dialled, which reads as false.
     */
    canDial: z.boolean().optional(),
  }),
  /** The document as it stands now — the draft's live assembly, our cost included where allowed. */
  document: proposalDocumentSchema,
  steps: z.array(z.object({ step: proposalStepSchema, standing: stepStandingSchema })),
  /** "Proposal draft — n/11": hidden Quick steps count once their default is in place (`M06-25`). */
  progress: z.object({ complete: z.number().int().nonnegative(), of: z.number().int().positive() }),
  checklist: generateVerdictSchema,
  rights: proposalRightsSchema,
  /** Who can add a missing company fact — the EPC Owner — for the line a rep reads (`M06-17`). */
  companyFactsBy: z.object({ name: z.string() }).nullable(),
  missingCompanyFacts: z.array(extensibleEnum(MISSING_COMPANY_FACTS)),
  /**
   * The company's own cover photo from Proposal defaults, with a short-lived address, so step 1
   * offers it beside the platform's pictures whatever this proposal holds now (`M06-07`); `null`
   * where the company keeps none.
   */
  companyCover: z.object({ fileId: uuidSchema, url: z.string() }).nullable(),
  /** The company's named payment plans step 7 offers as chips (`M01-54`), archived ones left out. */
  paymentPlans: z.array(trancheTemplateSchema),
  /** The language the company's terms exist in, when it is not the customer's (`T-M06-027`). */
  termsPrintIn: z.string().nullable(),
  versions: z.array(proposalVersionSummarySchema),
  tracking: proposalTrackingSchema,
  /** The open proposal task on the lead (`M06-55`): the follow-up, Confirm won, or the decline call. */
  followUp: taskSchema.nullable(),
  links: z.object({ count: z.number().int().nonnegative(), labels: z.array(z.string()) }),
  /** The project the deal became, after Mark won. */
  project: z.object({ id: uuidSchema, number: z.string() }).nullable(),
  /** Sharing is refused while this names a reason (`F8-17`, `F8-18`): the screen states it. */
  shareBlockedBy: z.string().nullable(),
};

/** Named, so the many routes answering a proposal reference it rather than each spelling its type. */
export interface ProposalDetailSchema extends z.ZodObject<typeof detailShape> {}
export const proposalDetailSchema: ProposalDetailSchema = z.object(detailShape);
export type ProposalDetail = z.infer<typeof proposalDetailSchema>;

/** The newest thing that happened to a proposal — the list row's one line (`M06-48`). */
const LATEST_EVENTS = [
  'drafted',
  'generated',
  'shared',
  'opened',
  'change_asked',
  'accepted',
  'declined',
  'won',
  'replaced',
  'withdrawn',
] as const;

/** One proposal as the list shows it (`SCR-M06-19`). */
export const proposalRowSchema = z.object({
  id: uuidSchema,
  leadId: uuidSchema,
  customerName: z.string().nullable(),
  city: z.string().nullable(),
  /** `null` while it is a draft never generated. */
  number: z.string().nullable(),
  version: z.number().int().positive().nullable(),
  capacityKw: z.number().positive().nullable(),
  systemType: systemTypeSchema,
  /** The payable as last computed; `null` until a price is typed. */
  payable: amountSchema.nullable(),
  standing: proposalStandingReadSchema,
  progress: z.object({ complete: z.number().int().nonnegative(), of: z.number().int().positive() }),
  latest: z.object({
    event: extensibleEnum(LATEST_EVENTS),
    at: z.string().datetime(),
    viewedSeconds: z.number().int().nonnegative().nullable(),
  }),
  /** Not current: the row says so with its corrective act, never by colour alone (`F8-18`). */
  stale: z.boolean(),
  createdBy: memberRefSchema.nullable(),
});
export type ProposalRow = z.infer<typeof proposalRowSchema>;

export const proposalListQuerySchema = paginationQuerySchema.extend({
  filter: proposalListFilterSchema.default('all'),
  /** The reader's own proposals alone — what *Same as {customer}* offers at the start (`M06-48`). */
  mine: queryFlagSchema.optional(),
});

/** The proposals the reader may see — as their leads are (`F2.M02.lead-visibility`). */
const proposalListObject = z.object({
  currencyCode: currencyCodeSchema,
  rows: paginated(proposalRowSchema),
  /** How many each filter chip holds, whatever filter is on. */
  counts: z.object({
    all: z.number().int().nonnegative(),
    waiting: z.number().int().nonnegative(),
    draft: z.number().int().nonnegative(),
    accepted: z.number().int().nonnegative(),
    closed: z.number().int().nonnegative(),
  }),
  /** What the waiting proposals are worth together — a pipeline figure, never revenue (`M13-03`). */
  waitingValue: amountSchema,
  /** *New proposal* is offered only to who can save the lead it starts with (`T-M06-032`). */
  canStart: z.boolean(),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface ProposalListSchema extends ProposalListSchemaObject {}
type ProposalListSchemaObject = typeof proposalListObject;
export const proposalListSchema: ProposalListSchema = proposalListObject;
export type ProposalList = z.infer<typeof proposalListSchema>;

/** One fact that moved between two versions (`M06-42`), old value → new value. */
const versionFactValueSchema = z.object({
  kind: z.enum(['money', 'power', 'energy', 'word', 'text', 'content', 'absent']),
  amount: amountSchema.optional(),
  kw: z.number().optional(),
  kwh: z.number().optional(),
  word: z.string().optional(),
  text: z.string().optional(),
});

export const versionDiffSchema = z.object({
  changes: z.array(
    z.object({ fact: versionFactSchema, from: versionFactValueSchema, to: versionFactValueSchema }),
  ),
  /** Pages the newer version prints whose facts all stayed as they were. */
  pagesUnchanged: z.number().int().nonnegative(),
});

/** One version, frozen (`M06-42`, `M06-43`): its document and what moved since the one before. */
const proposalVersionObject = proposalVersionSummarySchema.extend({
  proposalId: uuidSchema,
  document: proposalDocumentSchema,
  /** Against the version before; `null` on the first. */
  diff: versionDiffSchema.nullable(),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface ProposalVersionSchema extends ProposalVersionSchemaObject {}
type ProposalVersionSchemaObject = typeof proposalVersionObject;
export const proposalVersionSchema: ProposalVersionSchema = proposalVersionObject;
export type ProposalVersion = z.infer<typeof proposalVersionSchema>;
