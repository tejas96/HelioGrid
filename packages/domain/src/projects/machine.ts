import type { CalendarDate } from '../format/holidays';
import {
  CANCELLED_STAGE,
  PROJECT_STAGE_CHAIN,
  type ProjectChainStage,
  type ProjectStage,
} from './stages';
import type { CancelReason, ProjectActRefusal, ProjectMoveCause } from './vocabulary';

/**
 * The project machine (`M08-08`, `M08-14`, owner ruling 2026-11-10). One chain for every project;
 * a person taps the stages no proof can show (Material ordered, Dispatched, DISCOM inspection),
 * proof moves the rest, handover ends it and a cancellation can end it anywhere. Every act below is
 * a pure decision — the api stamps who and when on the move it returns and writes it in one
 * transaction with what follows it.
 */

/** What the machine reads of a project: where it stands, and whether its deal claims an incentive. */
export interface ProjectStanding {
  readonly stage: ProjectStage;
  /**
   * Whether the incentive stage applies to this deal (`F1-35`). Where it does not, the chain passes
   * over it — never removing it (`M08-09`): the board still shows the true position.
   */
  readonly incentiveApplies: boolean;
}

/** One move: where from, where to, what moved it, the proof that did, and the stages it passed. */
export interface ProjectMove {
  readonly from: ProjectStage;
  readonly to: ProjectStage;
  readonly cause: ProjectMoveCause;
  /** The proof that moved it — a checklist row or an install step's key — or null. */
  readonly proof: string | null;
  /** Stages the move passed without entering, which count as passed (`M08-36`). */
  readonly passed: readonly ProjectChainStage[];
}

export type ProjectMoveResult =
  | { readonly kind: 'moved'; readonly move: ProjectMove }
  | { readonly kind: 'refused'; readonly refusal: ProjectActRefusal };

const refused = (refusal: ProjectActRefusal): ProjectMoveResult => ({ kind: 'refused', refusal });

/** How long after a person's own move its undo is still taken: the toast shows five seconds of it. */
export const UNDO_WINDOW_MS = 15_000;

/** How long a move's toast offers its *Undo* (ruling 16) — well inside the server's window. */
export const UNDO_TOAST_MS = 5_000;

/** A handed-over or cancelled project takes no move. */
export function isClosedStage(stage: ProjectStage): boolean {
  return stage === 'handed_over' || stage === CANCELLED_STAGE;
}

/** A stage's place on the chain; cancelled has none. */
export function chainIndexOf(stage: ProjectStage): number {
  return (PROJECT_STAGE_CHAIN as readonly string[]).indexOf(stage);
}

/** The chain this deal walks: every stage, save the incentive one where no incentive applies. */
export function chainOf(standing: ProjectStanding): readonly ProjectChainStage[] {
  return PROJECT_STAGE_CHAIN.filter(
    (stage) => stage !== 'incentive_claimed' || standing.incentiveApplies,
  );
}

/** The stage after the project's own on its deal's chain, or null when it stands at the end or off it. */
export function nextStageOf(standing: ProjectStanding): ProjectChainStage | null {
  const chain = chainOf(standing);
  const at = chain.indexOf(standing.stage as ProjectChainStage);
  return at < 0 ? null : (chain[at + 1] ?? null);
}

/** The stage before the project's own on its deal's chain, or null at Won and off it. */
export function previousStageOf(standing: ProjectStanding): ProjectChainStage | null {
  const chain = chainOf(standing);
  const at = chain.indexOf(standing.stage as ProjectChainStage);
  return at <= 0 ? null : (chain[at - 1] ?? null);
}

/**
 * The deal's own stages strictly between two, which a move from one to the other passes — never
 * the incentive stage a deal without one does not walk.
 */
function stagesBetween(standing: ProjectStanding, to: ProjectStage): readonly ProjectChainStage[] {
  return chainOf(standing).filter(
    (stage) =>
      chainIndexOf(stage) > chainIndexOf(standing.stage) && chainIndexOf(stage) < chainIndexOf(to),
  );
}

/** Whether a stage is on the deal's own chain — a proof of a stage it does not walk moves nothing. */
function isOnChain(standing: ProjectStanding, stage: ProjectChainStage): boolean {
  return chainOf(standing).includes(stage);
}

function moved(
  standing: ProjectStanding,
  to: ProjectStage,
  cause: ProjectMoveCause,
  proof: string | null = null,
): ProjectMoveResult {
  return {
    kind: 'moved',
    move: { from: standing.stage, to, cause, proof, passed: stagesBetween(standing, to) },
  };
}

/**
 * A person's forward tap: to the next stage only. Handover is its own flow, since only the
 * checklist decides it (`M08-32`); a stage at or behind the project's is one somebody already
 * moved it past — the second of two people tapping at once (ruling 2026-11-10).
 */
export function decidePersonMove(standing: ProjectStanding, to: ProjectStage): ProjectMoveResult {
  if (isClosedStage(standing.stage)) return refused('project_closed');
  if (to === 'dispatched') return refused('needs_crew');
  return decideForward(standing, to);
}

/** The day the material left, as the person says it: never ahead, never before the stage began. */
export interface DispatchDay {
  readonly leftOn: CalendarDate;
  /** The company day the project entered the stage it leaves. */
  readonly enteredOn: CalendarDate;
  readonly today: CalendarDate;
}

/**
 * *Dispatched* names its crew (ruling 6) and the day the material left the warehouse (the picked
 * design): the one way a project reaches it.
 */
