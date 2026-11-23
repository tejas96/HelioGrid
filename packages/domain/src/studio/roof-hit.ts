import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
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
  const add = (up: number | null, roof: number, hit: RoofHit) => {
    if (up !== null) met.push({ up, hit, roof, at: sightAt(sight, up) });
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
    for (const ring of [prism.outer, ...prism.holes]) {
      ring.forEach((from, i) => {
        const to = ring[(i + 1) % ring.length] as GroundPoint;
        const up = onWall(sight, from, to, prism.footM, () => prism.topM);
        // A wall is met as its roof's side: the side is named once the hit is chosen.
        add(up, prism.roof, { kind: 'side', roof: prism.roof, side: -1 });
      });
    }
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

/** What a tap on the 3D model lands on; `null` off every roof. */
export function roofHitOf(
  document: StudioDocument,
  scene: RoofScene,
  worked: RoofsWorked,
  facts: RoofFacts,
  at: SightAt,
  reachM: number,
): RoofHit | null {
  const highest = Math.max(0, ...scene.levels.map((level) => level.topM)) + ABOVE_M;
  const high = at(highest);
  const low = at(0);
  if (high === null || low === null) return null;
  const sight: Sight = { from: { ...high, up: highest }, to: { ...low, up: 0 } };
  const met = metAll(scene, sight).sort((a, b) => b.up - a.up);
  const first = met[0];
  if (first === undefined) return null;
  const { roof } = first;
  if (document.roofs[roof] === undefined) return null;
  const shape = roofShapeNow(document.roofs[roof], facts);
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
