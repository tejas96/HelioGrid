import {
  BLOCKER_CLEARS,
  BLOCKER_PARTIES,
  BLOCKER_REASONS,
  CANCEL_REASONS,
  DOCUMENT_STATES,
  PROJECT_ACT_REFUSALS,
  PROJECT_FILE_SLOTS,
  PROJECT_MOVE_CAUSES,
  PROJECT_STAGES,
  TODO_KINDS,
} from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum, phoneE164Schema, uuidSchema } from '../common';
import { leadFileSchema } from '../crm/lead-files';
import { memberRefSchema } from '../crm/schemas';
import { dealSegmentSchema } from '../crm/vocabulary';
import { uiLanguageResponseSchema } from '../locale';
import { calendarDateSchema } from '../tenant-settings';
import { projectMoneyGlanceSchema } from './money';

/*
 * The projects' shared shapes (`M08`). A stage, a party, a reason and a row are the
 * market-neutral keys; what a person reads for each is the market pack's, rendered on the device.
 * A project's money is the payments block's (`./payments`); the card and the detail carry its
 * glance.
 */

export const projectStageSchema = z.enum(PROJECT_STAGES);
export const blockerPartySchema = z.enum(BLOCKER_PARTIES);
export const blockerReasonSchema = z.enum(BLOCKER_REASONS);
export const documentStateSchema = z.enum(DOCUMENT_STATES);
export const projectFileSlotSchema = z.enum(PROJECT_FILE_SLOTS);
export const projectMoveCauseSchema = z.enum(PROJECT_MOVE_CAUSES);
export const blockerClearSchema = z.enum(BLOCKER_CLEARS);
export const todoKindSchema = z.enum(TODO_KINDS);
export const cancelReasonSchema = z.enum(CANCEL_REASONS);

/** A response carries the stage as a set a newer server may grow; a write takes the closed one. */
/** A stage as a response carries it: a newer server's stage reaches an older phone unrefused. */
export const projectStageReadSchema = extensibleEnum(PROJECT_STAGES);
const stageRead = projectStageReadSchema;

/** The words a person types onto a project: a wait's note, a *Not needed* reason, a file's name. */
export const projectTextSchema = z.string().trim().min(1).max(500);

export const projectParamsSchema = z.object({ id: uuidSchema });

/** An open wait as every read shows it (`M08-21`); the internal note travels only on the detail. */
export const projectWaitSchema = z.object({
  party: extensibleEnum(BLOCKER_PARTIES),
  reason: extensibleEnum(BLOCKER_REASONS),
  startedOn: calendarDateSchema,
});
export type ProjectWait = z.infer<typeof projectWaitSchema>;

/**
 * One project as the board lists it (`SCR-M08-01`): who, where, the stage and the company day it
 * entered it — the days figure is counted on the device from the board's `today` — its manager,
 * the promised install date, the ticks, the open wait and what it asks of a person.
 */