export function decideDispatch(standing: ProjectStanding, day: DispatchDay): ProjectMoveResult {
  if (isClosedStage(standing.stage)) return refused('project_closed');
  if (day.leftOn > day.today) return refused('date_in_future');
  if (day.leftOn < day.enteredOn) return refused('date_before_stage');
  return decideForward(standing, 'dispatched');
}

/** One stage forward by a person's tap — to the next stage only, never past the handover. */
function decideForward(standing: ProjectStanding, to: ProjectStage): ProjectMoveResult {
  if (to === 'handed_over') return refused('needs_handover');
  if (to === CANCELLED_STAGE) return refused('not_next_stage');
  if (chainIndexOf(to) <= chainIndexOf(standing.stage)) return refused('already_moved');
  if (to !== nextStageOf(standing)) return refused('not_next_stage');
  return moved(standing, to, 'person');
}

/**
 * *Move back* (`M08-14`): one stage back, recorded with the same weight as a forward move — from
 * the stage the person saw (`from`); a project another person moved since is `already_moved`, so
 * two taps on one screen never step it back twice (ruling 16).
 */
export function decideMoveBack(standing: ProjectStanding, from: ProjectStage): ProjectMoveResult {
  if (isClosedStage(standing.stage)) return refused('project_closed');
  if (standing.stage !== from) return refused('already_moved');
  const back = previousStageOf(standing);
  if (back === null) return refused('nothing_behind');
  return moved(standing, back, 'person');
}

/**
 * Proof landed — an install tick or an uploaded document — that the project has reached `target`.
 * It moves the project when it stands directly before `target` on its deal's chain; further back,
 * the proof waits and the project asks one tap (`early`); at or past it, or closed, nothing moves.
 */
export type ProofOutcome =
  | { readonly kind: 'moved'; readonly move: ProjectMove }
  | { readonly kind: 'early' }
  | { readonly kind: 'none' };

export function decideProof(
  standing: ProjectStanding,
  target: ProjectChainStage,
  proof: string,
): ProofOutcome {
  if (isClosedStage(standing.stage) || target === 'handed_over') return { kind: 'none' };
  if (!isOnChain(standing, target)) return { kind: 'none' };
  if (chainIndexOf(target) <= chainIndexOf(standing.stage)) return { kind: 'none' };
  if (nextStageOf(standing) !== target) return { kind: 'early' };
  const result = moved(standing, target, 'proof', proof);
  return result.kind === 'moved' ? { kind: 'moved', move: result.move } : { kind: 'none' };
}

/**
 * The one tap an early proof asks for: the project moves to what the proof shows, and every stage
 * it passes counts as passed (ruling 2026-11-10).
 */
export function decideEarlyMove(
  standing: ProjectStanding,
  target: ProjectChainStage,
  proof: string,
): ProjectMoveResult {
  if (isClosedStage(standing.stage)) return refused('project_closed');
  if (target === 'handed_over') return refused('needs_handover');
  if (!isOnChain(standing, target)) return refused('not_next_stage');
  if (chainIndexOf(target) <= chainIndexOf(standing.stage)) return refused('already_moved');
  return moved(standing, target, 'proof', proof);
}

/** Why a project is cancelled: a reason always, and the person's words when it is something else. */
export interface CancelWhy {
  readonly reason: CancelReason;
  readonly note: string | null;
}

/** Cancel (`M08-51`): from any stage but the two ends, with its reason (`M08-51`: mandatory). */
export function decideCancel(standing: ProjectStanding, why: CancelWhy): ProjectMoveResult {
  if (isClosedStage(standing.stage)) return refused('project_closed');
  if (why.reason === 'something_else' && (why.note ?? '').trim() === '') {
    return refused('reason_needed');
  }
  return moved(standing, CANCELLED_STAGE, 'cancel');
}

/**
 * A promised install date is today or later (the picked design: a date already gone is no
 * promise) — at *Mark won* and whenever the manager changes it.
 */
export function isPromisableInstallDate(on: CalendarDate, today: CalendarDate): boolean {
  return on >= today;
}

/**
 * Handover (`M08-32`, `M08-46`): only from the stage directly before it, and only with no row of
 * the checklist still waiting on a person.
 */
export function decideHandover(
  standing: ProjectStanding,
  pendingRows: readonly string[],
): ProjectMoveResult {
  if (isClosedStage(standing.stage)) return refused('project_closed');
  if (nextStageOf(standing) !== 'handed_over') return refused('not_next_stage');
  if (pendingRows.length > 0) return refused('documents_pending');
  return moved(standing, 'handed_over', 'handover');
}

/** The last move on a project, as its history holds it. */
export interface LastMove {
  readonly from: ProjectStage;
  readonly to: ProjectStage;
  readonly cause: ProjectMoveCause;
  readonly by: string | null;
  /** Epoch milliseconds. */
  readonly at: number;
}

/**
 * Undo (ruling 2026-11-10): a person takes back their own last move, while its toast still shows
 * — never a proof's, a handover's or a cancellation's, and never once anything moved after it.
 */
export function decideUndo(
  standing: ProjectStanding,
  last: LastMove | null,
  actor: string,
  now: number,
): ProjectMoveResult {
  if (last === null || last.cause !== 'person' || last.by !== actor) return refused('not_undoable');
  if (last.to !== standing.stage || now - last.at > UNDO_WINDOW_MS) return refused('not_undoable');
  return moved(standing, last.from, 'undo');
}
