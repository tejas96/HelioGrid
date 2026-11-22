import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofUnder } from './roof-check';
import { draftClose, draftClosesAt, draftTap } from './roof-draw';
import { draftSpot, type Snapped, type SnapTargets, snapTargetsOf } from './roof-snap';
import {
  type DraftLeft,
  idle,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';

/**
 * The roof step's drawing (`T-M05-002`, part b): a corner tapped, the shape closed, a drawing
 * stopped and taken up again by Undo, and a roof just closed taken back by Redraw. The reducer
 * (`roof-step.ts`) routes each event here.
 */

/** The roof a state holds, kept picked when it ends: the one dragged, sized or picked. */
export function roofHeld(state: RoofStepState): number | null {
  if (state.kind === 'dragging') return state.grip.roof;
  if (state.kind === 'sizing' || state.kind === 'idle') return state.roof;
  return null;
}

export function tapped(
  state: RoofStepState,
  at: GroundPoint,
  document: StudioDocument,
): RoofStepOutcome {
  if (state.kind === 'idle' && state.picked !== null) return stay(idle(null, state.roof));
  // A tap inside a roof picks it; on open ground, none.
  if (state.kind === 'idle') return stay(idle(null, roofUnder(document.roofs, at)));
  if (state.kind !== 'drawing') return stay(state);
  const targets = snapTargetsOf(document.roofs);
  const tap = draftTap(state.corners, at, targets, document.roofs, state.magnet);
  if (tap.kind === 'same') return stay(state);
  if (tap.kind === 'refused') return stay({ ...state, refused: tap.refusal });
  // A new corner after the trash: the wiped corners are behind it, and Undo no longer brings them.
  return stay({
    ...state,
    corners: tap.corners,
    pointer: null,
    spot: null,
    refused: null,
    wiped: null,
  });
}

/** A fresh drawing: no corners yet, the magnet as picked. */
export function drawing(magnet: boolean, corners: readonly GroundPoint[] = []): RoofStepState {
  return {
    kind: 'drawing',
    corners,
    pointer: null,
    spot: null,
    refused: null,
    magnet,
    wiped: null,
  };
}

/** The design without the roof at `index`; with no roof left, no picture is kept as drawn on. */
export function withoutRoof(document: StudioDocument, index: number): StudioDocument {
  const roofs = document.roofs.filter((_, i) => i !== index);
  return { ...document, roofs, drawnOn: roofs.length === 0 ? null : document.drawnOn };
}

/** Whether the roof just closed is still on the bar's Redraw · Done ask. */
export function justClosed(state: RoofStepState, document: StudioDocument): boolean {
  return (
    state.kind === 'idle' &&
    state.said?.kind === 'closed' &&
    state.roof !== null &&
    state.roof === document.roofs.length - 1
  );
}

/** Stop drawing: the corners go, and the one Undo after takes them up again. */
export function stopped(state: RoofStepState): RoofStepOutcome {
  if (state.kind !== 'drawing' || state.corners.length === 0) {
    return stay(idle(null, roofHeld(state)));
  }
  const left: DraftLeft = { corners: state.corners, magnet: state.magnet };
  return stay({ kind: 'idle', roof: null, picked: null, said: null, left });
}

/** Undo while drawing, or just after stopping: the last corner goes, or what was wiped comes back. */
export function cornerUndone(state: RoofStepState): RoofStepOutcome {
  if (state.kind === 'idle' && state.left)
    return stay(drawing(state.left.magnet, state.left.corners));
  if (state.kind !== 'drawing') return stay(state);
  if (state.corners.length === 0 && state.wiped !== null) {
    return stay({ ...state, corners: state.wiped, wiped: null, refused: null });
  }
  return stay({ ...state, corners: state.corners.slice(0, -1), refused: null });
}

export function closed(
  state: RoofStepState,
  event: Extract<RoofStepEvent, { kind: 'close' }>,
  document: StudioDocument,
): RoofStepOutcome {
  if (state.kind !== 'drawing') return stay(state);
  const close = draftClose(state.corners, document.roofs, event.id, event.tracedOn);
  if (close.kind === 'refused') return stay({ ...state, refused: close.refusal });
  // The first roof keeps the picture it was drawn on (M04-10).
  const first = document.roofs.length === 0 && document.drawnOn === null;
  return {
    state: idle({ kind: 'closed' }, document.roofs.length),
    commit: {
      ...document,
      roofs: [...document.roofs, close.roof],
      drawnOn: first ? event.stamp : document.drawnOn,
    },
  };
}

/**
 * The roof picked while looking: the one tapped or last changed, or the only one. Its handles show,
 * and the bar's trash deletes it. A roof Undo or another's save took away is picked no more.
 */
export function pickedRoofOf(
  state: Extract<RoofStepState, { kind: 'idle' }>,
  document: StudioDocument,
): number | null {
  const picked = state.roof !== null && state.roof < document.roofs.length ? state.roof : null;
  return picked ?? (document.roofs.length === 1 ? 0 : null);
}

/**
 * The spot under the pointer while drawing. Within reach of the first corner, closing wins over
 * every snap: the spot is that corner, with no guide.
 */
export function spotAt(
  state: Extract<RoofStepState, { kind: 'drawing' }>,
  at: GroundPoint | null,
  targets: SnapTargets,
): Snapped | null {
  if (at === null) return null;
  const first = state.corners[0];
  if (first !== undefined && draftClosesAt(state.corners, at)) {
    return { point: first, snap: null, guides: [] };
  }
  return draftSpot(state.corners, at, targets, state.magnet);
}
