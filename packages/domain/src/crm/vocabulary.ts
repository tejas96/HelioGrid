/**
 * The CRM's closed word lists (`M02`). Each is a readonly tuple, so contracts derives its `z.enum`
 * and each migration mirrors its pgEnum from this one list; a screen reads the same tuple, so no
 * package keeps a second copy (`vocabulary-copies`).
 */

/** The eight-step funnel (`M02-41`). Stage is moved by the work; the R9 states never move it. */
export const LEAD_STAGES = [
  'new',
  'contacted',
  'qualified',
  'survey',
  'design',
  'proposal',
  'negotiating',
  'won',
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

/**
 * The R9 parking and terminal states (`M02-49`…`M02-55`), orthogonal to the stage. A lead in none
 * of them is active; "unassigned" is not a state, it is a lead with no owner (`M02-50`), and
 * "reopened" is a transition, never a resting state (`M02-56`).
 */
export const LEAD_LIFECYCLE_STATES = [
  'snoozed',
  'dormant',
  'disqualified',
  'lost',
  'junk',
] as const;
export type LeadLifecycleState = (typeof LEAD_LIFECYCLE_STATES)[number];

/**
 * Where an enquiry came from (`M02-13`). Closed for V1; the inbound call joins when voice calling
 * returns, by appending a value every reader already tolerates.
 */
export const LEAD_SOURCES = ['quick_add', 'import', 'referral'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** The qualifying answers (`M02-39`, option sets by owner ruling 2026-09-24). Each is `assumed`. */
export const ROOF_OWNERSHIPS = ['own', 'rent'] as const;
export type RoofOwnership = (typeof ROOF_OWNERSHIPS)[number];

export const ROOF_TYPES = ['rcc_flat', 'metal_shed', 'tile', 'ground_array'] as const;
export type RoofType = (typeof ROOF_TYPES)[number];

export const SHADINGS = ['none', 'partial', 'heavy'] as const;
export type Shading = (typeof SHADINGS)[number];

export const BUYING_TIMELINES = [
  'within_month',
  'one_to_three_months',
  'three_to_six_months',
  'later',
] as const;
export type BuyingTimeline = (typeof BUYING_TIMELINES)[number];

export const DECISION_MAKERS = ['this_person', 'someone_else'] as const;
export type DecisionMaker = (typeof DECISION_MAKERS)[number];

/** The six reasons a lead is disqualified (`M02-42`) — "the most valuable analytics in the product". */
export const DISQUALIFY_REASONS = [
  'renting',
  'budget',
  'not_interested',
  'unreachable',
  'already_installed',
  'wrong_number',
] as const;
export type DisqualifyReason = (typeof DISQUALIFY_REASONS)[number];

/** The seven reasons a lead is lost (`M02-54`; the seventh by owner ruling 2026-08-04). */
export const LOST_REASONS = [
  'price',
  'chose_competitor',
  'postponed',
  'not_reachable',
  'roof_unsuitable',
  'financing_failed',
  'not_interested',
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

/**
 * The role labels every company starts with (`M02-34`); a company adds its own as plain text. A
 * seeded label's words are catalog copy, so it stores its key, never an English string.
 */
export const CONTACT_ROLE_SEEDS = ['decision_maker', 'landlord', 'spouse'] as const;
export type ContactRoleSeed = (typeof CONTACT_ROLE_SEEDS)[number];

/** What a logged call ended as (`M02-43`). A wrong number is a disqualification, not an outcome. */
export const CALL_OUTCOMES = ['answered', 'no_answer'] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

/**
 * What one timeline entry records (`M02-35`). The set GROWS with the modules that write into the
 * one stream, so a response carries it as an extensible enum and a reader shows an unknown kind
 * as a plain system entry.
 */
export const ACTIVITY_KINDS = [
  'lead_created',
  'note',
  'call',
  'enquiry',
  'stage_change',
  'state_change',
  'assignment',
  'field_change',
  'duplicate_kept',
  'referral',
  'message_copied',
  'visit_booked',
  'visit_rescheduled',
  'task_done',
  'customer_merged',
  /** A project's own entries (`M08-17`): they join the lead's stream, since a won deal IS the project. */
  'project_moved',
  'project_wait',
  'project_document',
  'project_step',
  'project_changed',
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Who did it (`M02-35`): a person, the agent, the system or the customer. */
export const ACTIVITY_ACTORS = ['person', 'agent', 'system', 'customer'] as const;
export type ActivityActor = (typeof ACTIVITY_ACTORS)[number];

/** What a follow-up task asks (`M07-05`). */
export const TASK_KINDS = ['follow_up', 'site_visit', 'call', 'custom'] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

/** `M07-05`'s ruled status set; overdue is derived on `open`, never stored. */
export const TASK_STATUSES = ['open', 'done', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Which rule raised a task, so an automatic task names its provenance (`M07-06`). */
export const TASK_PROVENANCES = [
  'manual',
  'call_back_window',
  'retry_after_no_answer',
  'snooze_wake',
  'resurface',
  'visit_booked',
] as const;
export type TaskProvenance = (typeof TASK_PROVENANCES)[number];

/** How a funnel or R9 move happened (`lead_stage_transition.cause`). */
export const TRANSITION_CAUSES = [
  'manual',
  'import',
  'automation',
  'wake',
  'reopen',
  'merge',
] as const;
export type TransitionCause = (typeof TRANSITION_CAUSES)[number];

/** The import's one bulk choice for duplicates by phone (`M02-20`): never "keep both". */
export const IMPORT_DUPLICATE_CHOICES = ['skip', 'log_enquiry'] as const;
export type ImportDuplicateChoice = (typeof IMPORT_DUPLICATE_CHOICES)[number];

/**
 * What a funnel-history row moved (`lead_stage_transition.move_kind`): the stage, or the R9 state
 * beside it — kept apart so time-in-stage never counts a parking spell as a stage (`M13-22`).
 */
export const LEAD_MOVE_KINDS = ['funnel_stage', 'lifecycle_state'] as const;
export type LeadMoveKind = (typeof LEAD_MOVE_KINDS)[number];

/**
 * The dedupe sheet's three choices, and no fourth (`M02-09`): open the existing record (a request to
 * its owner when it is outside the person's scope, `M02-08`), log the enquiry on it, or keep both
 * with a reason.
 */
export const DEDUPE_CHOICES = ['open_existing', 'log_enquiry', 'keep_both'] as const;
export type DedupeChoice = (typeof DEDUPE_CHOICES)[number];

/** The fields a merge asks a person to pick between when the two customers differ (`M02-60`). */
export const MERGE_FIELDS = ['name', 'city', 'primary_contact'] as const;
export type MergeField = (typeof MERGE_FIELDS)[number];
