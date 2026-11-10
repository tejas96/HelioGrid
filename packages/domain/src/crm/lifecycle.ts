import {
  isClosed,
  type LeadActResult,
  type LeadLifecycle,
  type LeadTransition,
  moved,
  refused,
  stateMove,
} from './lifecycle-model';
import { LEAD_STAGES, type LeadStage, type TransitionCause } from './vocabulary';

/**
 * The funnel (`M02-41`): stage is moved by the work that happens to a lead, forward only, and never
 * by a parking or terminal state (`lifecycle-parking.ts`, `lifecycle-close.ts`). A closed lead's
 * stage is where it closed — the win/loss lists read it (`M13`) — so no work moves it until a reopen.
 */

/**
 * Any activity on a dormant lead returns it to its stage (`M02-52`); an active, parked or closed
 * lead is left as it is.
 */
function returnedFromDormant(lead: LeadLifecycle): readonly LeadTransition[] {
  return lead.state === 'dormant' ? stateMove(lead, null, 'automation') : [];
}

function stageIndex(stage: LeadStage): number {
  return LEAD_STAGES.indexOf(stage);
}

/** The lead after an activity on it, and the dormant return it made, with the stage untouched. */
function afterActivity(lead: LeadLifecycle): {
  readonly lead: LeadLifecycle;
  readonly transitions: readonly LeadTransition[];
} {
  const transitions = returnedFromDormant(lead);
  return { lead: transitions.length === 0 ? lead : { ...lead, state: null }, transitions };
}

/**
 * Something was recorded on the lead — a note, a call, a message copied — and nothing else: a
 * dormant lead returns to its stage, every other lead stays as it is.
 */
export function activityRecorded(lead: LeadLifecycle): LeadActResult {
  const after = afterActivity(lead);
  return moved(after.lead, after.transitions);
}

/**
 * A forward move along the funnel to `to`, skipping stages between where the work does. Refused on
 * a closed lead, and at `to` or past it — the funnel never runs backwards. A parked lead keeps its
 * state, since stage and state are orthogonal (`M02-41`); a dormant one returns, as any work does.
 */
export function advanceStage(
  lead: LeadLifecycle,
  to: LeadStage,
  cause: TransitionCause = 'manual',
): LeadActResult {
  if (isClosed(lead)) return refused('lead_closed');
  if (stageIndex(to) <= stageIndex(lead.stage)) return refused('stage_reached');
  const after = afterActivity(lead);
  return moved({ ...after.lead, stage: to }, [
    ...after.transitions,
    { moveKind: 'funnel_stage', from: lead.stage, to, cause },
  ]);
}

/**
 * Who owns the lead (`M02-30`): a fact apart from its stage and state, so assigning moves neither.
 * A lead waits unassigned at stage `new` (`M02-50`), so assigning it is the lead entering Assigned
 * at `new`; a reassignment — a rep on leave — keeps the stage the work reached. A closed lead takes
 * no owner until a reopen: junk and closed leads are in no one's queue.
 */
export function assign(lead: LeadLifecycle, ownerId: string): LeadActResult {
  if (isClosed(lead)) return refused('lead_closed');
  if (lead.ownerId === ownerId) return refused('already_owner');
  return moved({ ...lead, ownerId }, []);
}

/**
 * A call logged as answered: a `new` lead becomes `contacted`. Logging a call is never refused — it
 * is a record of what happened — so on a closed lead, or one already past `new`, nothing moves but
 * the dormant return.
 */
export function callAnswered(lead: LeadLifecycle): LeadActResult {
  if (lead.stage === 'new' && !isClosed(lead)) return advanceStage(lead, 'contacted');
  return activityRecorded(lead);
}

/**
 * *Mark qualified* on the qualify card: the six answers inform and a person decides (`M02-45`).
 * From `new` or `contacted` only; a lead already qualified or further on is refused.
 */
export function markQualified(lead: LeadLifecycle): LeadActResult {
  return advanceStage(lead, 'qualified');
}

/**
 * A site visit booked (`M02-46`): a lead before `survey` moves to it; one at `survey` or past it — a
 * second visit — keeps its stage. Refused on a closed lead, which takes no visit until a reopen.
 */
export function visitBooked(lead: LeadLifecycle): LeadActResult {
  if (isClosed(lead)) return refused('lead_closed');
  if (stageIndex(lead.stage) < stageIndex('survey')) return advanceStage(lead, 'survey');
  return activityRecorded(lead);
}
