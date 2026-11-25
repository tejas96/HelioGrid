import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { type DragResult, type EditRefusal, faultOf, roofAt, type TurnResult } from './roof-check';
import { roofWithItsParts } from './roof-kind';
import { between, cornerAfter, roofMiddle } from './roof-shape';
import {
  type Guide,
  guideOf,
  SNAP_M,
  SNAP_SOFT_REACHES,
  type SnapTargets,
  snapTargetsOf,
} from './roof-snap';
import {
  heldOn,
  holdAt,
  lineCross,
  linesCross,
  type SnapLine,
  wallLinesOf,
} from './roof-snap-lines';

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

/** A stored corner is kept to the centimetre (E032): the stored design stays small at the cap. */
const CM = 100;
const toCentimetre = (corner: GroundPoint): GroundPoint => ({
  east: Math.round(corner.east * CM) / CM,
  north: Math.round(corner.north * CM) / CM,
});

/** A roof as it is stored: its corners, and the faces drawn on it, kept to the centimetre. */
export function roofToCentimetre(roof: Roof): Roof {
  return roofPlaced(roof, toCentimetre);
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

/** A pull of the roof: how far it moves, onto what, and the line it is held on. */
interface Pull {
  readonly by: GroundPoint;
  readonly line: SnapLine;
  readonly corner: GroundPoint;
}

/** The nearest pull of any of a roof's corners onto a line, within reach. */
function pullOf(
  corners: readonly GroundPoint[],
  lines: readonly SnapLine[],
  reach: number,
): Pull | null {
  let best: (Pull & { reach: number }) | null = null;
  for (const corner of corners) {
    for (const line of lines) {
      const on = heldOn(corner, line);
      const off = between(on, corner);
      if (off > reach || (best !== null && off >= best.reach)) continue;
      best = {
        by: { east: on.east - corner.east, north: on.north - corner.north },
        line,
        corner: on,
        reach: off,
      };
    }
  }
  return best;
}

/**
 * A second pull along the first line: the roof slides on the line it is held on until one of its
 * corners meets another line that crosses it, within reach — so it sits in the corner the two make.
 */
function slideOnto(
  corners: readonly GroundPoint[],
  first: SnapLine,
  lines: readonly SnapLine[],
  reach: number,
): Pull | null {
  const way = first.guide.way;
  let best: (Pull & { reach: number }) | null = null;
  for (const line of lines) {
    if (line === first || line.only || linesCross(first, line) === null) continue;
    for (const corner of corners) {
      const slid = lineCross(corner, way, line.guide.through, line.guide.way);
      if (slid === null) continue;
      const off = between(slid, corner);
      if (off > reach || (best !== null && off >= best.reach)) continue;
      best = {
        by: { east: slid.east - corner.east, north: slid.north - corner.north },
        line,
        corner: slid,
        reach: off,
      };
    }
  }
  return best;
}

/**
 * The lines a little out of reach of the moved roof's corners, not holding it: drawn faint, so a
 * pull is never a surprise.
 */
function softNear(
  corners: readonly GroundPoint[],
  lines: readonly SnapLine[],
  holding: readonly (SnapLine | undefined)[],
  reach: number,
): Guide[] {
  return lines
    .filter((line) => !holding.includes(line))
    .filter((line) => {
      const off = Math.min(...corners.map((corner) => between(corner, heldOn(corner, line))));
      return off > reach && off <= reach * SNAP_SOFT_REACHES;
    })
    .map((line) => ({ ...line.guide, soft: true }) as const);
}

/**
 * The whole roof moved by `by` metres east and north, with what stands on it. With the magnet on
 * (`pullTo` given), a corner within reach of another roof's wall or its line past the wall's ends,
 * or of the inside face of a roof's parapet (`pullTo`), pulls the roof onto it; then it slides on
 * that line to a second wall line that crosses it, when one is within reach. Each line shows as a
 * guide.
 */
export function roofMoved(
  document: StudioDocument,
  roofIndex: number,
  by: GroundPoint,
  pullTo: SnapTargets['edges'] | null = null,
  /** How near a corner must come to pull, in metres: the screen's reach at this zoom. */
  reach: number = SNAP_M,
): DragResult {
  const roof = roofAt(document, roofIndex);
  const going = new Set(roofWithItsParts(document, roofIndex));
  const corners = roof.corners.map((c) => ({ east: c.east + by.east, north: c.north + by.north }));
  const others = snapTargetsOf(document.roofs, roofIndex);
  const lines: SnapLine[] =
    pullTo === null
      ? []
      : [
          // Wall lines only: a roof moved slides onto walls and their lines; lining it up with another
          // roof's corner is left to its corners' own drags, which keeps a move smooth at the cap.
          ...wallLinesOf(
            {
              corners: [],
              edges: others.edges.filter((edge) => !going.has(edge.owner.roof)),
            },
            // A pull and the slide after it move the roof up to a reach each: the lines that can
            // hold it, and the ones a little further that show faint.
            { points: corners, within: reach * (1 + SNAP_SOFT_REACHES) },
          ),
          ...pullTo
            .filter((edge) => !going.has(edge.owner.roof))
            .map((edge) => ({
              guide: guideOf(edge.from, {
                east: edge.to.east - edge.from.east,
                north: edge.to.north - edge.from.north,
              }),
              hold: { kind: 'inside_parapet', owner: edge.owner } as const,
              walls: [{ from: edge.from, to: edge.to, owner: edge.owner }],
              only: true as const,
            })),
        ];
  const first = pullOf(corners, lines, reach);
  const pulled =
    first === null
      ? corners
      : corners.map((c) => ({ east: c.east + first.by.east, north: c.north + first.by.north }));
  const second = first === null ? null : slideOnto(pulled, first.line, lines, reach);
  const shift = {
    east: by.east + (first?.by.east ?? 0) + (second?.by.east ?? 0),
    north: by.north + (first?.by.north ?? 0) + (second?.by.north ?? 0),
  };
  const moved = carried(document, roofIndex, (c) => ({
    east: c.east + shift.east,
    north: c.north + shift.north,
  }));
  const placed = corners.map((c) =>
    moveBy(c, { east: shift.east - by.east, north: shift.north - by.north }),
  );
  const soft = softNear(placed, lines, [first?.line, second?.line], reach);
  if (first === null) return { ...moved, snap: null, guides: soft };
  const held = holdAt(first.line, second === null ? first.corner : moveBy(first.corner, second.by));
  if (second === null) return { ...moved, snap: held, guides: [first.line.guide, ...soft] };
  return {
    ...moved,
    snap: { kind: 'cross', first: held, second: holdAt(second.line, second.corner) },
    guides: [first.line.guide, second.line.guide, ...soft],
  };
}

const moveBy = (point: GroundPoint, by: GroundPoint): GroundPoint => ({
  east: point.east + by.east,
  north: point.north + by.north,
});

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
