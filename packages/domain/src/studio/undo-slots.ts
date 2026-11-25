import type { History } from './history';
import type { RoofStepState } from './roof-step-state';

/**
 * Undo and Redo each come once they can first act, and then keep their place, dim while they
 * cannot: taken away again, the tool above would slide under a finger still tapping. Undo comes with
 * the first change (or, while drawing, the first corner); Redo with the first undo.
 */
export interface UndoSlots {
  readonly undo: boolean;
  readonly redo: boolean;
}

/**
 * What the design's history has held this session: a change made (`walked`), something undone. It
 * outlives the history itself, which starts again when the design is read again (Open theirs).
 */
export interface HistorySeen {
  readonly walked: boolean;
  readonly undone: boolean;
}

export const NOTHING_SEEN: HistorySeen = { walked: false, undone: false };

/** What has been seen, with the history as it is now: nothing seen is ever forgotten. */
export function historySeenAfter(
  seen: HistorySeen,
  history: Pick<History<unknown>, 'past' | 'future' | 'undone'> | null,
): HistorySeen {
  const walked = (history?.past.length ?? 0) > 0 || (history?.future.length ?? 0) > 0;
  const undone = history?.undone === true;
  return seen.walked === (seen.walked || walked) && seen.undone === (seen.undone || undone)
    ? seen
    : { walked: seen.walked || walked, undone: seen.undone || undone };
}

/** Which of Undo and Redo have come, for the step in hand and what the history has held. */
export function undoSlotsOf(step: RoofStepState, seen: HistorySeen): UndoSlots {
  const { walked } = seen;
  const redo = seen.undone;
  if (step.kind === 'drawing') {
    // Between the faces drawn by hand, with no corner in hand, Undo and Redo walk the history.
    const between = step.faces !== undefined && step.corners.length === 0 && step.wiped === null;
    const corner = step.corners.length > 0 || step.wiped !== null || step.undone === true;
    return between ? { undo: corner || walked, redo } : { undo: corner, redo: false };
  }
  return { undo: walked || (step.kind === 'idle' && Boolean(step.left)), redo };
}
