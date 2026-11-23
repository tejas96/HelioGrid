import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { type DragResult, type EditRefusal, faultOf, roofAt, type TurnResult } from './roof-check';
import { roofWithItsParts } from './roof-kind';
import { between, cornerAfter, nearestOnSegment, roofMiddle } from './roof-shape';
import {
  type Guide,
  guideOf,
  type RoofSnap,
  SNAP_M,
  type SnapTargets,
  snapTargetsOf,
} from './roof-snap';

/**
 * Moving and turning a whole roof once it stands (`T-M05-002`, part b): the move and turn handles,
 * and their arrow keys. A turn lines up with another roof's edge, which shows as a guide.
 */

/** Within this many degrees, a turned roof lines up with another roof's edge. */
export const TURN_SNAP_DEGREES = 3;
/** One arrow key on a move handle moves the roof this far, in metres. */
export const KEY_MOVE_M = 0.1;
/** One arrow key on a turn handle turns the roof this far, in degrees. */
export const KEY_TURN_DEGREES = 1;

/** A roof's corners sent through `place`, and the faces drawn on it with them. */
export function roofPlaced(roof: Roof, place: (corner: GroundPoint) => GroundPoint): Roof {
  const faces = roof.shape?.faces;
  const shape =
    roof.shape === undefined || faces === undefined
      ? roof.shape
      : {
          ...roof.shape,
          faces: faces.map((face) => ({ ...face, corners: face.corners.map(place) })),
        };
  return { ...roof, corners: roof.corners.map(place), ...(shape === undefined ? {} : { shape }) };
}

/**
 * Roof `roofIndex` and what goes with it — what stands on it or is part of it — each corner sent
 * through `place`: the design after, and the first thing wrong with any roof that moved.
 */
function carried(
  document: StudioDocument,
  roofIndex: number,
  place: (corner: GroundPoint) => GroundPoint,
): { readonly document: StudioDocument; readonly fault: EditRefusal | null } {
  const going = roofWithItsParts(document, roofIndex);
  const roofs = document.roofs.map((roof, i) =>
    going.includes(i) ? roofPlaced(roof, place) : roof,
  );
  const faults = going.map((i) => faultOf(roofs[i]?.corners ?? []));
  return {
    document: { ...document, roofs },
    fault: faults.find((fault) => fault !== null) ?? null,
  };
}

/** The nearest pull of any of a roof's corners onto a line: how far it moves, and onto what. */
function pullOf(
  corners: readonly GroundPoint[],
  lines: readonly {
    readonly from: GroundPoint;
    readonly to: GroundPoint;
    readonly snap: RoofSnap;
  }[],
) {
  let best: { by: GroundPoint; snap: RoofSnap; guide: Guide; reach: number } | null = null;
  for (const corner of corners) {
    for (const line of lines) {
      const on = nearestOnSegment(corner, line.from, line.to);
      const reach = between(on, corner);
      if (reach > SNAP_M || (best !== null && reach >= best.reach)) continue;
      const way = { east: line.to.east - line.from.east, north: line.to.north - line.from.north };
      best = {
        by: { east: on.east - corner.east, north: on.north - corner.north },
        snap: line.snap,
        guide: guideOf(line.from, way),
        reach,
      };
    }
  }
  return best;
}

/**
 * The whole roof moved by `by` metres east and north, with what stands on it. With the magnet on
 * (`pullTo` given), a corner within reach of another roof's edge, or of the inside face of a
 * roof's parapet (`pullTo`), pulls the roof onto it, and the line shows as a guide.
 */
export function roofMoved(
  document: StudioDocument,
  roofIndex: number,
  by: GroundPoint,
  pullTo: SnapTargets['edges'] | null = null,
): DragResult {
  const roof = roofAt(document, roofIndex);
  const going = new Set(roofWithItsParts(document, roofIndex));
  const corners = roof.corners.map((c) => ({ east: c.east + by.east, north: c.north + by.north }));
  const lines =
    pullTo === null
      ? []
      : [
          ...snapTargetsOf(document.roofs, roofIndex).edges.map((edge) => ({
            ...edge,
            snap: { kind: 'edge_of', owner: edge.owner } as const,
          })),
          ...pullTo.map((edge) => ({
            ...edge,
            snap: { kind: 'inside_parapet', owner: edge.owner } as const,
          })),
        ].filter((line) => !going.has(line.owner.roof));
  const pulled = pullOf(corners, lines);
  const shift = {
    east: by.east + (pulled?.by.east ?? 0),
    north: by.north + (pulled?.by.north ?? 0),
  };
  const moved = carried(document, roofIndex, (c) => ({
    east: c.east + shift.east,
    north: c.north + shift.north,
  }));
  return {
    ...moved,
    snap: pulled?.snap ?? null,
    guides: pulled === null ? [] : [pulled.guide],
  };
}

/** The difference between two directions of lines, in degrees, folded into −90 to 90. */
function lineTurn(from: number, to: number): number {
  let turn = (to - from) % 180;
  if (turn > 90) turn -= 180;
  if (turn < -90) turn += 180;
  return turn;
}

function directionOf(a: GroundPoint, b: GroundPoint): number {
  return (Math.atan2(b.north - a.north, b.east - a.east) * 180) / Math.PI;
}

/**
 * The roof turned `degrees` anticlockwise about its middle, with what stands on it. With the magnet on, within
 * `TURN_SNAP_DEGREES` of lining an edge up with another roof's edge, it lines up.
 */
export function roofTurned(
  document: StudioDocument,
  roofIndex: number,
  degrees: number,
  magnet: boolean,
): TurnResult {
  const roof = roofAt(document, roofIndex);
  const edges = magnet ? snapTargetsOf(document.roofs, roofIndex).edges : [];
  const targets = edges.map((e) => directionOf(e.from, e.to));
  let applied = degrees;
  let lined: number | null = null;
  let nearest = TURN_SNAP_DEGREES + 1e-9;
  roof.corners.forEach((corner, i) => {
    const own = directionOf(corner, cornerAfter(roof.corners, i)) + degrees;
    targets.forEach((target, t) => {
      const off = lineTurn(own, target);
      if (Math.abs(off) <= nearest) {
        nearest = Math.abs(off);
        applied = degrees + off;
        lined = t;
      }
    });
  });
  // The edge it lines up with shows as a guide, as a corner's hold does.
  const edge = lined === null ? undefined : edges[lined];
  const guides: Guide[] =
    edge === undefined
      ? []
      : [
          guideOf(edge.from, {
            east: edge.to.east - edge.from.east,
            north: edge.to.north - edge.from.north,
          }),
        ];
  const middle = roofMiddle(roof.corners);
  const r = (applied * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  // What stands on the roof turns with it, about the roof's own middle.
  const turned = carried(document, roofIndex, (c) => ({
    east: middle.east + (c.east - middle.east) * cos - (c.north - middle.north) * sin,
    north: middle.north + (c.east - middle.east) * sin + (c.north - middle.north) * cos,
  }));
  return {
    ...turned,
    snap: null,
    guides,
    degrees: applied,
    snapped: lined !== null,
  };
}
