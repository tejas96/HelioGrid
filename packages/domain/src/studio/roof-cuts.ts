import type { GroundPoint } from './ground';
import { type BuiltFace, type FaceCorner, type FaceEdge, riseOf } from './roof-faces';
import { type FlatShape, ringAreaM2, shapeArea, shapeOf, shared, without } from './roof-polygons';
import { type PlanPoint, ringArea } from './wavefront-lines';
import { runFront } from './wavefront-run';

/**
 * What is cut out of a roof's faces, and laid on them (`T-M05-002`, part e): an outline moved in by
 * each side's own distance (a setback line, a parapet's inner face, the walls under an overhang);
 * a lower roof cut into a higher roof's faces where they meet (a porch gable against the house, a
 * dormer); a hole cut out of the face it lies in; and faces a person draws by hand.
 */

const RADIANS = Math.PI / 180;
const FULL_TURN = 360;
/** Two places this close are one, in metres. */
const SAME_M = 1e-5;
/** A half of the ground reaches this far: past any site. */
const FAR_M = 100_000;

const planOf = (point: GroundPoint): PlanPoint => ({ x: point.east, y: point.north });

/**
 * An outline moved in, each side by its own distance in metres; a side at 0 stays where it is.
 * What is left is one ring or more — a narrow neck may part it — or none when nothing is left.
 * Rings that run anticlockwise are ground left; one that runs clockwise is a hole in it.
 */
export function movedIn(
  corners: readonly GroundPoint[],
  distances: readonly number[],
  holes: readonly {
    readonly corners: readonly GroundPoint[];
    readonly distances: readonly number[];
  }[] = [],
): GroundPoint[][] {
  const turned = ringArea(corners.map(planOf)) < 0;
  const count = corners.length;
  const outer = turned ? [...corners].reverse() : corners;
  const outerBy = outer.map((_, i) => distances[turned ? (count - 2 - i + count) % count : i] ?? 0);
  const rings = [{ corners: outer, distances: outerBy }, ...holes];
  let key = 0;
  const sides = rings.map((ring) =>
    ring.corners.map((_, i) => {
      const speed = ring.distances[i] ?? 0;
      const side = { key, phases: speed > 0 ? [{ from: 0, speed }] : [] };
      key += 1;
      return side;
    }),
  );
  const result = runFront(
    rings.map((ring) => ring.corners.map(planOf)),
    sides,
    1,
  );
  if (!result.whole) return [];
  return result.rings
    .filter((ring) => Math.abs(ringArea(ring)) > SAME_M)
    .map((ring) => ring.map((point) => ({ east: point.x, north: point.y })));
}

/** A face's plane: the height at a place is `a + b · east + c · north`. */
interface Plane {
  readonly a: number;
  readonly b: number;
  readonly c: number;
}

/** The plane through a face's corners: the three that span it widest. */
function planeOf(corners: readonly FaceCorner[]): Plane {
  const first = corners[0] as FaceCorner;
  let widest = 0;
  let pair: readonly [FaceCorner, FaceCorner] = [first, first];
  for (const second of corners) {
    for (const third of corners) {
      const cross =
        (second.east - first.east) * (third.north - first.north) -
        (second.north - first.north) * (third.east - first.east);
      if (Math.abs(cross) > Math.abs(widest)) {
        widest = cross;
        pair = [second, third];
      }
    }
  }
  if (widest === 0) return { a: first.up, b: 0, c: 0 };
  const [second, third] = pair;
  const b =
    ((second.up - first.up) * (third.north - first.north) -
      (third.up - first.up) * (second.north - first.north)) /
    widest;
  const c =
    ((third.up - first.up) * (second.east - first.east) -
      (second.up - first.up) * (third.east - first.east)) /
    widest;
  return { a: first.up - b * first.east - c * first.north, b, c };
}

const upOn = (plane: Plane, point: GroundPoint) =>
  plane.a + plane.b * point.east + plane.c * point.north;

/** How far a point lies from a segment. */
function farFrom(point: GroundPoint, from: GroundPoint, to: GroundPoint): number {
  const dx = to.east - from.east;
  const dy = to.north - from.north;
  const span = dx * dx + dy * dy;
  const along =
    span === 0 ? 0 : ((point.east - from.east) * dx + (point.north - from.north) * dy) / span;
  const share = Math.min(1, Math.max(0, along));
  return Math.hypot(point.east - from.east - dx * share, point.north - from.north - dy * share);
}

