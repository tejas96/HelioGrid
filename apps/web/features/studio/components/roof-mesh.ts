import type { GroundPoint, RoofScene, ScenePrism } from '@heliogrid/domain';
import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2, Vector3 } from 'three';

/**
 * The roofs' triangles (`T-M05-002`, part e): the kernel's model of the whole design turned into
 * two meshes — every wall, parapet and post in one, every roof top and sloped face in the other —
 * so a design of 200 roofs is drawn in two calls. East is x, up is y, north is −z; a top's texture
 * place is its east and north, so the ground's picture lies on it where it lies on the ground.
 */

interface Triangles {
  readonly positions: number[];
  readonly normals: number[];
  readonly uvs: number[];
}

const empty = (): Triangles => ({ positions: [], normals: [], uvs: [] });

interface Vertex {
  readonly east: number;
  readonly north: number;
  readonly up: number;
}

/** One triangle, with one normal for its three corners: flat walls and flat faces. */
function triangle(into: Triangles, a: Vertex, b: Vertex, c: Vertex, normal: readonly number[]) {
  for (const at of [a, b, c]) {
    into.positions.push(at.east, at.up, -at.north);
    into.normals.push(normal[0] ?? 0, normal[1] ?? 0, normal[2] ?? 0);
    into.uvs.push(at.east, at.north);
  }
}

/** Twice a ring's area on the plan: positive when it runs anticlockwise seen from above. */
function turn(ring: readonly GroundPoint[]): number {
  return ring.reduce((sum, at, i) => {
    const next = ring[(i + 1) % ring.length] as GroundPoint;
    return sum + at.east * next.north - next.east * at.north;
  }, 0);
}

const anticlockwise = (ring: readonly GroundPoint[]) =>
  turn(ring) >= 0 ? ring : [...ring].reverse();
const clockwise = (ring: readonly GroundPoint[]) => (turn(ring) < 0 ? ring : [...ring].reverse());

/** A ring of the model's points turned to run anticlockwise seen from above, or clockwise. */
function upRing<P extends GroundPoint>(ring: readonly P[], left: boolean): readonly P[] {
  return turn(ring) >= 0 === left ? ring : [...ring].reverse();
}

/** A flat cap over an outline with holes, at one height, facing up or down. */
function cap(
  into: Triangles,
  outer: readonly GroundPoint[],
  holes: readonly (readonly GroundPoint[])[],
  up: number,
  facing: 1 | -1,
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
    triangle(into, { ...a, up }, { ...second, up }, { ...third, up }, [0, facing, 0]);
  }
}

/** The upright wall under one edge of a ring, its outside to the right of the way the ring runs. */
function wall(
  into: Triangles,
  from: GroundPoint,
  to: GroundPoint,
  foot: number,
  fromTop: number,
  toTop: number,
) {
  const east = to.east - from.east;
  const north = to.north - from.north;
  const length = Math.hypot(east, north) || 1;
  const normal = [north / length, 0, east / length];
  const low = { ...from, up: foot };
  const lowTo = { ...to, up: foot };
  triangle(into, low, lowTo, { ...to, up: toTop }, normal);
  triangle(into, low, { ...to, up: toTop }, { ...from, up: fromTop }, normal);
}

/** A solid's walls: outward round its outline, and into each hole. */
function walls(into: Triangles, prism: ScenePrism) {
  const rings = [anticlockwise(prism.outer), ...prism.holes.map(clockwise)];
  for (const ring of rings) {
    ring.forEach((from, i) => {
      const to = ring[(i + 1) % ring.length] as GroundPoint;
      wall(into, from, to, prism.footM, prism.topM, prism.topM);
    });
  }
}

const inScene = (at: Vertex) => new Vector3(at.east, at.up, -at.north);

/**
 * A sloped face, flat in itself, with what is cut out of it: split into triangles on the plan,
 * each corner at its own height, and each triangle facing up.
 */
function face(into: Triangles, corners: readonly Vertex[], holes: readonly (readonly Vertex[])[]) {
  const points = [...corners, ...holes.flat()];
  const onPlan = (ring: readonly Vertex[]) => ring.map((at) => new Vector2(at.east, at.north));
  for (const [i, j, k] of ShapeUtils.triangulateShape(onPlan(corners), holes.map(onPlan))) {
    const [a, b, c] = [points[i ?? 0], points[j ?? 0], points[k ?? 0]];
    if (a === undefined || b === undefined || c === undefined) continue;
    const from = inScene(a);
    const normal = inScene(b).sub(from).cross(inScene(c).sub(from)).normalize();
    // A face faces up: a triangle found facing down is turned.
    const up = normal.y >= 0;
    if (!up) normal.negate();
    triangle(into, a, up ? b : c, up ? c : b, normal.toArray());
  }
}

/** A corner's place and its normal are three numbers; its texture place, two. */
const IN_SPACE = 3;
const ON_PICTURE = 2;

function geometryOf(from: Triangles): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(from.positions, IN_SPACE));
  geometry.setAttribute('normal', new Float32BufferAttribute(from.normals, IN_SPACE));
  geometry.setAttribute('uv', new Float32BufferAttribute(from.uvs, ON_PICTURE));
  return geometry;
}

export interface RoofGeometries {
  /** Every wall, parapet, post and rail: plaster. */
  readonly walls: BufferGeometry;
  /** Every roof top and sloped face: they wear the ground's picture. */
  readonly tops: BufferGeometry;
  /** The highest point of the model, in metres: below a hair of it risen, nothing is drawn. */
  readonly topM: number;
}

/** The whole design's two meshes. The caller disposes them when the model changes. */
export function roofGeometries(scene: RoofScene): RoofGeometries {
  const plaster = empty();
  const tops = empty();
  let topM = 0;
  for (const prism of scene.prisms) {
    topM = Math.max(topM, prism.topM);
    walls(plaster, prism);
    const holes = prism.holes.map(clockwise);
    const outer = anticlockwise(prism.outer);
    if (prism.top !== 'none')
      cap(prism.top === 'roof' ? tops : plaster, outer, holes, prism.topM, 1);
    // A sheet on posts is seen from under it too.
    if (prism.part === 'sheet') cap(plaster, outer, holes, prism.footM, -1);
  }
  for (const each of scene.faces) {
    topM = Math.max(topM, ...each.corners.map((corner) => corner.up));
    // The plan's split wants the outline one way round and each hole the other.
    face(
      tops,
      upRing(each.corners, true),
      each.holes.map((hole) => upRing(hole, false)),
    );
  }
  for (const each of scene.walls) {
    topM = Math.max(topM, each.fromTopM, each.toTopM);
    wall(plaster, each.from, each.to, each.footM, each.fromTopM, each.toTopM);
    // A gable's wall is seen from both sides of the roof's end: its other side too.
    wall(plaster, each.to, each.from, each.footM, each.toTopM, each.fromTopM);
  }
  return { walls: geometryOf(plaster), tops: geometryOf(tops), topM };
}
