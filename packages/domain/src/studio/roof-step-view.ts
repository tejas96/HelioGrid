import type { MeasurementSystem } from '../format/pack';
import { type ProvenanceTier, weakestTier } from '../format/qualified';
import type { RoofEdgeTrust, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { EditRefusal } from './roof-check';
import { type DraftRefusal, draftGhost, draftTap, type Snapped, snapTargetsOf } from './roof-draw';
import { sizingResult } from './roof-entry';
import { lengthIsFirst } from './roof-length';
import { between, cornerAfter, cornerAngle, edgeLengths, roofArea, roofMiddle } from './roof-shape';
import { gripCorner } from './roof-step';
import type { RoofSaid, RoofStepState } from './roof-step-state';
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
    return {
      id: roof.id,
      corners: roof.corners,
      middle: roofMiddle(roof.corners),
      edges: lengths.map((metres, i) => ({
        from: roof.corners[i] as GroundPoint,
        to: cornerAfter(roof.corners, i),
        metres,
        trust: roof.edges[i] ?? 'traced',
        pulse: first && i === longest,
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
  readonly canClose: boolean;
}

function edgeOf(from: GroundPoint, to: GroundPoint): DraftEdge {
  return { from, to, metres: between(from, to) };
}

export function draftViewOf(
  state: Extract<RoofStepState, { kind: 'drawing' }>,
  document: StudioDocument,
): DraftView {
  const ghost = draftGhost(state.corners);
  const { spot, corners } = state;
  const last = corners.at(-1);
  const tap =
    spot === null
      ? null
      : draftTap(corners, spot.point, snapTargetsOf(document.roofs), document.roofs);
  return {
    corners,
    edges: corners.slice(1).map((corner, i) => edgeOf(corners[i] as GroundPoint, corner)),
    ghost,
    spot,
    stretch: spot === null || last === undefined ? null : edgeOf(last, spot.point),
    spotRefusal: tap?.kind === 'refused' ? tap.refusal : null,
    canClose: corners.length + (ghost === null ? 0 : 1) >= 3,
  };
}

/** The one bottom bar of the roof step: what it says and which acts it offers. */
export type RoofBar =
  | { readonly kind: 'start'; readonly noPicture: boolean }
  | {
      readonly kind: 'drawing';
      readonly corners: number;
      /** The last edge placed, in metres; `null` before the second corner. */
      readonly lastEdge: number | null;
      readonly ghost: boolean;
      readonly refused: DraftRefusal | null;
      readonly canClose: boolean;
    }
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
    };
  }
  const shown = roofStepShown(state, document, system);
  if (shown.roofs.length === 0) return { kind: 'start', noPicture };
  const scale = scaleTierOf(shown);
  const live = liveRefusal(state, system);
  const said = state.kind === 'idle' ? state.said : null;
  return {
    kind: 'roofs',
    area: shown.roofs.reduce((sum, roof) => sum + roofArea(roof.corners), 0),
    tier: weakestTier(shown.roofs.map((roof) => roofAreaTier(roof, scale))) ?? 'estimated',
    said,
    bad: live !== null || said?.kind === 'went_back' || said?.kind === 'refused',
    sizing: state.kind === 'sizing',
    live,
  };
}
