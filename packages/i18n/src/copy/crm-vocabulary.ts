/**
 * The CRM's closed vocabularies in words (`M02`): one `Record` over each of domain's tuples, so a
 * member domain adds fails to compile here until it is worded. The key is the stored value, never
 * the English; the words are the display (`F3-12`).
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type {
  ActivityKind,
  BuyingTimeline,
  CallOutcome,
  ContactRoleSeed,
  DealSegment,
  DecisionMaker,
  DisqualifyReason,
  LeadLifecycleState,
  LeadSource,
  LeadStage,
  LostReason,
  RoofOwnership,
  RoofType,
  Shading,
  TaskKind,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';

/** The eight-step funnel (`M02-41`). */
export const LEAD_STAGE_WORD: Record<LeadStage, MessageRef> = {
  new: /*i18n*/ { id: 'New' },
  contacted: /*i18n*/ { id: 'Contacted' },
  qualified: /*i18n*/ { id: 'Qualified' },
  survey: /*i18n*/ { id: 'Survey' },
  design: /*i18n*/ { id: 'Design' },
  proposal: /*i18n*/ { id: 'Proposal' },
  negotiating: /*i18n*/ { id: 'Negotiating' },
  won: /*i18n*/ { id: 'Won' },
};

/** The R9 parking and terminal states (`M02-49`); an active lead shows none. */
export const LEAD_STATE_WORD: Record<LeadLifecycleState, MessageRef> = {
  snoozed: /*i18n*/ { id: 'Snoozed' },
  dormant: /*i18n*/ { id: 'Dormant' },
  disqualified: /*i18n*/ { id: 'Disqualified' },
  lost: /*i18n*/ { id: 'Lost' },
  junk: /*i18n*/ { id: 'Junk' },
};

/** Where an enquiry came from (`M02-13`). */
export const LEAD_SOURCE_WORD: Record<LeadSource, MessageRef> = {
  quick_add: /*i18n*/ { id: 'Quick add' },
  import: /*i18n*/ { id: 'Import' },
  referral: /*i18n*/ { id: 'Referral' },
};

/** What one deal is (`M02-05`) — the quick add's "type". */
export const DEAL_SEGMENT_WORD: Record<DealSegment, MessageRef> = {
  residential: /*i18n*/ { id: 'Residential' },
  commercial: /*i18n*/ { id: 'Commercial' },
};

/** The six things qualification asks (`M02-39`): the bill and the five chip questions. */
export const QUALIFY_QUESTION_LABEL = {
  monthlyBill: /*i18n*/ { id: 'Monthly bill' },
  roofOwnership: /*i18n*/ { id: 'Roof' },
  roofType: /*i18n*/ { id: 'Roof type' },
  shading: /*i18n*/ { id: 'Shading' },
  timeline: /*i18n*/ { id: 'When to buy' },
  decisionMaker: /*i18n*/ { id: 'Decision maker' },
} as const satisfies Record<string, MessageRef>;

export const ROOF_OWNERSHIP_WORD: Record<RoofOwnership, MessageRef> = {
  own: /*i18n*/ { id: 'Owned' },
  rent: /*i18n*/ { id: 'Rented' },
};

export const ROOF_TYPE_WORD: Record<RoofType, MessageRef> = {
  rcc_flat: /*i18n*/ { id: 'RCC flat' },
  metal_shed: /*i18n*/ { id: 'Metal shed' },
  tile: /*i18n*/ { id: 'Tile' },
  ground_array: /*i18n*/ { id: 'Ground array' },
};

export const SHADING_WORD: Record<Shading, MessageRef> = {
  none: /*i18n*/ { id: 'None' },
  partial: /*i18n*/ { id: 'Partial' },
  heavy: /*i18n*/ { id: 'Heavy' },
};

export const BUYING_TIMELINE_WORD: Record<BuyingTimeline, MessageRef> = {
  within_month: /*i18n*/ { id: 'Within a month' },
  one_to_three_months: /*i18n*/ { id: '1–3 months' },
  three_to_six_months: /*i18n*/ { id: '3–6 months' },
  later: /*i18n*/ { id: 'Later' },
};

export const DECISION_MAKER_WORD: Record<DecisionMaker, MessageRef> = {
  this_person: /*i18n*/ { id: 'This person' },
  someone_else: /*i18n*/ { id: 'Someone else' },
};

/** The six reasons a lead is disqualified (`M02-42`). */
export const DISQUALIFY_REASON_WORD: Record<DisqualifyReason, MessageRef> = {
  renting: /*i18n*/ { id: 'Renting' },
  budget: /*i18n*/ { id: 'Budget' },
  not_interested: /*i18n*/ { id: 'Not interested' },
  unreachable: /*i18n*/ { id: 'Unreachable' },
  already_installed: /*i18n*/ { id: 'Already installed' },
  wrong_number: /*i18n*/ { id: 'Wrong number' },
};

