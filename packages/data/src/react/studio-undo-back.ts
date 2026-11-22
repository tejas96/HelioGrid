import {
  type History,
  historyRedone,
  historyUndone,
  type RoofStepEvent,
  type RoofStepState,
  type StudioChange,
  type StudioDocument,
  studioChangeOf,
} from '@heliogrid/domain';

/** What stepping back does in the studio: Undo and Redo, and the phone's system back. */

/** What is open over the studio, and the acts that close it, for the phone's system back. */
export interface StudioBackFacts {
  readonly picturesOpen: boolean;
  closePictures(): void;
  readonly sheetOpen: boolean;
  closeSheet(): void;
  readonly step: RoofStepState;
  act(event: RoofStepEvent): void;
}

/**
 * The phone's system back, as Esc is the desktop's: the top thing open closes — the pictures, a
 * roof's sheet, the job in hand, a picked corner. `false` with nothing open:
 * the way back leaves the studio.
 */
export function studioBack(facts: StudioBackFacts): boolean {
  const { step, act } = facts;
  if (facts.picturesOpen) facts.closePictures();
  // A height the sheet refuses keeps it open, as Done does.
  else if (facts.sheetOpen) facts.closeSheet();
  else if (step.kind !== 'idle') act({ kind: 'cancel' });
  else if (step.picked !== null) act({ kind: 'pick_corner', corner: null });
  else return false;
  return true;
}

/**
 * What Undo and Redo can do now: while drawing, Undo takes the last corner off; with nothing in
 * hand, they walk the design's history; Redo waits while a roof is drawn, sized or dragged.
 */
export function undoRedoOf(
  editable: boolean,
  roofStep: RoofStepState,
  history: History<StudioDocument> | null,
): { canUndo: boolean; canRedo: boolean } {
  // The size card's rectangle is not in the history: Undo has nothing to take while it is open.
  if (!editable || roofStep.kind === 'typing') return { canUndo: false, canRedo: false };
  // While drawing, Undo takes a corner off or brings wiped ones back; just after a stop, it takes
  // the stopped drawing up again.
  const back =
    roofStep.kind === 'drawing'
      ? roofStep.corners.length > 0 || roofStep.wiped !== null
      : (roofStep.kind === 'idle' && Boolean(roofStep.left)) || (history?.past.length ?? 0) > 0;
  return { canUndo: back, canRedo: roofStep.kind === 'idle' && (history?.future.length ?? 0) > 0 };
}

/** One step back or on through the design's history, and what that step changes, for the bar. */
export function historyStep(
  history: History<StudioDocument>,
  undone: boolean,
): { readonly next: History<StudioDocument>; readonly change: StudioChange } {
  const next = undone ? historyUndone(history) : historyRedone(history);
  // The change named is the one as it was made: Undo takes back the step into the present.
  const change = undone
    ? studioChangeOf(next.present, history.present)
    : studioChangeOf(history.present, next.present);
  return { next, change };
}
