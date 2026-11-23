import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { belongsTo, roofKindOf } from './roof-kind';
import { type RoofFacts, roofShapeNow } from './roof-levels';
import type { ModelPoint, RoofHit, RoofScene, SightAt } from './roof-scene';
import { pointInside } from './roof-shape';
import type { RoofsWorked } from './roof-worked';

/** How far above the model the line of sight is first read, in metres. */
const ABOVE_M = 50;
/** Two heights this close are one: the nearer of two equal hits is the one listed first. */
const SAME_M = 1e-6;

interface Sight {
  readonly from: ModelPoint;
  readonly to: ModelPoint;
}

/** The point of the line of sight at a height. */
function sightAt(sight: Sight, up: number): GroundPoint {
  const share = (up - sight.from.up) / (sight.to.up - sight.from.up);
  return {
    east: sight.from.east + (sight.to.east - sight.from.east) * share,
    north: sight.from.north + (sight.to.north - sight.from.north) * share,
  };
}

interface Met {
  readonly up: number;
  readonly hit: RoofHit;
  /** Where it was met on the plan: a side within reach of it is met instead. */
  readonly at: GroundPoint;
  readonly roof: number;
  /** A wall round a hole cut in the roof: it is a side of the hole, not of the roof. */
  readonly inHole: boolean;
}

/** Where the line of sight meets a face's plane: its height there, inside the face; `null` if not. */
function onFace(sight: Sight, corners: readonly ModelPoint[]): number | null {
  const [a, b, c] = corners;
  if (a === undefined || b === undefined || c === undefined) return null;
  // The plane's normal: (b − a) × (c − a).
  const u = { e: b.east - a.east, n: b.north - a.north, h: b.up - a.up };
  const v = { e: c.east - a.east, n: c.north - a.north, h: c.up - a.up };
  const normal = { e: u.n * v.h - u.h * v.n, n: u.h * v.e - u.e * v.h, h: u.e * v.n - u.n * v.e };
  const along = {
    e: sight.to.east - sight.from.east,
    n: sight.to.north - sight.from.north,
    h: sight.to.up - sight.from.up,
  };
  const facing = normal.e * along.e + normal.n * along.n + normal.h * along.h;
  if (Math.abs(facing) < SAME_M) return null;
  const toPlane =
    normal.e * (a.east - sight.from.east) +
    normal.n * (a.north - sight.from.north) +
    normal.h * (a.up - sight.from.up);
  const share = toPlane / facing;
  const up = sight.from.up + along.h * share;
  return pointInside(sightAt(sight, up), corners) ? up : null;
}

/** Where the line of sight crosses an upright wall from `from` to `to`; `null` off its span. */
function onWall(
  sight: Sight,
  from: GroundPoint,
  to: GroundPoint,
  footM: number,
  topAt: (share: number) => number,
): number | null {
  // Along the sight, plan points move linearly with height: find the height where it crosses the wall's line.
  const p = sightAt(sight, sight.from.up);
  const q = sightAt(sight, sight.to.up);
  const wall = { e: to.east - from.east, n: to.north - from.north };
  const cross = (x: GroundPoint) => (x.east - from.east) * wall.n - (x.north - from.north) * wall.e;
  const atP = cross(p);
  const atQ = cross(q);
  if (Math.abs(atP - atQ) < SAME_M) return null;
  const t = atP / (atP - atQ);
  const up = sight.from.up + (sight.to.up - sight.from.up) * t;
  const point = sightAt(sight, up);
  const span = wall.e * wall.e + wall.n * wall.n;
  if (span === 0) return null;
  const share = ((point.east - from.east) * wall.e + (point.north - from.north) * wall.n) / span;
  if (share < 0 || share > 1) return null;
  return up >= footM - SAME_M && up <= topAt(share) + SAME_M ? up : null;
}

/** How far a plan point lies from a segment, in metres. */
function farFrom(point: GroundPoint, from: GroundPoint, to: GroundPoint): number {
  const de = to.east - from.east;
  const dn = to.north - from.north;
  const span = de * de + dn * dn;
  const share =
    span === 0
      ? 0
      : Math.min(
          1,
          Math.max(0, ((point.east - from.east) * de + (point.north - from.north) * dn) / span),
        );
  return Math.hypot(point.east - (from.east + de * share), point.north - (from.north + dn * share));
}

/** The roof's side nearest a plan point, and how far it lies. */
function nearestSide(document: StudioDocument, roof: number, point: GroundPoint) {
  const corners = document.roofs[roof]?.corners ?? [];
  let best = { side: 0, far: Number.POSITIVE_INFINITY };
  corners.forEach((from, side) => {
    const far = farFrom(point, from, corners[(side + 1) % corners.length] as GroundPoint);
    if (far < best.far) best = { side, far };
  });
  return best;
}

