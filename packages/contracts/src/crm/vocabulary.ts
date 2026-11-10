import {
  ACTIVITY_ACTORS,
  ACTIVITY_KINDS,
  BUYING_TIMELINES,
  CALL_OUTCOMES,
  CONTACT_ROLE_SEEDS,
  DEAL_SEGMENTS,
  DECISION_MAKERS,
  DISQUALIFY_REASONS,
  IMPORT_DUPLICATE_CHOICES,
  LEAD_LIFECYCLE_STATES,
  LEAD_SOURCES,
  LEAD_STAGES,
  LOST_REASONS,
  ROOF_OWNERSHIPS,
  ROOF_TYPES,
  SHADINGS,
  TASK_KINDS,
  TASK_PROVENANCES,
  TASK_STATUSES,
  TRANSITION_CAUSES,
} from '@heliogrid/domain';
import { z } from 'zod';

/*
 * The CRM's closed sets on the wire (`M02`), each derived from its domain tuple and mirrored as a
 * pgEnum (invariant `enum-parity`). A set that grows with later modules — the source, the activity
 * kind, a task's provenance — is read through `extensibleEnum` where a response carries it; these
 * closed forms are the writes and the mirror.
 */

/** The eight-step funnel (`M02-41`). */
export const leadStageSchema = z.enum(LEAD_STAGES);
export type LeadStage = z.infer<typeof leadStageSchema>;

/** The R9 parking and terminal states (`M02-49`); a lead in none of them is active. */
export const leadLifecycleStateSchema = z.enum(LEAD_LIFECYCLE_STATES);
export type LeadLifecycleState = z.infer<typeof leadLifecycleStateSchema>;

/** Where an enquiry came from (`M02-13`). Grows when voice calling returns, so a read is extensible. */
export const leadSourceSchema = z.enum(LEAD_SOURCES);
export type LeadSource = z.infer<typeof leadSourceSchema>;

/** What ONE deal is (`M02-05`): the quick add's "type", carried to the proposal unasked. */
export const dealSegmentSchema = z.enum(DEAL_SEGMENTS);
export type DealSegment = z.infer<typeof dealSegmentSchema>;

/** The qualifying answers (`M02-39`). */
export const roofOwnershipSchema = z.enum(ROOF_OWNERSHIPS);
export type RoofOwnership = z.infer<typeof roofOwnershipSchema>;
export const roofTypeSchema = z.enum(ROOF_TYPES);
export type RoofType = z.infer<typeof roofTypeSchema>;
export const shadingSchema = z.enum(SHADINGS);
export type Shading = z.infer<typeof shadingSchema>;
export const buyingTimelineSchema = z.enum(BUYING_TIMELINES);
export type BuyingTimeline = z.infer<typeof buyingTimelineSchema>;
export const decisionMakerSchema = z.enum(DECISION_MAKERS);
export type DecisionMaker = z.infer<typeof decisionMakerSchema>;

/** The six reasons a lead is disqualified (`M02-42`). */
export const disqualifyReasonSchema = z.enum(DISQUALIFY_REASONS);
export type DisqualifyReason = z.infer<typeof disqualifyReasonSchema>;

/** The seven reasons a lead is lost (`M02-54`). */
export const lostReasonSchema = z.enum(LOST_REASONS);
export type LostReason = z.infer<typeof lostReasonSchema>;

/** The role labels every company starts with (`M02-34`). */
export const contactRoleSeedSchema = z.enum(CONTACT_ROLE_SEEDS);
export type ContactRoleSeed = z.infer<typeof contactRoleSeedSchema>;

/** What one timeline entry records (`M02-35`). Grows with every module; a read is extensible. */
export const activityKindSchema = z.enum(ACTIVITY_KINDS);
export type ActivityKind = z.infer<typeof activityKindSchema>;

/** Who did it (`M02-35`). */
export const activityActorSchema = z.enum(ACTIVITY_ACTORS);
export type ActivityActor = z.infer<typeof activityActorSchema>;

/** What a logged call ended as (`M02-43`). */
export const callOutcomeSchema = z.enum(CALL_OUTCOMES);
export type CallOutcome = z.infer<typeof callOutcomeSchema>;

/** What a follow-up task asks (`M07-05`). */
export const taskKindSchema = z.enum(TASK_KINDS);
export type TaskKind = z.infer<typeof taskKindSchema>;
export const taskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

/** Which rule raised a task (`M07-06`). Grows with the automations; a read is extensible. */
export const taskProvenanceSchema = z.enum(TASK_PROVENANCES);
export type TaskProvenance = z.infer<typeof taskProvenanceSchema>;

/** How a funnel or R9 move happened (`lead_stage_transition.cause`). */
export const transitionCauseSchema = z.enum(TRANSITION_CAUSES);
export type TransitionCause = z.infer<typeof transitionCauseSchema>;

/** The import's one bulk choice for duplicates by phone (`M02-20`): never "keep both". */
export const importDuplicateChoiceSchema = z.enum(IMPORT_DUPLICATE_CHOICES);
export type ImportDuplicateChoice = z.infer<typeof importDuplicateChoiceSchema>;
