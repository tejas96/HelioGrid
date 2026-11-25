import type { MeasurementSystem } from '../format/pack';
import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { EditRefusal } from './roof-check';
import { type DraftRefusal, draftClosesAt, draftGhost, draftTap } from './roof-draw';
import { sizingResult } from './roof-entry';
import { type FollowAlong, followAlong } from './roof-follow';
import { handFacesKept } from './roof-hand-faces';
import { angleAt, between, cornerAngle, edgeLengths, roofMiddle } from './roof-shape';
import { type Guide, SNAP_M, type SnapOwner, type Snapped } from './roof-snap';
import { gripCorner } from './roof-step';
import { drawTargetsOf, keptOnFaceRoof, pickedRoofOf } from './roof-step-draw';
import type { CornerRef, RoofSaid, RoofStepState } from './roof-step-state';

/**
 * What the roof step draws (`T-M05-002`, part b): the design or the preview of what is in hand,
 * each roof's marks, the draft while drawing, and the bottom bar. A screen draws these; it decides
 * none of them.
 */

/** The design to draw: the preview of what is in hand, or the design as it stands. */
export function roofStepShown(
  state: RoofStepState,
  document: StudioDocument,
  system: MeasurementSystem,
): StudioDocument {
  if (state.kind === 'dragging') return state.drag.document;
  if (state.kind === 'sizing') {
    const result = sizingResult(state, system);
    return result.kind === 'done' ? result.document : state.base;
  }
  return document;
}

/** The angle at the picked corner, in whole degrees, shown beside its ×; `null` with none picked. */
export function pickedAngleOf(state: RoofStepState, document: StudioDocument): number | null {
  if (state.kind !== 'idle' || state.picked === null) return null;
  const roof = document.roofs[state.picked.roof];
  return roof === undefined ? null : Math.round(cornerAngle(roof.corners, state.picked.corner));
}

/** Where a drag's tag sits: by the corner in hand, or in the middle of a roof moved or turned. */
export function dragTagAt(state: RoofStepState): GroundPoint | null {
  if (state.kind !== 'dragging') return null;
  const roof = state.drag.document.roofs[state.grip.roof];
  if (roof === undefined) return null;
  const corner = gripCorner(state.grip);
  return corner === null ? roofMiddle(roof.corners) : (roof.corners[corner] ?? null);
}

/**
 * The mark on the spot the magnet holds (`T-M05-002`, part e): a ring where two lines cross, a
 * diamond on a wall's middle — on the spot while drawing, on the corner in hand while dragging one.
 */
export function snapMarkOf(
  state: RoofStepState,
): { readonly at: GroundPoint; readonly mark: 'cross' | 'middle' } | null {
  const held =
    state.kind === 'drawing' && state.spot !== null
      ? { snap: state.spot.snap, at: state.spot.point }
      : state.kind === 'dragging' && gripCorner(state.grip) !== null
        ? { snap: state.drag.snap, at: dragTagAt(state) }
        : null;
  if (held === null || held.snap === null || held.at === null) return null;
  if (held.snap.kind === 'cross') return { at: held.at, mark: 'cross' };
  return held.snap.kind === 'middle_of' ? { at: held.at, mark: 'middle' } : null;
}

/**
 * The roof whose + dots and move and turn handles show (`T-M05-002`, part b): the one a job holds,
 * or the one picked while looking — a lone roof always is. Every roof keeps its corners.
 */
export function handlesRoofOf(state: RoofStepState, document: StudioDocument): number | null {
  if (state.kind === 'dragging') return state.grip.roof;
  if (state.kind === 'sizing') return state.roof;
  return state.kind === 'idle' ? pickedRoofOf(state, document) : null;
}

/**
 * The roof as it stood before the drag in hand, drawn dashed under it: where a move or a turn
 * started, or where a refused drag goes back to. `null` for a corner drag that is allowed.
 */
export function dragBeforeOf(state: RoofStepState): readonly GroundPoint[] | null {
  if (state.kind !== 'dragging') return null;
  const whole = state.grip.kind === 'move' || state.grip.kind === 'turn';
  if (!whole && state.drag.fault === null) return null;
  return state.base.roofs[state.grip.roof]?.corners ?? null;
}

