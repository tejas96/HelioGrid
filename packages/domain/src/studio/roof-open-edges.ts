import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { belongsTo, roofKindOf, roofSidesOf } from './roof-kind';
import {
  LEVEL_M,
  type RoofFacts,
  roofFloorM,
  roofHasWalls,
  roofMaterialNow,
  roofSloped,
} from './roof-levels';
import { materialStart } from './roof-material';
import type { LengthsMeasured, ParapetBuild } from './roof-parts';
import { farApart, type Stretch, stretchesTaken } from './roof-polygons';

/**
 * Where a roof has a parapet (`T-M05-002`, part e): only where it is open to the sky. Along any
 * stretch of its edge where a higher roof with walls stands on it or against it, that roof's wall
 * is there; where two roofs of one height meet, the seam has none. The edge splits exactly where
 * the other roof starts. A side a person tapped keeps their choice.
 */

/** The roof's one parapet setting as it stands: what is stored, else what its kind and material give. */
export interface ParapetNow {
  readonly allRound: boolean;
  readonly metres: number;
  readonly thicknessM: number;
  readonly build: ParapetBuild;
  readonly lengthsMeasured: LengthsMeasured;
  /** A person set it; else it is the studio's, `assumed`. */
  readonly byPerson: boolean;
}

/** A railing's posts and rail are this thick, in metres: a railing never takes a wall's thickness. */
export const RAIL_M = 0.05;

/**
 * How far the parapet stands in from the outline: the thickness of what is built there — a wall's
 * own, a railing's few centimetres — where the lengths were measured outside it; none where they
 * were measured inside it, which is the outline already.
 */
export function parapetInM(parapet: ParapetNow): number {
  if (parapet.lengthsMeasured !== 'outside') return 0;
  return parapet.build === 'railing' ? RAIL_M : parapet.thicknessM;
}

/** Whether a roof starts with a parapet all round: a flat roof of a material that has one, on its own walls. */
function startsWithParapet(
  document: StudioDocument,
  roof: Roof,
  facts: RoofFacts,
  depth: number,
): boolean {
  const kind = roofKindOf(roof);
  // A stair room's top holds tanks, not a wall; an open shed and a dormer have no edge to guard.
  if (kind === 'stair_room' || kind === 'open_shed' || kind === 'dormer') return false;
  if (kind === 'hole') {
    // A duct's first parapet follows its roof's.
    const part = belongsTo(document, roof);
    const round = part === null ? undefined : document.roofs[part];
    // Holes cut in holes, link after link: past any real depth the links run in a ring.
    if (round === undefined || depth > HOLES_DEEP) return false;
    return parapetNow(document, round, facts, depth + 1).allRound;
  }
  return !roofSloped(roof, facts) && materialStart(roofMaterialNow(roof), facts).parapet;
}

/** No hole is cut in a hole in a hole this deep. */
const HOLES_DEEP = 8;

export function parapetNow(
  document: StudioDocument,
  roof: Roof,
  facts: RoofFacts,
  depth = 0,
): ParapetNow {
  const stored = roof.parapet;
  return {
    allRound: stored?.allRound ?? startsWithParapet(document, roof, facts, depth),
    metres: stored?.metres ?? facts.parapetHeightM,
    thicknessM: stored?.thickness?.metres ?? facts.wallThicknessM,
    build: stored?.build ?? 'wall',
    lengthsMeasured: stored?.lengthsMeasured ?? 'outside',
    byPerson: stored?.setBy === 'person',
  };
}

/** Why a stretch of a side has a wall, or has none. */
export type EdgeState =
  /** Open to the sky: the roof's own setting decides. */
  | 'open'
  /** A roof of the same height meets it: a seam. */
  | 'shared'
  /** A higher roof's wall stands there. */
  | 'under'
  /** A person set this side. */
  | 'person';