/** What an edge of a piece of a face is: the face's own edge it lies on, or a new cut. */
function kindOn(face: BuiltFace, from: GroundPoint, to: GroundPoint, cut: FaceEdge): FaceEdge {
  const middle = { east: (from.east + to.east) / 2, north: (from.north + to.north) / 2 };
  const on = face.corners.findIndex((corner, i) => {
    const next = face.corners[(i + 1) % face.corners.length] as FaceCorner;
    return farFrom(middle, corner, next) < SAME_M && farFrom(from, corner, next) < SAME_M;
  });
  return on < 0 ? cut : (face.edges[on] as FaceEdge);
}

/** A piece of a face: its own plane over a smaller ring, each new edge a cut of one kind. */
function pieceOf(face: BuiltFace, shape: FlatShape, cut: FaceEdge): BuiltFace {
  const plane = planeOf(face.corners);
  const ring = ringArea(shape.outer.map(planOf)) >= 0 ? shape.outer : [...shape.outer].reverse();
  const areaM2 = shapeArea(shape);
  const lifted = (points: readonly GroundPoint[]) =>
    points.map((point) => ({ ...point, up: upOn(plane, point) }));
  const piece: BuiltFace = {
    ...face,
    corners: lifted(ring),
    edges: ring.map((point, at) =>
      kindOn(face, point, ring[(at + 1) % ring.length] as GroundPoint, cut),
    ),
    areaM2,
    surfaceM2: areaM2 / Math.cos(face.slopeDeg * RADIANS),
  };
  const holes = [...(face.holes ?? []), ...shape.holes.map(lifted)];
  return holes.length === 0 ? piece : { ...piece, holes };
}

/** A face as a flat shape, with what is already cut out of it. */
const shapeOfFace = (face: BuiltFace): FlatShape => ({
  outer: face.corners,
  holes: face.holes ?? [],
});

/** A hole cut out of the faces it lies in: its sides are walls down from the roof. */
export function facesWithout(
  faces: readonly BuiltFace[],
  hole: readonly GroundPoint[],
): BuiltFace[] {
  return faces.flatMap((face) => {
    const left = without([shapeOfFace(face)], [shapeOf(hole)]);
    return left === null ? [face] : left.map((shape) => pieceOf(face, shape, 'wall'));
  });
}

/** The half of the ground where one plane, lifted, stands above another. */
function whereAbove(low: Plane, lift: number, high: Plane): FlatShape | 'all' | 'none' {
  const a = low.a + lift - high.a;
  const b = low.b - high.b;
  const c = low.c - high.c;
  const steep = Math.hypot(b, c);
  if (steep < SAME_M) return a > 0 ? 'all' : 'none';
  // A point on the line where the two are level, the way along it, and the way to the higher side.
  const on = { east: (-a * b) / steep ** 2, north: (-a * c) / steep ** 2 };
  const up = { east: b / steep, north: c / steep };
  const along = { east: -up.north, north: up.east };
  const at = (s: number, t: number): GroundPoint => ({
    east: on.east + along.east * s + up.east * t,
    north: on.north + along.north * s + up.north * t,
  });
  return shapeOf([at(-FAR_M, 0), at(FAR_M, 0), at(FAR_M, FAR_M), at(-FAR_M, FAR_M)]);
}

/** Where a lower face stands above a higher roof's face, inside the ground both cover. */
function winsOver(low: BuiltFace, lift: number, high: BuiltFace): FlatShape[] {
  const both = shared([shapeOfFace(low)], [shapeOfFace(high)]) ?? [];
  const above = whereAbove(planeOf(low.corners), lift, planeOf(high.corners));
  if (above === 'all' || both.length === 0) return above === 'none' ? [] : both;
  return above === 'none' ? [] : (shared(both, [above]) ?? []);
}

export interface CutRoofs {
  /** The higher roof's faces, cut back where the lower roof stands above them. */
  readonly higher: readonly BuiltFace[];
  /** The lower roof's faces: what lies beside the higher roof, and what stands above it. */
  readonly lower: readonly BuiltFace[];
}