/** The corner a drag holds — dragged, or the one a + added — or `null`. */
export function heldCornerOf(state: RoofStepState): CornerRef | null {
  if (state.kind !== 'dragging') return null;
  const corner = gripCorner(state.grip);
  return corner === null ? null : { roof: state.grip.roof, corner };
}

/** A set length a corner drag keeps: the circle the corner runs on round its other end. */
export interface HeldCircle {
  readonly centre: GroundPoint;
  readonly metres: number;
}

/** The circle of the set length a corner drag holds, or `null` when it holds none. */
export function heldCircleOf(state: RoofStepState): HeldCircle | null {
  if (state.kind !== 'dragging') return null;
  const { snap } = state.drag;
  // A typed length resting on a wall line keeps its circle in view: it still holds the corner.
  const held = snap?.kind === 'cross' ? snap.first : snap;
  if (held?.kind !== 'held') return null;
  return { centre: held.centre, metres: held.metres };
}

/** An edge of the draft, with its length. */
export interface DraftEdge {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly metres: number;
}

/** The roof being drawn as it would stand now: its corners, the ghost, the line to the pointer. */
export interface DraftView {
  readonly corners: readonly GroundPoint[];
  readonly edges: readonly DraftEdge[];
  readonly ghost: GroundPoint | null;
  readonly spot: Snapped | null;
  /** The line from the last corner to the spot under the pointer. */
  readonly stretch: DraftEdge | null;
  /** Why a corner at the spot under the pointer would be refused: its line takes the error colour. */
  readonly spotRefusal: DraftRefusal | null;
  /**
   * The angle the next corner would make at the last one, in whole degrees: shown beside the spot
   * when nothing snapped, so a wall that is truly 87° is seen to be. `null` before two corners.
   */
  readonly angle: number | null;
  readonly canClose: boolean;
  /** The pointer is within reach of the first corner and a tap closes: that dot grows and glows. */
  readonly closing: boolean;
  /** The corners Follow would add along the outline the drawing's ends stand on, drawn as a ghost. */
  readonly follow: FollowAlong | null;
}

/** The guide lines the corner in hand is held on: the spot while drawing, the corner dragged. */
export function guidesOf(state: RoofStepState): readonly Guide[] {
  if (state.kind === 'drawing') return state.spot?.guides ?? [];
  return state.kind === 'dragging' ? state.drag.guides : [];
}

function edgeOf(from: GroundPoint, to: GroundPoint): DraftEdge {
  return { from, to, metres: between(from, to) };
}

export function draftViewOf(
  state: Extract<RoofStepState, { kind: 'drawing' }>,
  document: StudioDocument,
): DraftView {
  const { spot, corners } = state;
  const last = corners.at(-1);
  const before = corners.at(-2);
  // Within reach of the first corner a tap closes: no corner is added there, so none is refused
  // and no angle is named.
  const reach = state.reach ?? SNAP_M;
  const closing = state.pointer !== null && draftClosesAt(corners, state.pointer, reach);
  // A tap on the first corner closes the shape as drawn: the ghost is not offered under it.
  const ghost = closing ? null : draftGhost(state.corners);
  const targets = drawTargetsOf(state, document);
  const tap =
    spot === null || closing
      ? null
      : // The spot is snapped already, as a tap there would be: it is checked where it stands, and
        // the magnet is not asked again on every pointer move.
        keptOnFaceRoof(state, document, draftTap(corners, spot.point, targets, false, reach));
  return {
    corners,
    edges: corners.slice(1).map((corner, i) => edgeOf(corners[i] as GroundPoint, corner)),
    ghost,
    spot,
    stretch: spot === null || last === undefined ? null : edgeOf(last, spot.point),
    spotRefusal: tap?.kind === 'refused' ? tap.refusal : null,
    angle:
      spot === null || closing || last === undefined || before === undefined
        ? null
        : Math.round(angleAt(before, last, spot.point)),
    canClose: corners.length + (ghost === null ? 0 : 1) >= 3,
    closing,
    follow: closing ? null : followAlong(corners, targets),
  };
}