/** One stretch of a side, from one share of its length to another. */
export interface EdgeStretch extends Stretch {
  readonly wall: boolean;
  readonly state: EdgeState;
  /** The roof that takes the stretch, for a seam or a higher roof's wall. */
  readonly other: number | null;
  /** The wall's height above the roof's floor, where it has one. */
  readonly metres: number;
}

interface Taken extends Stretch {
  readonly state: 'shared' | 'under';
  readonly other: number;
}

/** A stretch shorter than this share of its side is none. */
const NO_STRETCH = 1e-6;

/** A roof near enough to take a stretch of another's edge, and what it would make of it. */
interface Near {
  readonly at: number;
  readonly corners: readonly GroundPoint[];
  readonly state: 'shared' | 'under';
}

/**
 * The roofs that can take a stretch of roof `index`'s edge from the sky: near it, with walls, and
 * as high as it or higher. Worked out once for the roof, so each side looks only at these.
 */
function nearOf(document: StudioDocument, index: number, facts: RoofFacts): Near[] {
  const roof = document.roofs[index] as Roof;
  const floor = roofFloorM(document, index, facts);
  // A hole's sides are the edge of the roof it is cut in: that roof takes nothing from them.
  const cutIn = roofKindOf(roof) === 'hole' ? belongsTo(document, roof) : null;
  return document.roofs.flatMap((other, at): Near[] => {
    if (at === index || at === cutIn || !roofHasWalls(other)) return [];
    if (farApart(roof.corners, other.corners)) return [];
    const rise = roofFloorM(document, at, facts) - floor;
    // A lower roof beside it leaves the edge open to the sky.
    if (rise < -LEVEL_M) return [];
    return [{ at, corners: other.corners, state: rise > LEVEL_M ? 'under' : 'shared' }];
  });
}

/** The stretches of a side other roofs take from the sky: a seam, or a higher roof's wall. */
function takenOf(near: readonly Near[], from: GroundPoint, to: GroundPoint): Taken[] {
  return near.flatMap(({ at, corners, state }): Taken[] =>
    stretchesTaken(from, to, corners).map((stretch) => ({ ...stretch, state, other: at })),
  );
}

/** A side cut at every place a stretch starts or ends, each piece with the stretch that takes it. */
function piecesOf(taken: readonly Taken[]): { from: number; to: number; by: Taken | null }[] {
  const cuts = [...new Set([0, 1, ...taken.flatMap((stretch) => [stretch.from, stretch.to])])].sort(
    (a, b) => a - b,
  );
  const pieces: { from: number; to: number; by: Taken | null }[] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const from = cuts[i] as number;
    const to = cuts[i + 1] as number;
    if (to - from < NO_STRETCH) continue;
    const middle = (from + to) / 2;
    const over = taken.filter((stretch) => stretch.from <= middle && middle <= stretch.to);
    // A higher roof's wall wins over a seam on the same stretch.
    const by = over.find((stretch) => stretch.state === 'under') ?? over[0] ?? null;
    pieces.push({ from, to, by });
  }
  return pieces;
}

/**
 * Each side of a roof as stretches, in order along it: where it has a wall, and why. A side a
 * person set is one stretch, theirs: a wall along all of it, or none.
 */
export function edgesOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
): EdgeStretch[][] {
  const roof = document.roofs[index];
  if (roof === undefined) return [];
  const parapet = parapetNow(document, roof, facts);
  const sides = roofSidesOf(roof);
  const near = nearOf(document, index, facts);
  return roof.corners.map((from, side) => {
    const own = sides[side] ?? {};
    const metres = own.parapetM ?? parapet.metres;
    if (own.parapet !== undefined) {
      return [{ from: 0, to: 1, wall: own.parapet, state: 'person', other: null, metres }];
    }
    const to = roof.corners[(side + 1) % roof.corners.length] as GroundPoint;
    return piecesOf(takenOf(near, from, to)).map(
      ({ from: start, to: end, by }): EdgeStretch => ({
        from: start,
        to: end,
        wall: by === null && parapet.allRound,
        state: by?.state ?? 'open',
        other: by?.other ?? null,
        metres,
      }),
    );
  });
}
