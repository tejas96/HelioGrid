import { COMPASS_WAYS, type CompassWay, compassOf } from './compass';
import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { FormPicks } from './roof-built';
import { outlineForFaces } from './roof-face-outline';
import { gableEnds } from './roof-forms';
import { roofSidesOf } from './roof-kind';
import { LEVEL_M, type RoofFacts, roofFloorM, roofHasWalls, roofShapeNow } from './roof-levels';
import type { RoofShape } from './roof-material';
import { stretchesTaken } from './roof-polygons';
import { distance, type PlanPoint, ringArea } from './wavefront-lines';

/**
 * Which way a roof slopes (`T-M05-002`, part e). A shed's low side comes first from a person's
 * tap, then from a taller wall it stands against (its high side goes against that wall), and else
 * it is the side that looks most toward the equator. A gable on a roof with no clearly longer side
 * runs its ridge so one face looks toward the equator; a sawtooth's glass looks away from it. The
 * low side is kept as a side of the roof, never a compass angle.
 */

const RADIANS = Math.PI / 180;
const FULL_TURN = 360;
const HALF_TURN = 180;
const FOUR = 4;

/** The bearing the equator lies in from a place: south above it, north below it. */
export function equatorBearing(latitude: number): number {
  return latitude >= 0 ? HALF_TURN : 0;
}

/** The bearing a side looks out to, across itself, in degrees clockwise from north. */
export function sideBearing(corners: readonly GroundPoint[], side: number): number {
  const from = corners[side] as GroundPoint;
  const to = corners[(side + 1) % corners.length] as GroundPoint;
  const anticlockwise = ringArea(corners.map((c) => ({ x: c.east, y: c.north }))) >= 0;
  const sign = anticlockwise ? 1 : -1;
  // Outward is to the right of an anticlockwise side's way.
  const east = sign * (to.north - from.north);
  const north = -sign * (to.east - from.east);
  return (Math.atan2(east, north) / RADIANS + FULL_TURN) % FULL_TURN;
}

/** How far apart two bearings are, in degrees: 0 to 180. */
export function bearingsApart(a: number, b: number): number {
  const apart = Math.abs(a - b) % FULL_TURN;
  return apart > HALF_TURN ? FULL_TURN - apart : apart;
}

/** The side that looks nearest a bearing; the first of two that look alike. */
export function sideToward(corners: readonly GroundPoint[], bearingDeg: number): number {
  let best = 0;
  corners.forEach((_, side) => {
    const nearer =
      bearingsApart(sideBearing(corners, side), bearingDeg) <
      bearingsApart(sideBearing(corners, best), bearingDeg) - 1e-9;
    if (nearer) best = side;
  });
  return best;
}

/** How much of each side of a roof runs against a taller roof's wall, in metres, and which roof's. */
function againstWalls(document: StudioDocument, index: number, facts: RoofFacts) {
  const roof = document.roofs[index];
  if (roof === undefined) return [];
  const floor = roofFloorM(document, index, facts);
  return roof.corners.map((from, side) => {
    const to = roof.corners[(side + 1) % roof.corners.length] as GroundPoint;
    const length = Math.hypot(to.east - from.east, to.north - from.north);
    let metres = 0;
    let wall: number | null = null;
    document.roofs.forEach((other, at) => {
      const taller = roofHasWalls(other) && roofFloorM(document, at, facts) > floor + LEVEL_M;
      if (at === index || !taller) return;
      const run = stretchesTaken(from, to, other.corners).reduce(
        (sum, s) => sum + (s.to - s.from),
        0,
      );
      if (run * length > metres) {
        metres = run * length;
        wall = at;
      }
    });
    return { metres, wall: wall as number | null };
  });
}

export interface LowSide {
  readonly side: number;
  /** A person put it there; else the studio did, `assumed`. */
  readonly byPerson: boolean;
  /**
   * The taller roof whose wall the low side runs against: rain runs into that wall. It is kept,
   * never refused, and marked to check.
   */
  readonly againstWall: number | null;
}

