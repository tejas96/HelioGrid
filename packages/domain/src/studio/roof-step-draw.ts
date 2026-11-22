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
  // On the grid the magnet's holds go first and the whole metre last: the corner is held level or
  // square, then lands on the grid; nothing snaps it again after.
  const grid = state.grid === true && state.magnet;
  const spot = grid ? onGrid(state, draftSpot(state.corners, at, targets, true).point) : at;
  const tap = draftTap(state.corners, spot, targets, document.roofs, state.magnet && !grid);
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
export function drawing(
  magnet: boolean,
  corners: readonly GroundPoint[] = [],
  grid = false,
): RoofStepState {
  return {
    kind: 'drawing',
    corners,
    pointer: null,
    spot: null,
    refused: null,
    magnet,
    wiped: null,
    grid,
  };
}

/** The bare grid's step: a corner drawn there lands on a whole metre. */
export const GRID_STEP_M = 1;

/**
 * A side within this many degrees of a grid line follows the line: on the bare grid most roofs do,
 * and a tap a little off would tilt the side a whole metre.
 */
export const GRID_LINE_DEGREES = 10;

/**
 * Where a tap or the pointer counts on the bare grid, while the magnet is on: a side nearly along
 * a grid line follows it, then the corner lands on the nearest whole metre. Alt (the magnet off)
 * draws free, as it does on a picture.
 */
export function onGrid(
  state: Extract<RoofStepState, { kind: 'drawing' }>,
  at: GroundPoint,
): GroundPoint {
  if (!state.grid || !state.magnet) return at;
  // `+ 0` turns -0 into 0: a corner on the line reads 0, never -0.
  const step = (v: number) => Math.round(v / GRID_STEP_M) * GRID_STEP_M + 0;
  const last = state.corners.at(-1);
  if (last === undefined) return { east: step(at.east), north: step(at.north) };
  const east = at.east - last.east;
  const north = at.north - last.north;
  const off =
    (Math.atan2(
      Math.min(Math.abs(east), Math.abs(north)),
      Math.max(Math.abs(east), Math.abs(north)),
    ) *
      180) /
    Math.PI;
  const along = off <= GRID_LINE_DEGREES;
  const level = Math.abs(east) >= Math.abs(north);
  return {
    east: along && !level ? last.east : step(at.east),
    north: along && level ? last.north : step(at.north),
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
  const left: DraftLeft = {
    corners: state.corners,
    magnet: state.magnet,
    grid: state.grid ?? false,
  };
  return stay({ kind: 'idle', roof: null, picked: null, said: null, left });
}

/** Undo while drawing, or just after stopping: the last corner goes, or what was wiped comes back. */
export function cornerUndone(state: RoofStepState): RoofStepOutcome {
  if (state.kind === 'idle' && state.left)
    return stay(drawing(state.left.magnet, state.left.corners, state.left.grid ?? false));
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
  const spot = draftSpot(state.corners, at, targets, state.magnet);
  // On the grid the held spot then lands on the whole metre, as the tap will.
  return state.grid === true && state.magnet ? { ...spot, point: onGrid(state, spot.point) } : spot;
}
