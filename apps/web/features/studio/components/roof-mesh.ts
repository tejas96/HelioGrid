import type { GroundPoint, ScenePrism } from '@heliogrid/domain';
import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2, Vector3 } from 'three';

/**
 * The roofs' triangles (`T-M05-002`, part e): the shapes the kernel's model is drawn in — a cap
 * over an outline, a wall under an edge, a sloped face — each laid on its texture by a place
 * function: the ground picture's east and north, or a material look's own pattern. Which part goes
 * in which mesh is `roof-dressed-mesh.ts`. East is x, up is y, north is −z.
 */

/** Lengths this short, and products this small, are none: a line has no direction, a face no lean. */
const NONE = 1e-6;
const NONE_SQUARED = NONE * NONE;

export interface Triangles {
  readonly positions: number[];
  readonly normals: number[];
  readonly uvs: number[];
}

export const empty = (): Triangles => ({ positions: [], normals: [], uvs: [] });

export interface Vertex {
  readonly east: number;
  readonly north: number;
  readonly up: number;
}

/** Where a corner lies on its texture: the picture's east and north, or a look's own pattern. */
export type Place = (at: Vertex) => readonly [number, number];
export const ON_GROUND: Place = (at) => [at.east, at.north];

/** One triangle, with one normal for its three corners: flat walls and flat faces. */
export function triangle(
  into: Triangles,
  a: Vertex,
  b: Vertex,
  c: Vertex,
  normal: readonly number[],
  place: Place = ON_GROUND,
) {
  for (const at of [a, b, c]) {
    into.positions.push(at.east, at.up, -at.north);
    into.normals.push(normal[0] ?? 0, normal[1] ?? 0, normal[2] ?? 0);
    into.uvs.push(...place(at));
  }
}

/** Twice a ring's area on the plan: positive when it runs anticlockwise seen from above. */
function turn(ring: readonly GroundPoint[]): number {
  return ring.reduce((sum, at, i) => {
    const next = ring[(i + 1) % ring.length] as GroundPoint;
    return sum + at.east * next.north - next.east * at.north;
  }, 0);
}

export const anticlockwise = (ring: readonly GroundPoint[]) =>
  turn(ring) >= 0 ? ring : [...ring].reverse();
export const clockwise = (ring: readonly GroundPoint[]) =>
  turn(ring) < 0 ? ring : [...ring].reverse();

/** A ring of the model's points turned to run anticlockwise seen from above, or clockwise. */
export function upRing<P extends GroundPoint>(ring: readonly P[], left: boolean): readonly P[] {
  return turn(ring) >= 0 === left ? ring : [...ring].reverse();
}

/** How far a solid's corner rises with the face it stands on; 0 for a solid that stands level. */
export type Rise = (corner: GroundPoint) => number;
export const LEVEL: Rise = () => 0;

export function riseOf(prism: ScenePrism): Rise {
  const { rise } = prism;
  if (rise === undefined) return LEVEL;
  const at = new Map(prism.outer.map((corner, i) => [corner, rise[i] ?? 0]));
  return (corner) => at.get(corner) ?? 0;
}

/** A triangle's normal, from its corners: a cap that rises with a face leans with it. */
function normalOf(a: Vertex, b: Vertex, c: Vertex): number[] {
  // In the scene east is x, up is y and north is −z.
  const [ux, uy, uz] = [b.east - a.east, b.up - a.up, a.north - b.north];
  const [vx, vy, vz] = [c.east - a.east, c.up - a.up, a.north - c.north];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const length = Math.hypot(...n) || 1;
  return n.map((each) => each / length);
}

/** A cap over an outline with holes, at one height and its corners' rise, facing up or down. */
export function cap(
  into: Triangles,
  outer: readonly GroundPoint[],
  holes: readonly (readonly GroundPoint[])[],
  up: number,
  facing: 1 | -1,
  rise: Rise = LEVEL,
  place: Place = ON_GROUND,
) {
  const points = [...outer, ...holes.flat()];
  const found = ShapeUtils.triangulateShape(
    outer.map((at) => new Vector2(at.east, at.north)),
    holes.map((hole) => hole.map((at) => new Vector2(at.east, at.north))),
  );
  for (const [i, j, k] of found) {
    const [a, b, c] = [points[i ?? 0], points[j ?? 0], points[k ?? 0]] as GroundPoint[];
    if (a === undefined || b === undefined || c === undefined) continue;
    // Seen from the side it faces, a triangle runs anticlockwise.
    const left = (b.east - a.east) * (c.north - a.north) - (b.north - a.north) * (c.east - a.east);
    const [second, third] = left > 0 === facing > 0 ? [b, c] : [c, b];
    const corners = [a, second, third].map((at) => ({ ...at, up: up + rise(at) })) as [
      Vertex,
      Vertex,
      Vertex,
    ];
    const normal = rise === LEVEL ? [0, facing, 0] : normalOf(...corners);
    triangle(into, ...corners, normal, place);
  }
}

