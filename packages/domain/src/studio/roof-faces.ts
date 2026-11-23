import type { GroundPoint } from './ground';
import { type FaceOutline, outlineForFaces } from './roof-face-outline';
import { facesOf } from './wavefront-faces';
import { lineThrough, type PlanPoint, ringArea, type TimedPoint } from './wavefront-lines';
import { runFront } from './wavefront-run';
import type { FrontEdgeKind, FrontSide } from './wavefront-state';

/**
 * A roof's faces from its sides (`T-M05-002`, part e). Each side carries one plane: its slope, the
 * height of its eave, and whether it is an eave or a gable end. The faces are where those planes
 * meet, on any outline: a corner that points inward makes a valley, a gable end leaves a standing
 * wall, and a second slope past a break makes a mansard. Every face is flat, slopes square to its
 * eave, and meets its neighbours at one height.
 */

/** What an edge of a roof face is. A `break` is where a mansard's slope changes. */
export type FaceEdge = FrontEdgeKind;

/** How one side of the outline shapes the roof. */
export interface SideShape {
  /** A gable end: a standing wall, with no face of its own. */
  readonly gable: boolean;
  readonly slopeDeg: number;
  /** The height of the side's eave above the roof's low edge, in metres. */
  readonly eaveM: number;
  /** A second, upper slope: it starts this far in from the side, measured from above. */
  readonly upper?: { readonly slopeDeg: number; readonly breakInM: number };
}

/** A corner of a face: on the ground's plan, and its height above the roof's low edge. */
export interface FaceCorner extends GroundPoint {
  readonly up: number;
}

export interface BuiltFace {
  /** The side of the outline the face rises from: the longest of the sides on its line. */
  readonly side: number;
  /** The outline (0) or the hole (1, 2…) that side belongs to. */
  readonly ring: number;
  /** Anticlockwise from above. */
  readonly corners: readonly FaceCorner[];
  /** `edges[i]` runs from `corners[i]` to `corners[i + 1]`. */
  readonly edges: readonly FaceEdge[];
  readonly slopeDeg: number;
  /** The way the face slopes down, in degrees clockwise from north. */
  readonly downDeg: number;
  /** Its area as seen from above, and along its slope, in square metres. */
  readonly areaM2: number;
  readonly surfaceM2: number;
  /** The upper part of a mansard's or a gambrel's face. */
  readonly upper: boolean;
}

export interface BuiltRoof {
  readonly faces: readonly BuiltFace[];
  /** The roof's highest point above its low edge, in metres. */
  readonly topM: number;
}

/** A slope is built between a hair above flat and a hair under a wall. */
const SLOPE_MIN_DEG = 0.5;
const SLOPE_MAX_DEG = 89.5;
const RADIANS = Math.PI / 180;
const FULL_TURN = 360;

/** The rise of a slope for each metre in: its tangent, kept clear of flat and of a wall. */
export function riseOf(slopeDeg: number): number {
  return Math.tan(Math.min(Math.max(slopeDeg, SLOPE_MIN_DEG), SLOPE_MAX_DEG) * RADIANS);
}

/** A side as the front moves it: still until its eave's height, then in at its slope's run. */
function frontSideOf(key: number, shape: SideShape): FrontSide {
  if (shape.gable) return { key, phases: [] };
  const rise = riseOf(shape.slopeDeg);
  const lower = { from: shape.eaveM, speed: 1 / rise };
  if (shape.upper === undefined) return { key, phases: [lower] };
  const breakAt = shape.eaveM + shape.upper.breakInM * rise;
  return { key, phases: [lower, { from: breakAt, speed: 1 / riseOf(shape.upper.slopeDeg) }] };
}

const sameShape = (a: SideShape, b: SideShape) =>
  a.gable === b.gable &&
  a.slopeDeg === b.slopeDeg &&
  a.eaveM === b.eaveM &&
  a.upper?.slopeDeg === b.upper?.slopeDeg &&
  a.upper?.breakInM === b.upper?.breakInM;

/** Two sides this close to one line are on it, in metres. */
const ONE_LINE_M = 1e-4;

interface Laid {
  readonly from: PlanPoint;
  readonly to: PlanPoint;
  readonly shape: SideShape;
  /** The ring and the drawn side this side stands for. */
  readonly ring: number;
  readonly side: number;
}

/** Whether two sides lie on one line, face the same way and are shaped alike: one plane. */
function onePlane(a: Laid, b: Laid): boolean {
  const first = lineThrough(a.from, a.to);
  const second = lineThrough(b.from, b.to);
  if (first === null || second === null || !sameShape(a.shape, b.shape)) return false;
  const sameWay = first.nx * second.nx + first.ny * second.ny > 1 - ONE_LINE_M;
  return sameWay && Math.abs(first.a - second.a) < ONE_LINE_M;
}