export const projectCardSchema = z.object({
  id: uuidSchema,
  /** Server-assigned (`M08-03`), as the company reads it: `PRJ-0042`. */
  number: z.string(),
  name: z.string().nullable(),
  place: z.string().nullable(),
  segment: dealSegmentSchema.nullable(),
  stage: stageRead,
  enteredOn: calendarDateSchema,
  manager: memberRefSchema,
  expectedInstallOn: calendarDateSchema.nullable(),
  steps: z.object({
    ticked: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  wait: projectWaitSchema.nullable(),
  /** The one act it asks of a person now, or null (ruling 2026-11-10). */
  todo: extensibleEnum(TODO_KINDS).nullable(),
  /** The stage its proof on file shows, when that is ahead of it — what *Proof came early* offers. */
  earlyProofTo: stageRead.nullable(),
  /** What that early proof is: a checklist row's key, or an install step's proof key. */
  earlyProofBy: z.string().nullable().optional(),
  /** The company day the install finished — it entered Electrical & metering; null before. */
  installedOn: calendarDateSchema.nullable().optional(),
  /** The first checklist row a stage reached by hand still waits on. */
  missingProofRow: z.string().nullable(),
  /**
   * The project's money at a glance (`M11-53`), for a reader who may see money; absent on an api
   * built before payments, and for the crew (`M11-56`).
   */
  money: projectMoneyGlanceSchema.nullable().optional(),
});
export type ProjectCard = z.infer<typeof projectCardSchema>;

/** A stage on the rail (`M08-10`): how many projects stand in it and the oldest entry day there. */
export const stageCountSchema = z.object({
  stage: stageRead,
  count: z.number().int().nonnegative(),
  oldestEnteredOn: calendarDateSchema.nullable(),
});

/**
 * The board (`SCR-M08-01`): the company's today, each stage's count, and every live project the
 * reader may see — the working set, bounded by the company's active projects, so the device
 * derives *To do* and *Waiting* from the whole of it (`needsYouOf`). Closed projects are a page
 * of their own (`closed`).
 */
export const projectBoardSchema = z.object({
  today: calendarDateSchema,
  stages: z.array(stageCountSchema),
  live: z.array(projectCardSchema),
});
export type ProjectBoard = z.infer<typeof projectBoardSchema>;

/** A file on a project or its lead, as the detail lists it; `id` is its `project_file` (or `lead_file`) row. */
export const projectFileSchema = leadFileSchema.extend({
  addedBy: memberRefSchema.nullable(),
  /** Only an other file can be switched into the handover pack; a document always goes. */
  shownToCustomer: z.boolean(),
});
export type ProjectFile = z.infer<typeof projectFileSchema>;

/** One move on the journey (`M08-14`, `M08-17`): who, what and when — never a % bar. */
export const projectMoveSchema = z.object({
  from: stageRead.nullable(),
  to: stageRead,
  cause: extensibleEnum(PROJECT_MOVE_CAUSES),
  proof: z.string().nullable(),
  movedAt: z.string().datetime(),
  /** The company day the stage began: the day the person gave (Dispatched), else the day recorded. */
  enteredOn: calendarDateSchema,
  movedBy: memberRefSchema.nullable(),
});
export type ProjectMoveEntry = z.infer<typeof projectMoveSchema>;

/** One checklist row (`SCR-M08-03`): its pack key, state, reason, what it proves and its files. */
export const projectDocumentSchema = z.object({
  row: z.string(),
  state: extensibleEnum(DOCUMENT_STATES),
  reason: z.string().nullable(),
  movesTo: stageRead.nullable(),
  /** `payments` or `handover` where the system fills the row instead of a person. */
  madeBy: z.string().nullable(),
  changedAt: z.string().datetime(),
  changedBy: memberRefSchema.nullable(),
  files: z.array(projectFileSchema),
});
export type ProjectDocument = z.infer<typeof projectDocumentSchema>;

/** One install step (`SCR-M08-04`): ticked by whom and when, who did the work, its photos. */
export const projectStepSchema = z.object({
  step: z.string(),
  tickedAt: z.string().datetime().nullable(),
  tickedBy: memberRefSchema.nullable(),
  doneBy: z.string().nullable(),
  files: z.array(projectFileSchema),
});
export type ProjectStep = z.infer<typeof projectStepSchema>;

/** The open wait with its internal note (`M08-25`) — the detail's alone, never the link's. */
export const projectWaitDetailSchema = projectWaitSchema.extend({
  note: z.string().nullable(),
  openedBy: memberRefSchema,
  openedAt: z.string().datetime(),
});

/** What the reader may do on this project — the screen hides every act it may not (`M08-18`). */
export const projectActsSchema = z.object({
  stages: z.boolean(),
  documents: z.boolean(),
  steps: z.boolean(),
});

/**
 * One project (`SCR-M08-02`): every block on one screen, each naming the record it reads
 * (`M08-16`). The customer is the lead's, by reference (`M08-04`); there is no design or accepted
 * proposal to point at until their modules land, and the detail says so (`design`, `proposal`).
 */
export const projectDetailSchema = z.object({
  id: uuidSchema,
  number: z.string(),
  leadId: uuidSchema,
  today: calendarDateSchema,
  customer: z.object({
    id: uuidSchema,
    name: z.string().nullable(),
    phoneE164: phoneE164Schema,
    city: z.string().nullable(),
    preferredLanguage: uiLanguageResponseSchema.nullable(),
  }),
  segment: dealSegmentSchema.nullable(),
  stage: stageRead,
  enteredOn: calendarDateSchema,
  incentiveApplies: z.boolean(),
  manager: memberRefSchema,
  soldBy: memberRefSchema.nullable(),
  expectedInstallOn: calendarDateSchema.nullable(),
  accessNote: z.string().nullable(),
  cancel: z
    .object({
      reason: extensibleEnum(CANCEL_REASONS),
      note: z.string().nullable(),
      at: z.string().datetime(),
      by: memberRefSchema.nullable(),
    })
    .nullable(),
  journey: z.array(projectMoveSchema),
  wait: projectWaitDetailSchema.nullable(),
  documents: z.array(projectDocumentSchema),
  steps: z.array(projectStepSchema),
  crew: z.array(memberRefSchema),
  otherFiles: z.array(projectFileSchema),
  leadFiles: z.array(projectFileSchema),
  todo: extensibleEnum(TODO_KINDS).nullable(),
  earlyProofTo: stageRead.nullable(),
  earlyProofBy: z.string().nullable().optional(),
  missingProofRow: z.string().nullable(),
  /**
   * How many of the handover pack's files could not be read into it; null until the pack has been
   * made. With every file left out the project has no pack, and the handover stops waiting for one.
   */
  packLeftOut: z.number().int().nonnegative().nullable(),
  /** The design and the accepted proposal the project will point at; null until they exist. */
  designId: uuidSchema.nullable(),
  proposalId: uuidSchema.nullable(),
  acts: projectActsSchema,
  /** The Money card (`M11-52`'s one mirror): absent for the crew and on an older api (`M11-56`). */
  money: projectMoneyGlanceSchema.nullable().optional(),
});
export type ProjectDetail = z.infer<typeof projectDetailSchema>;

/** A person a project can name — a manager to pick, an installer for the crew. */
export const projectPersonSchema = memberRefSchema.extend({
  /** Live projects they manage or crew, so a picker can show who is free. */
  liveProjects: z.number().int().nonnegative(),
});
export type ProjectPerson = z.infer<typeof projectPersonSchema>;

/** Why a project act was refused — domain's reason (`F4-16`). */
export const projectActRefusalSchema = extensibleEnum(PROJECT_ACT_REFUSALS);