/** The seven reasons a lead is lost (`M02-54`). */
export const LOST_REASON_WORD: Record<LostReason, MessageRef> = {
  price: /*i18n*/ { id: 'Price' },
  chose_competitor: /*i18n*/ { id: 'Chose a competitor' },
  postponed: /*i18n*/ { id: 'Postponed' },
  not_reachable: /*i18n*/ { id: 'Not reachable' },
  roof_unsuitable: /*i18n*/ { id: 'Roof unsuitable' },
  financing_failed: /*i18n*/ { id: 'Financing failed' },
  not_interested: /*i18n*/ { id: 'Not interested' },
};

/** The role labels every company starts with (`M02-34`); a company's own is its typed text. */
export const CONTACT_ROLE_SEED_WORD: Record<ContactRoleSeed, MessageRef> = {
  decision_maker: /*i18n*/ { id: 'Decision maker' },
  landlord: /*i18n*/ { id: 'Landlord' },
  spouse: /*i18n*/ { id: 'Spouse' },
};

/** What a logged call ended as (`M02-43`). */
export const CALL_OUTCOME_WORD: Record<CallOutcome, MessageRef> = {
  answered: /*i18n*/ { id: 'Picked up' },
  no_answer: /*i18n*/ { id: 'No answer' },
};

/** What a follow-up task asks (`M07-05`). */
export const TASK_KIND_WORD: Record<TaskKind, MessageRef> = {
  follow_up: /*i18n*/ { id: 'Follow-up' },
  site_visit: /*i18n*/ { id: 'Site visit' },
  call: /*i18n*/ { id: 'Call' },
  custom: /*i18n*/ { id: 'Custom' },
};

/** What one timeline entry records (`M02-35`); a kind a newer server adds reads as a system entry. */
export const ACTIVITY_KIND_WORD: Record<ActivityKind, MessageRef> = {
  lead_created: /*i18n*/ { id: 'Lead created' },
  note: /*i18n*/ { id: 'Note' },
  call: /*i18n*/ { id: 'Call' },
  enquiry: /*i18n*/ { id: 'Enquiry' },
  stage_change: /*i18n*/ { id: 'Stage change' },
  state_change: /*i18n*/ { id: 'Parked or closed' },
  assignment: /*i18n*/ { id: 'Assignment' },
  field_change: /*i18n*/ { id: 'Field edited' },
  duplicate_kept: /*i18n*/ { id: 'Duplicate kept' },
  referral: /*i18n*/ { id: 'Referral' },
  message_copied: /*i18n*/ { id: 'Message copied' },
  visit_booked: /*i18n*/ { id: 'Visit booked' },
  visit_rescheduled: /*i18n*/ { id: 'Visit rescheduled' },
  task_done: /*i18n*/ { id: 'Task done' },
  customer_merged: /*i18n*/ { id: 'Customers merged' },
  project_moved: /*i18n*/ { id: 'Project stage' },
  project_wait: /*i18n*/ { id: 'Project wait' },
  project_document: /*i18n*/ { id: 'Project document' },
  project_step: /*i18n*/ { id: 'Install step' },
  project_changed: /*i18n*/ { id: 'Project changed' },
};

type Worded<K extends string> = Readonly<Record<K, TranslatedText>>;

function worded<K extends string>(
  t: Translator['t'],
  messages: Readonly<Record<K, MessageRef>>,
): Worded<K> {
  const entries = Object.entries<MessageRef>(messages).map(([key, message]) => [key, t(message)]);
  return Object.fromEntries(entries) as Worded<K>;
}

/** Every CRM vocabulary in the reader's language, keyed by the stored value. */
export function crmVocabularyWords(t: Translator['t']) {
  return {
    stage: worded(t, LEAD_STAGE_WORD),
    state: worded(t, LEAD_STATE_WORD),
    source: worded(t, LEAD_SOURCE_WORD),
    segment: worded(t, DEAL_SEGMENT_WORD),
    question: worded(t, QUALIFY_QUESTION_LABEL),
    roofOwnership: worded(t, ROOF_OWNERSHIP_WORD),
    roofType: worded(t, ROOF_TYPE_WORD),
    shading: worded(t, SHADING_WORD),
    timeline: worded(t, BUYING_TIMELINE_WORD),
    decisionMaker: worded(t, DECISION_MAKER_WORD),
    disqualifyReason: worded(t, DISQUALIFY_REASON_WORD),
    lostReason: worded(t, LOST_REASON_WORD),
    contactRole: worded(t, CONTACT_ROLE_SEED_WORD),
    callOutcome: worded(t, CALL_OUTCOME_WORD),
    taskKind: worded(t, TASK_KIND_WORD),
    activityKind: worded(t, ACTIVITY_KIND_WORD),
  };
}

export type CrmVocabularyWords = ReturnType<typeof crmVocabularyWords>;