/** The one bottom bar of the roof step: what it says and which acts it offers. */
export type RoofBar =
  | {
      readonly kind: 'start';
      readonly noPicture: boolean;
      /** What was said, when the last roof was just deleted: Undo brings it back. */
      readonly said: RoofSaid | null;
    }
  | {
      readonly kind: 'drawing';
      readonly corners: number;
      /** The last edge placed, in metres; `null` before the second corner. */
      readonly lastEdge: number | null;
      readonly ghost: boolean;
      readonly refused: DraftRefusal | null;
      readonly canClose: boolean;
      /** The magnet guides the next corner. */
      readonly magnet: boolean;
      /** No corner yet: the one line that says what to do shows. */
      readonly hint: boolean;
      /** A face drawn by hand (Any shape): its number on its roof, which the pill names. */
      readonly face: number | null;
      /** The trash shows: two corners or more, which one Undo would not clear. */
      readonly canWipe: boolean;
      /** Undo has a corner to take off, or the wiped corners to bring back. */
      readonly canUndo: boolean;
      /** Follow is offered, naming the roof (or face) it follows: the slim pill's second act. */
      readonly follow: SnapOwner | null;
    }
  /** Type the size (part c): the slim pill's Place roof; the card's view says whether it can. */
  | { readonly kind: 'typing' }
  | {
      readonly kind: 'roofs';
      readonly said: RoofSaid | null;
      /** Something went wrong: the bar takes the error colour. */
      readonly bad: boolean;
      /** A length is in the box. */
      readonly sizing: boolean;
      /** The live refusal of the length in the box, or of the drag in hand. */
      readonly live: EditRefusal | null;
      /** The set length a `held_length` refusal holds to, in metres, named by it; else `null`. */
      readonly liveHeld: number | null;
      /** The roof picked, which the trash deletes; `null` with none picked. */
      readonly picked: number | null;
    };

function liveRefusal(
  state: RoofStepState,
  system: MeasurementSystem,
): { readonly refusal: EditRefusal | null; readonly held: number | null } {
  if (state.kind === 'dragging') return { refusal: state.drag.fault, held: null };
  if (state.kind !== 'sizing') return { refusal: null, held: null };
  const result = sizingResult(state, system);
  if (result.kind !== 'refused') return { refusal: null, held: null };
  const edge = result.refusal === 'held_length' ? result.edge : undefined;
  const corners = state.base.roofs[state.roof]?.corners ?? [];
  const held = edge === undefined ? null : (edgeLengths(corners)[edge] ?? null);
  return { refusal: result.refusal, held };
}

/** The number of the face being drawn on its roof: one past the faces it keeps. */
function faceNumberOf(
  state: Extract<RoofStepState, { kind: 'drawing' }>,
  document: StudioDocument,
): number | null {
  if (state.faces === undefined) return null;
  const roof = document.roofs[state.faces];
  return roof === undefined ? null : handFacesKept(roof).length + 1;
}

export function roofBarOf(
  state: RoofStepState,
  document: StudioDocument,
  noPicture: boolean,
  system: MeasurementSystem,
): RoofBar {
  if (state.kind === 'drawing') {
    const view = draftViewOf(state, document);
    const last = view.edges.at(-1);
    return {
      kind: 'drawing',
      corners: state.corners.length,
      lastEdge: last === undefined ? null : last.metres,
      ghost: view.ghost !== null,
      refused: state.refused ?? view.spotRefusal,
      canClose: view.canClose,
      magnet: state.magnet,
      // A face has no size to type: the hint and its Type the size are the roof's alone.
      hint: state.faces === undefined && state.corners.length === 0 && state.wiped === null,
      face: faceNumberOf(state, document),
      canWipe: state.corners.length >= 2,
      canUndo: state.corners.length > 0 || state.wiped !== null,
      follow: view.follow?.owner ?? null,
    };
  }
  if (state.kind === 'typing') return { kind: 'typing' };
  const shown = roofStepShown(state, document, system);
  const said = state.kind === 'idle' ? state.said : null;
  if (shown.roofs.length === 0) return { kind: 'start', noPicture, said };
  const { refusal: live, held: liveHeld } = liveRefusal(state, system);
  const picked = state.kind === 'idle' ? pickedRoofOf(state, shown) : null;
  return {
    kind: 'roofs',
    said,
    bad: live !== null || said?.kind === 'went_back' || said?.kind === 'refused',
    sizing: state.kind === 'sizing',
    live,
    liveHeld,
    picked,
  };
}

export { type EdgeView, type RoofMarksView, roofMarksOf } from './roof-marks-view';