/**
 * A lower roof cut into a higher roof where they meet: a porch gable against the house, a dormer
 * on a sloped roof. Over the ground both cover, the higher of the two surfaces is the roof, and
 * the line between them is a valley. `liftM` is how far the lower roof's low edge stands above the
 * higher roof's.
 */
export function cutInto(
  higher: readonly BuiltFace[],
  lower: readonly BuiltFace[],
  liftM: number,
): CutRoofs {
  const highShapes = higher.map(shapeOfFace);
  const cutLower = lower.flatMap((low) => {
    const beside = without([shapeOfFace(low)], highShapes) ?? [];
    const above = higher.flatMap((high) => winsOver(low, liftM, high));
    return [...beside, ...above].map((shape) => pieceOf(low, shape, 'valley'));
  });
  const cutHigher = higher.flatMap((high) => {
    const lost = lower.flatMap((low) => winsOver(low, liftM, high));
    const left = without([shapeOfFace(high)], lost);
    return left === null ? [high] : left.map((shape) => pieceOf(high, shape, 'valley'));
  });
  return { higher: cutHigher, lower: cutLower };
}

/** A face drawn by hand: its corners, its slope, and which of its sides is its low side. */
export interface HandFace {
  readonly corners: readonly GroundPoint[];
  readonly slopeDeg: number;
  readonly lowSide: number;
}

/** How far a point lies in from a face's low side, square to it. */
function inFrom(face: HandFace, point: GroundPoint): number {
  const count = face.corners.length;
  const from = face.corners[face.lowSide % count] as GroundPoint;
  const to = face.corners[(face.lowSide + 1) % count] as GroundPoint;
  const length = Math.hypot(to.east - from.east, to.north - from.north) || 1;
  const cross =
    (to.east - from.east) * (point.north - from.north) -
    (to.north - from.north) * (point.east - from.east);
  return Math.abs(cross) / length;
}

/** The height a face's low side starts at: where another face, already placed, reaches it. */
function footOf(faces: readonly HandFace[], feet: readonly number[], index: number): number {
  const face = faces[index] as HandFace;
  const count = face.corners.length;
  const ends = [face.corners[face.lowSide % count], face.corners[(face.lowSide + 1) % count]];
  let foot = 0;
  faces.forEach((other, i) => {
    if (i === index) return;
    for (const corner of other.corners) {
      const reaches = ends.some(
        (end) =>
          end !== undefined &&
          Math.hypot(end.east - corner.east, end.north - corner.north) < SAME_M,
      );
      if (reaches)
        foot = Math.max(foot, (feet[i] as number) + riseOf(other.slopeDeg) * inFrom(other, corner));
    }
  });
  return foot;
}

/**
 * Faces drawn by hand (Any shape), each rising from its own low side. A face whose low side lies
 * on another face's high edge starts at that edge's height, so the faces meet where they touch.
 */
export function handFaces(faces: readonly HandFace[]): BuiltFace[] {
  let feet = faces.map(() => 0);
  for (let round = 0; round < faces.length; round++) {
    feet = faces.map((_, i) => footOf(faces, feet, i));
  }
  return faces.map((face, i): BuiltFace => {
    const anticlockwise = ringArea(face.corners.map(planOf)) >= 0;
    const count = face.corners.length;
    const ring = anticlockwise ? face.corners : [...face.corners].reverse();
    const low = anticlockwise
      ? face.lowSide % count
      : (count - 2 - (face.lowSide % count) + count) % count;
    const from = ring[low] as GroundPoint;
    const to = ring[(low + 1) % count] as GroundPoint;
    const areaM2 = ringAreaM2(ring);
    // The face slopes down across its low side, away from its own ground.
    const downDeg =
      (Math.atan2(to.north - from.north, -(to.east - from.east)) / RADIANS + FULL_TURN) % FULL_TURN;
    return {
      side: i,
      ring: 0,
      corners: ring.map((point) => ({
        ...point,
        up: (feet[i] as number) + riseOf(face.slopeDeg) * inFrom(face, point),
      })),
      edges: ring.map((_, edge): FaceEdge => (edge === low ? 'eave' : 'hip')),
      slopeDeg: face.slopeDeg,
      downDeg,
      areaM2,
      surfaceM2: areaM2 / Math.cos(face.slopeDeg * RADIANS),
      upper: false,
    };
  });
}