/** A shed roof's low side. */
export function lowSideOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  latitude: number,
): LowSide {
  const roof = document.roofs[index];
  if (roof === undefined) return { side: 0, byPerson: false, againstWall: null };
  const walls = againstWalls(document, index, facts);
  const stored = roofSidesOf(roof).findIndex((side) => side.low !== undefined);
  if (stored >= 0) {
    const byPerson = roofSidesOf(roof)[stored]?.low === 'person';
    return { side: stored, byPerson, againstWall: walls[stored]?.wall ?? null };
  }
  // Its high side goes against the taller wall: the low side looks the other way.
  const high = walls.reduce(
    (best, each, side) => (each.metres > (walls[best]?.metres ?? 0) ? side : best),
    -1,
  );
  const toward =
    high >= 0 && (walls[high]?.metres ?? 0) > 0
      ? (sideBearing(roof.corners, high) + HALF_TURN) % FULL_TURN
      : equatorBearing(latitude);
  const side = sideToward(roof.corners, toward);
  return { side, byPerson: false, againstWall: walls[side]?.wall ?? null };
}

/** Two pairs of sides this near in length have no clearly longer one. */
const NEAR_SQUARE = 0.1;

/**
 * Whether a gable's ridge is turned from the way it first runs, where no person has said: on a
 * four-sided roof with no clearly longer side, the ridge runs so one face looks toward the equator.
 */
export function gableTurnedFor(corners: readonly GroundPoint[], latitude: number): boolean {
  // The roof as its faces see it: a corner added on a straight side does not make it five-sided.
  const outline = outlineForFaces(corners);
  if (outline.points.length !== FOUR) return false;
  const length = (side: number) =>
    distance(outline.points[side] as PlanPoint, outline.points[(side + 1) % FOUR] as PlanPoint);
  const even = length(0) + length(2);
  const odd = length(1) + length(3);
  if (Math.abs(even - odd) > NEAR_SQUARE * Math.max(even, odd)) return false;
  const equator = equatorBearing(latitude);
  const sides = outline.sides.map((drawn) => drawn[0] as number);
  // The eaves are the sides that are not ends: the best of them should look at the equator.
  const off = (turned: boolean) => {
    const ends = gableEnds(corners, turned);
    const eaves = sides.filter((side) => !ends.includes(side));
    return Math.min(...eaves.map((side) => bearingsApart(sideBearing(corners, side), equator)));
  };
  return off(true) < off(false) - 1e-9;
}

/** Within this many degrees of the equator the sun is on both sides of a roof through the year. */
const NEAR_EQUATOR_DEG = 5;

/**
 * The side a sawtooth roof's glass faces where no person has said: away from the equator, as a
 * north-light roof's does, so its solid faces take the panels. Near the equator it is marked to check.
 */
export function glassSideOf(
  corners: readonly GroundPoint[],
  latitude: number,
): { readonly side: number; readonly toCheck: boolean } {
  const pole = (equatorBearing(latitude) + HALF_TURN) % FULL_TURN;
  return { side: sideToward(corners, pole), toCheck: Math.abs(latitude) < NEAR_EQUATOR_DEG };
}

/** The shapes whose slope runs one way from a side: the studio picks that side where no one has. */
const ONE_WAY: readonly RoofShape[] = ['shed', 'monitor', 'curved', 'butterfly'];
const RIDGED: readonly RoofShape[] = ['gable', 'gambrel'];

/**
 * What the studio picks for a roof's form where no person has: a one-way roof's low side, the side
 * a sawtooth's glass faces, and whether a gable's ridge is turned to look at the equator.
 */
export function formPicksOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  latitude: number,
): FormPicks {
  const roof = document.roofs[index];
  if (roof === undefined) return {};
  const shape = roofShapeNow(roof, facts);
  if (shape === 'sawtooth') return { side: glassSideOf(roof.corners, latitude).side };
  if (ONE_WAY.includes(shape)) return { side: lowSideOf(document, index, facts, latitude).side };
  return RIDGED.includes(shape) ? { turned: gableTurnedFor(roof.corners, latitude) } : {};
}

export { COMPASS_WAYS, type CompassWay, compassOf };
