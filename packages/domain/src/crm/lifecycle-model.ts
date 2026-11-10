import { type CalendarDate, isCalendarDate } from '../format/holidays';
import type {
  DisqualifyReason,
  LeadLifecycleState,
  LeadMoveKind,
  LeadStage,
  LostReason,
  TaskProvenance,
  TransitionCause,
} from './vocabulary';

/**
 * What the lead's two machines read and write (`M02-41`, `M02-49`…`M02-56`): the funnel stage and
 * the orthogonal R9 state, the owner, the dates the 09:00 sweep acts on, the current close and the
 * reopen count. Every act below is a pure function over this — the api stamps who and when on the
 * transitions it returns and writes them in one transaction.
 */
export interface LeadLifecycle {
  readonly stage: LeadStage;
  /** `null` is an active lead; unassigned is an owner of `null`, never a state (`M02-50`). */
  readonly state: LeadLifecycleState | null;
  readonly ownerId: string | null;
  /** The day a snoozed lead wakes, at 09:00 tenant-local (`M02-51`). */
  readonly wakeOn: CalendarDate | null;
  /** The day a loss postponed resurfaces, at 09:00 tenant-local (`M02-54`). */
  readonly resurfaceOn: CalendarDate | null;
  /** The last day no call task is raised, after a loss for *not interested* (`M02-54`). */
  readonly noCallUntil: CalendarDate | null;
  /** The current close — it stays on the record through a reopen (`M02-56`). */
  readonly close: LeadClose | null;
  readonly reopenCount: number;
}

/** A close: which terminal state, its reason where the state has one, when and by whom. */
export type LeadClose =
  | (ClosedBy & { readonly state: 'disqualified'; readonly reason: DisqualifyReason })
  | (ClosedBy & { readonly state: 'lost'; readonly reason: LostReason })
  | (ClosedBy & { readonly state: 'junk' });

export interface ClosedBy {
  /** Epoch milliseconds. */
  readonly at: number;
  /** The person who closed it: every close is a person's act. */
  readonly by: string;
}

/** A person's act, as the api sees it: who, when, and the tenant's local day at that moment. */
export interface LeadActContext extends ClosedBy {
  readonly today: CalendarDate;
}

/**
 * One row of the funnel history (`lead_stage_transition`): a stage move, or an R9 move beside it.
 * An R9 `null` is an active lead.
 */
export type LeadTransition =
  | {
      readonly moveKind: Extract<LeadMoveKind, 'funnel_stage'>;
      readonly from: LeadStage;
      readonly to: LeadStage;
      readonly cause: TransitionCause;
    }
  | {
      readonly moveKind: Extract<LeadMoveKind, 'lifecycle_state'>;
      readonly from: LeadLifecycleState | null;
      readonly to: LeadLifecycleState | null;
      readonly cause: TransitionCause;
    };

/** Why an act is refused — the api answers each with its error code. */
export const LEAD_ACT_REFUSALS = [
  'already_owner',
  'lead_closed',
  'stage_reached',
  'wake_date_not_future',
  'reason_not_listed',
  'resurface_date_not_future',
  'not_snoozed',
  'not_due',
  'not_reopenable',
  'not_postponed',
  'not_open',
] as const;
export type LeadActRefusal = (typeof LEAD_ACT_REFUSALS)[number];

/**
 * An act's answer: the lead after it, every move it made in order, and the follow-up task the rule
 * raises with it (`M02-51`, `M02-54`) — or the reason it was refused, with nothing changed.
 */
export type LeadActResult =
  | {
      readonly kind: 'moved';
      readonly next: LeadLifecycle;
      readonly transitions: readonly LeadTransition[];
      readonly raisesTask: TaskProvenance | null;
    }
  | { readonly kind: 'refused'; readonly refusal: LeadActRefusal };

export function refused(refusal: LeadActRefusal): LeadActResult {
  return { kind: 'refused', refusal };
}

export function moved(
  next: LeadLifecycle,
  transitions: readonly LeadTransition[],
  raisesTask: TaskProvenance | null = null,
): LeadActResult {
  return { kind: 'moved', next, transitions, raisesTask };
}

/** The terminal states: a lead in one is closed until a reopen. */
const CLOSED_STATES: readonly LeadLifecycleState[] = ['disqualified', 'lost', 'junk'];

export function isClosed(lead: LeadLifecycle): boolean {
  return isClosedState(lead.state);
}

/** Whether a state is one of the terminal three — the lead is closed until a reopen. */
export function isClosedState(state: LeadLifecycleState | null): boolean {
  return state !== null && CLOSED_STATES.includes(state);
}

/** The R9 move from the lead's state to `to`, or none when it is already there. */
export function stateMove(
  lead: LeadLifecycle,
  to: LeadLifecycleState | null,
  cause: TransitionCause,
): readonly LeadTransition[] {
  return lead.state === to ? [] : [{ moveKind: 'lifecycle_state', from: lead.state, to, cause }];
}

/** Whether a day is written `YYYY-MM-DD` and comes after today. */
export function isFutureDay(day: CalendarDate | null | undefined, today: CalendarDate): boolean {
  return day !== null && day !== undefined && isCalendarDate(day) && day > today;
}