/** The upright wall under one edge of a ring, its outside to the right of the way the ring runs. */
export function wall(
  into: Triangles,
  from: GroundPoint,
  to: GroundPoint,
  foot: number,
  fromTop: number,
  toTop: number,
  /** Where the foot rises with a face: its height at the `to` end. */
  toFoot: number = foot,
) {
  const east = to.east - from.east;
  const north = to.north - from.north;
  const length = Math.hypot(east, north) || 1;
  const normal = [north / length, 0, east / length];
  const low = { ...from, up: foot };
  const lowTo = { ...to, up: toFoot };
  triangle(into, low, lowTo, { ...to, up: toTop }, normal);
  triangle(into, low, { ...to, up: toTop }, { ...from, up: fromTop }, normal);
}

/** A solid's walls: outward round its outline, and into each hole. */
export function walls(into: Triangles, prism: ScenePrism, rise: Rise) {
  const rings = [anticlockwise(prism.outer), ...prism.holes.map(clockwise)];
  for (const ring of rings) {
    ring.forEach((from, i) => {
      const to = ring[(i + 1) % ring.length] as GroundPoint;
      const [up, upTo] = [rise(from), rise(to)];
      wall(
        into,
        from,
        to,
        prism.footM + up,
        prism.topM + up,
        prism.topM + upTo,
        prism.footM + upTo,
      );
    });
  }
}

export const inScene = (at: Vertex) => new Vector3(at.east, at.up, -at.north);

/** A face's upward normal, in the scene: from its first three corners that are not in a line. */
export function faceNormal(corners: readonly Vertex[]): Vector3 {
  for (let i = 2; i < corners.length; i += 1) {
    const from = inScene(corners[0] as Vertex);
    const n = inScene(corners[1] as Vertex)
      .sub(from)
      .cross(inScene(corners[i] as Vertex).sub(from));
    if (n.lengthSq() > NONE_SQUARED) return n.y < 0 ? n.negate().normalize() : n.normalize();
  }
  return new Vector3(0, 1, 0);
}

/**
 * A look's pattern on a face: `u` along its eave and `v` up its slope, in the look's repeats, so a
 * rib runs down every face and a tile is a tile's size on a steep face as on a flat one.
 */
export function patternOn(normal: Vector3, repeatM: readonly [number, number]): Place {
  const [along, up] = repeatM;
  // The way down the face on the plan: where its normal leans (east is x, north is −z).
  const downEast = normal.x;
  const downNorth = -normal.z;
  const lean = Math.hypot(downEast, downNorth);
  if (lean < NONE) return (at) => [at.east / along, at.north / up];
  const [dE, dN] = [downEast / lean, downNorth / lean];
  // Up the slope, a plan metre is 1/cos(slope) metres of face.
  const stretch = normal.y > NONE ? 1 / normal.y : 1;
  return (at) => [
    (at.east * -dN + at.north * dE) / along,
    (-(at.east * dE + at.north * dN) * stretch) / up,
  ];
}

/** A face, flat in itself, with what is cut out of it: split on the plan, each corner at its height. */
export function face(
  into: Triangles,
  corners: readonly Vertex[],
  holes: readonly (readonly Vertex[])[],
  place: Place,
  /** Its underside too, facing down: the photo is laid only on the side the sky sees. */
  under: Triangles | null,
) {
  const points = [...corners, ...holes.flat()];
  const onPlan = (ring: readonly Vertex[]) => ring.map((at) => new Vector2(at.east, at.north));
  for (const [i, j, k] of ShapeUtils.triangulateShape(onPlan(corners), holes.map(onPlan))) {
    const [a, b, c] = [points[i ?? 0], points[j ?? 0], points[k ?? 0]];
    if (a === undefined || b === undefined || c === undefined) continue;
    const from = inScene(a);
    const normal = inScene(b).sub(from).cross(inScene(c).sub(from)).normalize();
    // A face faces up: a triangle found facing down is turned.
    const [second, third] = normal.y >= 0 ? [b, c] : [c, b];
    if (normal.y < 0) normal.negate();
    triangle(into, a, second, third, normal.toArray(), place);
    if (under !== null) triangle(under, a, third, second, normal.negate().toArray());
  }
}

/** A corner's place and its normal are three numbers; its texture place, two. */
const IN_SPACE = 3;
const ON_PICTURE = 2;

export function geometryOf(from: Triangles): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(from.positions, IN_SPACE));
  geometry.setAttribute('normal', new Float32BufferAttribute(from.normals, IN_SPACE));
  geometry.setAttribute('uv', new Float32BufferAttribute(from.uvs, ON_PICTURE));
  return geometry;
}