/** Each side's key: sides of one plane share one. */
function keysOf(laid: readonly Laid[]): number[] {
  const keys: number[] = [];
  laid.forEach((side, i) => {
    const earlier = laid.findIndex((other, j) => j < i && onePlane(other, side));
    keys.push(earlier < 0 ? i : (keys[earlier] as number));
  });
  return keys;
}

function laidOf(outline: FaceOutline, shapes: readonly SideShape[], ring: number): Laid[] {
  const count = outline.points.length;
  return outline.points.map((from, i) => {
    const side = (outline.sides[i] as readonly number[])[0] as number;
    const shape = shapes[side] as SideShape;
    return { from, to: outline.points[(i + 1) % count] as PlanPoint, shape, ring, side };
  });
}

/** The compass bearing a side's face slopes down to: out across the side. */
function downOf(side: Laid): number {
  const line = lineThrough(side.from, side.to);
  if (line === null) return 0;
  const bearing = Math.atan2(-line.nx, -line.ny) / RADIANS;
  return (bearing + FULL_TURN) % FULL_TURN;
}

/** How far a point lies from a side, in metres. */
function farFrom(point: PlanPoint, side: Laid): number {
  const dx = side.to.x - side.from.x;
  const dy = side.to.y - side.from.y;
  const span = dx * dx + dy * dy;
  const along =
    span === 0 ? 0 : ((point.x - side.from.x) * dx + (point.y - side.from.y) * dy) / span;
  const share = Math.min(1, Math.max(0, along));
  return Math.hypot(point.x - side.from.x - dx * share, point.y - side.from.y - dy * share);
}

/**
 * The side a face rises from, of the sides on its plane: the one its eave lies on. Sides on one
 * line share a plane, and each still has a face of its own.
 */
function sideUnder(
  corners: readonly TimedPoint[],
  kinds: readonly FaceEdge[],
  sides: readonly Laid[],
): Laid {
  const eave = Math.max(kinds.indexOf('eave'), 0);
  const from = corners[eave] as TimedPoint;
  const to = corners[(eave + 1) % corners.length] as TimedPoint;
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  let nearest = sides[0] as Laid;
  for (const side of sides) {
    if (farFrom(middle, side) < farFrom(middle, nearest)) nearest = side;
  }
  return nearest;
}

/** One ring of a roof: its corners, and how each of its sides shapes the roof. */
export interface ShapedRing {
  readonly corners: readonly GroundPoint[];
  /** One for each side: side i runs from corner i to corner i + 1. */
  readonly sides: readonly SideShape[];
}

/**
 * The faces of a roof whose every side carries its own plane; `null` when the front could not be
 * followed to its end, so the caller keeps the roof flat. Holes are courtyards: their sides are
 * eaves too.
 */
export function facesFromSides(
  outline: ShapedRing,
  holes: readonly ShapedRing[] = [],
): BuiltRoof | null {
  const rings = [outline, ...holes];
  const cleaned = rings.map((ring, i) =>
    outlineForFaces(ring.corners, i > 0, (a, b) =>
      sameShape(ring.sides[a] as SideShape, ring.sides[b] as SideShape),
    ),
  );
  const laid = cleaned.flatMap((ring, i) => laidOf(ring, (rings[i] as ShapedRing).sides, i));
  const keys = keysOf(laid);
  let at = 0;
  const sides = cleaned.map((ring) =>
    ring.points.map(() => {
      const key = keys[at] as number;
      const side = frontSideOf(key, (laid[at] as Laid).shape);
      at += 1;
      return side;
    }),
  );
  const result = runFront(
    cleaned.map((ring) => ring.points),
    sides,
  );
  if (!result.whole) return null;
  const faces = facesOf(result).flatMap((face): BuiltFace[] => {
    const plane = result.planes[face.plane];
    if (plane === undefined || plane.speed === 0 || laid[plane.key] === undefined) return [];
    const corners = face.ring.map((node) => result.nodes[node] as TimedPoint);
    const onPlane = laid.filter((_, i) => keys[i] === plane.key);
    const side = sideUnder(corners, face.kinds, onPlane);
    const slopeDeg = Math.atan(1 / plane.speed) / RADIANS;
    const areaM2 = ringArea(corners);
    return [
      {
        side: side.side,
        ring: side.ring,
        corners: corners.map((corner) => ({ east: corner.x, north: corner.y, up: corner.t })),
        edges: face.kinds,
        slopeDeg,
        downDeg: downOf(side),
        areaM2,
        surfaceM2: areaM2 / Math.cos(slopeDeg * RADIANS),
        upper: plane.phase > 0,
      },
    ];
  });
  const topM = result.nodes.reduce((top, node) => Math.max(top, node.t), 0);
  return { faces, topM };
}
