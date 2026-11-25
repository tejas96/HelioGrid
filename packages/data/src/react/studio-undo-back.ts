import {
  type History,
  handFacesDrawn,
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
  /** Roofs or the material picker is open. */
  readonly panelOpen: boolean;
  closePanel(): void;
  readonly picturesOpen: boolean;
  closePictures(): void;
  readonly sheetOpen: boolean;
  closeSheet(): void;
  readonly step: RoofStepState;
  act(event: RoofStepEvent): void;
}

/**
 * The phone's system back, as Esc is the desktop's: the top thing open closes — what the pencil
 * opened (the material picker, Roofs), the pictures, a roof's sheet, the job in
 * hand, a picked corner. `false` with nothing open:
 * the way back leaves the studio.
 */
export function studioBack(facts: StudioBackFacts): boolean {
  const { step, act } = facts;
  // An open panel is on top: the picker goes back to Roofs, Roofs closes.
  if (facts.panelOpen) facts.closePanel();
  else if (facts.picturesOpen) facts.closePictures();
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
  // Between the faces drawn by hand, with no corner in hand, they walk the history: Undo takes the
  // last face back, and drawing goes on.
  const walks = roofStep.kind === 'idle' || facesBetween(roofStep);
  const back =
    roofStep.kind === 'drawing' && !walks
      ? roofStep.corners.length > 0 || roofStep.wiped !== null
      : (roofStep.kind === 'idle' && Boolean(roofStep.left)) || (history?.past.length ?? 0) > 0;
  return { canUndo: back, canRedo: walks && (history?.future.length ?? 0) > 0 };
}

/** Drawing faces by hand, between two faces: no corner placed and none wiped to bring back. */
export function facesBetween(step: RoofStepState): boolean {
  return (
    step.kind === 'drawing' &&
    step.faces !== undefined &&
    step.corners.length === 0 &&
    step.wiped === null
  );
}

/**
 * Faces are drawn on a roof only while it is of any shape with ground left to cover: a step
 * through the history that leaves it otherwise ends the drawing.
 */
export function facesStillDrawn(document: StudioDocument, roof: number): boolean {
  const held = document.roofs[roof];
  return held?.shape?.is === 'any' && handFacesDrawn(held) !== 'whole';
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

/**
 * Undo and Redo. A height, a number, a length or a drag in hand is put back first; while drawing,
 * Undo takes the last corner off; between faces drawn by hand, and with nothing in hand, they walk
 * the design's history (`walk`).
 */
export function undoRedoMoves(args: {
  dropInHand: () => boolean;
  step: { readonly current: RoofStepState };
  act: (event: RoofStepEvent) => void;
  walk: (undone: boolean) => void;
}) {
  const { step, act, walk } = args;
  return {
    undo: () => {
      if (args.dropInHand()) return;
      const now = step.current;
      const left = now.kind === 'idle' && Boolean(now.left);
      if (facesBetween(now)) walk(true);
      else if (now.kind === 'drawing' || left) act({ kind: 'undo_corner' });
      else if (now.kind === 'sizing' || now.kind === 'dragging' || now.kind === 'typing')
        act({ kind: 'cancel' });
      else walk(true);
    },
    redo: () => {
      if (step.current.kind === 'idle' || facesBetween(step.current)) walk(false);
    },
  };
}
