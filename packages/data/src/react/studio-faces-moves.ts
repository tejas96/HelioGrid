import {
  type GroundBox,
  type History,
  handFacesDrawn,
  historyAfter,
  type RoofShape,
  type RoofStepEvent,
  type RoofStepState,
  roofsBox,
  type StudioDocument,
} from '@heliogrid/domain';
import { handFacesCleared } from '@heliogrid/domain/studio-kernel';
import type { RefObject } from 'react';
import { facesStillDrawn, historyStep } from './studio-undo-back';

/**
 * An Any-shape roof's faces drawn by hand in the studio (`T-M05-002`, part e, E082, board 5.10):
 * Any shape picked, or the Faces row, starts drawing in the top view; Undo and Redo between faces
 * walk the history, and drawing goes on while the roof still has ground to cover.
 */
export function studioFacesMoves(args: {
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  step: { readonly current: RoofStepState };
  act: (event: RoofStepEvent) => void;
  /** The roof's sheet kept and closed; `false` when a height it holds is refused and it stays. */
  closeSheet: () => boolean;
  /** Faces are drawn in the top view: the camera flies there. */
  toTop: () => void;
  startFaces: (roof: number) => void;
  /** The sheet's own pick of a shape, and the sheet open, on its roof. */
  pickShape: (shape: RoofShape) => void;
  sheet: { readonly roof: number } | null;
}) {
  const { latest, change, editable, step, act } = args;
  /** A roof that stands in its faces is drawn again: its faces go first, as one change. */
  const drawFaces = (index: number) => {
    if (!args.closeSheet()) return;
    const at = latest.current;
    const held = at?.present.roofs[index];
    if (!editable || at === null || held === undefined) return;
    if (handFacesDrawn(held) === 'whole') {
      change(historyAfter(at, handFacesCleared(at.present, index)));
    }
    args.toTop();
    args.startFaces(index);
  };
  /** Undo or Redo through the history; between faces, drawing goes on while it may. */
  const walk = (undone: boolean) => {
    const at = latest.current;
    if (at === null) return;
    const now = step.current;
    const on = historyStep(at, undone);
    act({ kind: 'history', undone, change: on.change });
    change(on.next);
    const faces = now.kind === 'drawing' ? now.faces : undefined;
    if (faces !== undefined && !facesStillDrawn(on.next.present, faces)) act({ kind: 'cancel' });
    // Undo just after the last face covered the roof takes it back, and drawing goes on.
    const last = now.kind === 'idle' && now.said?.kind === 'faces_drawn' ? now.said.roof : null;
    if (undone && last !== null && facesStillDrawn(on.next.present, last)) {
      args.toTop();
      args.startFaces(last);
    }
  };
  return {
    drawFaces,
    walk,
    /** Any shape picked: its faces are drawn by hand at once, in the top view. */
    pickShape: (shape: RoofShape) => {
      args.pickShape(shape);
      const open = args.sheet?.roof ?? null;
      const held = open === null ? undefined : latest.current?.present.roofs[open];
      if (shape !== 'any' || open === null || held === undefined) return;
      if (handFacesDrawn(held) !== 'whole') drawFaces(open);
    },
  };
}

/** While a roof's faces are drawn, the camera frames that roof alone; else what it framed. */
export function framedForFaces(
  fit: GroundBox | null,
  document: StudioDocument | null,
  step: RoofStepState,
): GroundBox | null {
  const roof = step.kind === 'drawing' && step.faces !== undefined ? step.faces : null;
  const held = roof === null ? undefined : document?.roofs[roof];
  return held === undefined ? fit : roofsBox([held]);
}
