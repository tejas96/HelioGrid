import type { MeasurementSystem } from '../format/pack';
import { type ProvenanceTier, weakestTier } from '../format/qualified';
import { lengthHeld, type RoofEdgeTrust, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { EditRefusal } from './roof-check';
import { type DraftRefusal, draftClosesAt, draftGhost, draftTap } from './roof-draw';
import { sizingResult } from './roof-entry';
import { lengthIsFirst, onPicture } from './roof-length';
import {
  angleAt,
  between,
  cornerAfter,
  cornerAngle,
  edgeLengths,
  roofArea,
  roofMiddle,
} from './roof-shape';
import { type Guide, type Snapped, snapTargetsOf } from './roof-snap';
import { gripCorner } from './roof-step';
import { pickedRoofOf } from './roof-step-draw';
import type { CornerRef, RoofSaid, RoofStepState } from './roof-step-state';
import { roofAreaTier, scaleTierOf } from './roof-trust';

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

/** One edge as its label shows it. */
export interface EdgeView {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly metres: number;
  readonly trust: RoofEdgeTrust;
  /** No person set it — from the picture, or the market's usual size: its label reads "about". */
  readonly about: boolean;
  /** The longest length from the picture, before any is set: type it first. */
  readonly pulse: boolean;
}

/** One roof as its marks show it. */
export interface RoofMarksView {
  readonly id: string;
  readonly corners: readonly GroundPoint[];
  readonly middle: GroundPoint;
  readonly edges: readonly EdgeView[];
}

export function roofMarksOf(document: StudioDocument): readonly RoofMarksView[] {
  const first = lengthIsFirst(document);
  return document.roofs.map((roof) => {
    const lengths = edgeLengths(roof.corners);
    const longest = lengths.indexOf(Math.max(...lengths));
    // Type it first: on a picture roof, the length that will size the picture; on a typed or grid
    // roof, its longest while none of its own is set.
    const pulses = onPicture(roof) ? first : !roof.edges.some(lengthHeld);
    return {
      id: roof.id,
      corners: roof.corners,
      middle: roofMiddle(roof.corners),
      edges: lengths.map((metres, i) => ({
        from: roof.corners[i] as GroundPoint,
        to: cornerAfter(roof.corners, i),
        metres,
        trust: roof.edges[i] ?? 'traced',
        about: !lengthHeld(roof.edges[i] ?? 'traced'),
        pulse: pulses && i === longest,
      })),
    };
  });
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
  if (state.kind !== 'dragging' || state.drag.snap?.kind !== 'held') return null;
  const { centre, metres } = state.drag.snap;
  return { centre, metres };
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
  const closing = state.pointer !== null && draftClosesAt(corners, state.pointer);
  // A tap on the first corner closes the shape as drawn: the ghost is not offered under it.
  const ghost = closing ? null : draftGhost(state.corners);
  const tap =
    spot === null || closing
      ? null
      : draftTap(corners, spot.point, snapTargetsOf(document.roofs), document.roofs, state.magnet);
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
      /** The trash shows: two corners or more, which one Undo would not clear. */
      readonly canWipe: boolean;
      /** Undo has a corner to take off, or the wiped corners to bring back. */
      readonly canUndo: boolean;
    }
  /** Type the size (part c): the slim pill's Place roof; the card's view says whether it can. */
  | { readonly kind: 'typing' }
  | {
      readonly kind: 'roofs';
      /** All roofs' area, square metres, and its tier: the weakest roof's. */
      readonly area: number;
      readonly tier: ProvenanceTier;
      readonly said: RoofSaid | null;
      /** Something went wrong: the bar takes the error colour. */
      readonly bad: boolean;
      /** A length is in the box. */
      readonly sizing: boolean;
      /** The live refusal of the length in the box, or of the drag in hand. */
      readonly live: EditRefusal | null;
      /** The roof picked, which the trash deletes; `null` with none picked. */
      readonly picked: number | null;
    };

function liveRefusal(state: RoofStepState, system: MeasurementSystem): EditRefusal | null {
  if (state.kind === 'dragging') return state.drag.fault;
  if (state.kind !== 'sizing') return null;
  const result = sizingResult(state, system);
  return result.kind === 'refused' ? result.refusal : null;
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
      hint: state.corners.length === 0 && state.wiped === null,
      canWipe: state.corners.length >= 2,
      canUndo: state.corners.length > 0 || state.wiped !== null,
    };
  }
  if (state.kind === 'typing') return { kind: 'typing' };
  const shown = roofStepShown(state, document, system);
  const said = state.kind === 'idle' ? state.said : null;
  if (shown.roofs.length === 0) return { kind: 'start', noPicture, said };
  const scale = scaleTierOf(shown);
  const live = liveRefusal(state, system);
  const picked = state.kind === 'idle' ? pickedRoofOf(state, shown) : null;
  return {
    kind: 'roofs',
    area: shown.roofs.reduce((sum, roof) => sum + roofArea(roof.corners), 0),
    tier: weakestTier(shown.roofs.map((roof) => roofAreaTier(roof, scale))) ?? 'estimated',
    said,
    bad: live !== null || said?.kind === 'went_back' || said?.kind === 'refused',
    sizing: state.kind === 'sizing',
    live,
    picked,
  };
}
