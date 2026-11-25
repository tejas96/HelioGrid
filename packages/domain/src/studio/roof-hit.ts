import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { handFaceAt } from './roof-hand-faces';
import { roofKindOf } from './roof-kind';
import { type RoofFacts, roofShapeNow } from './roof-levels';
import type { RoofHit, RoofScene, ScenePrism, SightAt } from './roof-scene';
import { innerPoint, pointInside } from './roof-shape';
import { farFrom, onFace, onWall, SAME_M, type Sight, sightAt, sightEnds } from './roof-sight';
import type { RoofsWorked } from './roof-worked';

/** How far above the model the line of sight is first read, in metres. */
const ABOVE_M = 50;

interface Met {
  readonly up: number;
  readonly hit: RoofHit;
  /** Where it was met on the plan: a side within reach of it is met instead. */
  readonly at: GroundPoint;
  readonly roof: number;
  /** A wall round a hole cut in the roof: it is a side of the hole, not of the roof. */
  readonly inHole: boolean;
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

/**
 * A finger's reach on a part, in metres: the finger's half-width where the tap meets the model, but
 * never past a third of the way from the part's edge to its middle. Seen from far, a small part —
 * a duct, a stair room — still has a middle that is the part, between its edges and its ridge.
 */
function reachOn(document: StudioDocument, roof: number, fingerM: number): number {
  const corners = document.roofs[roof]?.corners ?? [];
  if (corners.length === 0) return fingerM;
  const depth = nearestSide(document, roof, innerPoint(corners)).far;
  return Math.min(fingerM, depth / 3);
}

/** The holes cut in a roof: the roofs of that kind that are part of it. */
function holesOf(document: StudioDocument, roof: number): number[] {
  const id = document.roofs[roof]?.id;
  return document.roofs.flatMap((other, index) =>
    roofKindOf(other) === 'hole' && other.partOf === id ? [index] : [],
  );
}

/**
 * The hole cut in `roof` that a plan point lies in, inside the roof's outline: one across the
 * roof's edge is open air past it. `null` where none is.
 */
function holeAt(document: StudioDocument, roof: number, at: GroundPoint): number | null {
  if (!pointInside(at, document.roofs[roof]?.corners ?? [])) return null;
  const hole = holesOf(document, roof).find((index) =>
    pointInside(at, document.roofs[index]?.corners ?? []),
  );
  return hole ?? null;
}

/**
 * A tap into a hole is the hole, as the top view's first tap there picks it: the sight meets its
 * opening, level with the top of the roof it is cut in or in that roof's sloped face, before the
 * walls and the floor inside it. Its side is its rim within reach, as a roof's side is its edge.
 */
const holeHit = (hole: number): RoofHit => ({ kind: 'roof', roof: hole });

/** The roof a top met at `at` names: a hole's floor, drawn with the roof it is cut in, is the hole. */
function topOwner(
  document: StudioDocument,
  roof: number,
  part: ScenePrism['part'],
  at: GroundPoint,
): number {
  return part === 'floor' ? (holeAt(document, roof, at) ?? roof) : roof;
}

/** Two plan points this near are one: a cut wall's ends lie on the hole's outline. */
const ON_M = 1e-3;

/**
 * A wall of the roof's body that stands on a hole's outline: a hole inside the roof cuts a ring, and
 * one across its edge a notch in the outline — either way the wall is the hole's.
 */
function onHole(document: StudioDocument, roof: number, from: GroundPoint, to: GroundPoint) {
  return holesOf(document, roof).some((hole) => {
    const ring = document.roofs[hole]?.corners ?? [];
    const on = (point: GroundPoint) =>
      ring.some((a, i) => farFrom(point, a, ring[(i + 1) % ring.length] as GroundPoint) < ON_M);
    return on(from) && on(to);
  });
}

/** A face met: on an Any-shape roof standing in faces drawn by hand, which of them. */
function faceHitOf(document: StudioDocument, roof: number, at: GroundPoint | null): RoofHit {
  const drawn = at === null ? null : handFaceAt(document, roof, at);
  return { kind: 'face', roof, ...(drawn === null ? {} : { face: drawn }) };
}

type Add = (up: number | null, roof: number, hit: RoofHit, inHole?: boolean) => void;

/**
 * The sloped faces met. What is cut out of a face is not the face: a hole's opening there is the
 * hole; under a dormer, the dormer's own faces stand.
 */
function facesMet(document: StudioDocument, scene: RoofScene, sight: Sight, add: Add) {
  for (const face of scene.faces) {
    const up = onFace(sight, face.corners);
    const at = up === null ? null : sightAt(sight, up);
    if (at !== null && face.holes.some((ring) => pointInside(at, ring))) {
      const hole = holeAt(document, face.roof, at);
      if (hole !== null) add(up, hole, holeHit(hole));
      continue;
    }
    add(up, face.roof, faceHitOf(document, face.roof, at));
  }
}

/** The openings of the holes in flat roofs, each level with the top of the roof it is cut in. */
function openingsMet(document: StudioDocument, scene: RoofScene, sight: Sight, add: Add) {
  document.roofs.forEach((_, roof) => {
    if (scene.faces.some((face) => face.roof === roof)) return;
    for (const hole of holesOf(document, roof)) {
      const up = scene.levels[hole]?.topM ?? null;
      if (up !== null && holeAt(document, roof, sightAt(sight, up)) === hole) {
        add(up, hole, holeHit(hole));
      }
    }
  });
}

/**
 * Every top, face and wall of the model the line of sight meets between its two ends: from the
 * camera on, never behind it.
 */
function metAll(document: StudioDocument, scene: RoofScene, sight: Sight): Met[] {
  const met: Met[] = [];
  const low = Math.min(sight.from.up, sight.to.up) - SAME_M;
  const high = Math.max(sight.from.up, sight.to.up) + SAME_M;
  const add: Add = (up, roof, hit, inHole = false) => {
    if (up === null || up < low || up > high) return;
    met.push({ up, hit, roof, at: sightAt(sight, up), inHole });
  };
  facesMet(document, scene, sight, add);
  openingsMet(document, scene, sight, add);
  for (const prism of scene.prisms) {
    // A parapet that rises with a sloped face is met on its walls alone.
    if (prism.top !== 'none' && prism.rise === undefined) {
      const at = sightAt(sight, prism.topM);
      const inside =
        pointInside(at, prism.outer) && !prism.holes.some((hole) => pointInside(at, hole));
      const owner = topOwner(document, prism.roof, prism.part, at);
      add(inside ? prism.topM : null, owner, { kind: 'roof', roof: owner });
    }
    for (const [k, ring] of [prism.outer, ...prism.holes].entries()) {
      ring.forEach((from, i) => {
        const j = (i + 1) % ring.length;
        const to = ring[j] as GroundPoint;
        const rise = k === 0 ? prism.rise : undefined;
        const lift = (share: number) =>
          rise === undefined ? 0 : (rise[i] ?? 0) + ((rise[j] ?? 0) - (rise[i] ?? 0)) * share;
        const up = onWall(
          sight,
          from,
          to,
          (share) => prism.footM + lift(share),
          (share) => prism.topM + lift(share),
        );
        if (up === null) return;
        // A wall is met as its roof's side, or its hole's: the side is named once the hit is chosen.
        const inHole = onHole(document, prism.roof, from, to);
        add(up, prism.roof, { kind: 'side', roof: prism.roof, side: -1 }, inHole);
      });
    }
  }
  for (const wall of scene.walls) {
    const up = onWall(
      sight,
      wall.from,
      wall.to,
      () => wall.footM,
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

/** A side met on a hole's wall: the hole roof cut there, and its side nearest the point. */
function holeSide(document: StudioDocument, roof: number, point: GroundPoint): RoofHit | null {
  let best: { roof: number; side: number; far: number } | null = null;
  for (const index of holesOf(document, roof)) {
    const near = nearestSide(document, index, point);
    if (best === null || near.far < best.far) best = { roof: index, ...near };
  }
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
  fingerM: number,
): RoofHit | null {
  const { roof } = first;
  const standing = document.roofs[roof];
  if (standing === undefined) return null;
  const reachM = reachOn(document, roof, fingerM);
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
 * What a tap on the 3D model lands on; `null` off every roof. `at` is the tap's line of sight and
 * `beside` the same line a finger's half-width to the side: a side or a ridge within that reach,
 * measured where the tap meets the model, is the one tapped. `open`: the roof whose sheet is open
 * — a second tap on its top, where another roof lies under it, picks the one under it (E035).
 */
export function roofHitOf(
  document: StudioDocument,
  scene: RoofScene,
  worked: RoofsWorked,
  facts: RoofFacts,
  at: SightAt,
  beside: SightAt,
  open: number | null = null,
): RoofHit | null {
  const highest = Math.max(0, ...scene.levels.map((level) => level.topM)) + ABOVE_M;
  const ends = sightEnds(at, highest);
  const near = ends === null ? null : at(ends.near);
  const far = ends === null ? null : at(ends.far);
  if (ends === null || near === null || far === null) return null;
  const sight: Sight = { from: { ...near, up: ends.near }, to: { ...far, up: ends.far } };
  // The nearest to the camera is met first.
  const met = metAll(document, scene, sight).sort(
    (a, b) => Math.abs(a.up - ends.near) - Math.abs(b.up - ends.near),
  );
  const first = met[0];
  if (first === undefined) return null;
  const aside = beside(first.up);
  const reachM =
    aside === null ? 0 : Math.hypot(aside.east - first.at.east, aside.north - first.at.north);
  const hit = named(document, scene, worked, facts, sight, first, reachM);
  if (hit?.kind !== 'roof' || hit.roof !== open) return hit;
  const under = met.find((each) => each.roof !== open);
  return under === undefined ? hit : { kind: 'roof', roof: under.roof };
}