/** Every top, face and wall of the model the line of sight meets. */
function metAll(scene: RoofScene, sight: Sight): Met[] {
  const met: Met[] = [];
  const add = (up: number | null, roof: number, hit: RoofHit, inHole = false) => {
    if (up !== null) met.push({ up, hit, roof, at: sightAt(sight, up), inHole });
  };
  for (const face of scene.faces)
    add(onFace(sight, face.corners), face.roof, { kind: 'face', roof: face.roof });
  for (const prism of scene.prisms) {
    if (prism.top !== 'none') {
      const at = sightAt(sight, prism.topM);
      const inside =
        pointInside(at, prism.outer) && !prism.holes.some((hole) => pointInside(at, hole));
      add(inside ? prism.topM : null, prism.roof, { kind: 'roof', roof: prism.roof });
    }
    [prism.outer, ...prism.holes].forEach((ring, k) => {
      ring.forEach((from, i) => {
        const to = ring[(i + 1) % ring.length] as GroundPoint;
        const up = onWall(sight, from, to, prism.footM, () => prism.topM);
        // A wall is met as its roof's side: the side is named once the hit is chosen.
        add(up, prism.roof, { kind: 'side', roof: prism.roof, side: -1 }, k > 0);
      });
    });
  }
  for (const wall of scene.walls) {
    const up = onWall(
      sight,
      wall.from,
      wall.to,
      wall.footM,
      (share) => wall.fromTopM + (wall.toTopM - wall.fromTopM) * share,
    );
    add(up, wall.roof, { kind: 'side', roof: wall.roof, side: -1 });
  }
  return met;
}

/** A gable's or a hip's ridge: within reach of the line of sight, at the ridge's own height. */
function nearRidge(
  worked: RoofsWorked,
  scene: RoofScene,
  sight: Sight,
  roof: number,
  reachM: number,
): boolean {
  const built = worked.built[roof];
  const low = scene.levels[roof]?.topM ?? 0;
  if (built == null) return false;
  return built.faces.some((face) =>
    face.edges.some((edge, i) => {
      if (edge !== 'ridge') return false;
      const from = face.corners[i];
      const to = face.corners[(i + 1) % face.corners.length];
      if (from === undefined || to === undefined) return false;
      const up = low + (from.up + to.up) / 2;
      return farFrom(sightAt(sight, up), from, to) <= reachM;
    }),
  );
}

/** Steps of the search for where the line of sight starts: well under a millimetre. */
const SEARCH_STEPS = 32;

/**
 * The highest height the line of sight is read at: the camera's, found by search, since a height
 * above the camera is behind it and reads `null`; `null` when the line meets the ground nowhere.
 */
function sightTop(at: SightAt, highest: number): number | null {
  if (at(highest) !== null) return highest;
  if (at(0) === null) return null;
  let below = 0;
  let above = highest;
  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const middle = (below + above) / 2;
    if (at(middle) === null) above = middle;
    else below = middle;
  }
  return below;
}

/** A side met on a hole's wall: the hole roof cut there, and its side nearest the point. */
function holeSide(document: StudioDocument, roof: number, point: GroundPoint): RoofHit | null {
  let best: { roof: number; side: number; far: number } | null = null;
  document.roofs.forEach((other, index) => {
    if (roofKindOf(other) !== 'hole' || belongsTo(document, other) !== roof) return;
    const near = nearestSide(document, index, point);
    if (best === null || near.far < best.far) best = { roof: index, ...near };
  });
  const found = best as { roof: number; side: number } | null;
  return found === null ? null : { kind: 'side', roof: found.roof, side: found.side };
}

/** The tap names its roof's side, a ridge, a face or the roof, from what it met first. */
function named(
  document: StudioDocument,
  scene: RoofScene,
  worked: RoofsWorked,
  facts: RoofFacts,
  sight: Sight,
  first: Met,
  reachM: number,
): RoofHit | null {
  const { roof } = first;
  const standing = document.roofs[roof];
  if (standing === undefined) return null;
  if (first.hit.kind === 'side' && first.inHole) return holeSide(document, roof, first.at);
  const shape = roofShapeNow(standing, facts);
  if ((shape === 'gable' || shape === 'hip') && nearRidge(worked, scene, sight, roof, reachM)) {
    return { kind: 'ridge', roof };
  }
  const side = nearestSide(document, roof, first.at);
  // A wall is its side; a top or a face within reach of its edge is that side too.
  if (first.hit.kind === 'side' || side.far <= reachM) {
    return { kind: 'side', roof, side: side.side };
  }
  return first.hit;
}

/**
 * What a tap on the 3D model lands on; `null` off every roof. `open`: the roof whose sheet is open
 * — a second tap on its top, where another roof lies under it, picks the one under it (E035).
 */
export function roofHitOf(
  document: StudioDocument,
  scene: RoofScene,
  worked: RoofsWorked,
  facts: RoofFacts,
  at: SightAt,
  reachM: number,
  open: number | null = null,
): RoofHit | null {
  const highest = Math.max(0, ...scene.levels.map((level) => level.topM)) + ABOVE_M;
  const top = sightTop(at, highest);
  const high = top === null ? null : at(top);
  const low = at(0);
  if (top === null || high === null || low === null) return null;
  const sight: Sight = { from: { ...high, up: top }, to: { ...low, up: 0 } };
  const met = metAll(scene, sight).sort((a, b) => b.up - a.up);
  const first = met[0];
  if (first === undefined) return null;
  const hit = named(document, scene, worked, facts, sight, first, reachM);
  if (hit?.kind !== 'roof' || hit.roof !== open) return hit;
  const under = met.find((each) => each.roof !== open);
  return under === undefined ? hit : { kind: 'roof', roof: under.roof };
}
