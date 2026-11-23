import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { LEVEL_M, type RoofFacts, roofFloorM, roofMaterialNow, roofSloped } from './roof-levels';
import type { RoofKind } from './roof-parts';
import {
  farApart,
  farFromEdge,
  MET_M,
  metWith,
  ringAreaM2,
  shapeOf,
  shapesArea,
  shared,
  stretchesTaken,
  without,
} from './roof-polygons';

/**
 * How a new roof meets the roofs already standing (`T-M05-002`, part e): inside one, beside one,
 * partly over one, or over a whole one. From that the studio guesses what the new roof is, which
 * roof it stands on and belongs to, and its first height — and offers the other likely kinds as
 * chips, so a wrong guess is one tap. Only the new roof is placed this way: a roof already standing
 * never changes what it is. No roof is refused for lying over another.
 */

/** Where a new roof lies among the others. */
export type RoofPlace = 'apart' | 'beside' | 'inside' | 'partly_over' | 'over_whole';

/** A chip on the line after a roof closes: a kind to make it, or a move. */
export type MeetChoice = RoofKind | 'join' | 'cut_to_edge';

export interface RoofMeeting {
  readonly place: RoofPlace;
  /** The new roof's corners, moved onto the roofs it meets within 0.3 m. */
  readonly corners: readonly GroundPoint[];
  /** What it is first guessed to be, and the chips offered, the guess first. */
  readonly kind: RoofKind;
  readonly choices: readonly MeetChoice[];
  /** The roof it stands on — the highest under it — and the one it belongs to: the one it covers most. */
  readonly on: number | null;
  readonly partOf: number | null;
  /** The roof Join would join it with; `null` when it meets none at its own height. */
  readonly joinWith: number | null;
  /** Join is the first guess: both roofs slope and are made of the same thing. */
  readonly joinFirst: boolean;
  /** The guess rests on no measured height: it is marked to check. */
  readonly toCheck: boolean;
}

/** A stair room is smaller than this; a bigger roof on a roof is an upper floor. */
export const STAIR_ROOM_MAX_M2 = 20;
/** Before heights are read, a roof inside another this small, or this narrow, is first a hole. */
export const HOLE_MAX_M2 = 4;
export const HOLE_SIDE_MAX_M = 1.5;
/** A share of a roof this near the whole is the whole. */
const WHOLE = 0.999;
/** Ground smaller than this is no ground, in square metres. */
const NO_GROUND_M2 = 1e-3;

interface Over {
  readonly index: number;
  readonly areaM2: number;
  /** The share of the new roof this roof is under, and the share of this roof the new one covers. */
  readonly ofNew: number;
  readonly ofOther: number;
}

function shortestSide(corners: readonly GroundPoint[]): number {
  return Math.min(
    ...corners.map((corner, i) => {
      const next = corners[(i + 1) % corners.length] as GroundPoint;
      return Math.hypot(next.east - corner.east, next.north - corner.north);
    }),
  );
}

/** The roofs a new outline lies over, and how much of each. */
function oversOf(document: StudioDocument, corners: readonly GroundPoint[]): Over[] {
  const area = ringAreaM2(corners);
  return document.roofs.flatMap((roof, index) => {
    if (farApart(corners, roof.corners)) return [];
    const both = shapesArea(shared([shapeOf(corners)], [shapeOf(roof.corners)]) ?? []);
    if (both < NO_GROUND_M2) return [];
    return [{ index, areaM2: both, ofNew: both / area, ofOther: both / ringAreaM2(roof.corners) }];
  });
}

/** The roofs a new outline meets along an edge, with none of its ground over them. */
function besideOf(document: StudioDocument, corners: readonly GroundPoint[]): number[] {
  return document.roofs.flatMap((roof, index) => {
    const meets = corners.some(
      (corner, i) =>
        stretchesTaken(corner, corners[(i + 1) % corners.length] as GroundPoint, roof.corners)
          .length > 0,
    );
    return meets ? [index] : [];
  });
}

/** A roof inside another: a dormer on a sloped one; else small is a hole, mid a stair room. */
function insideKind(corners: readonly GroundPoint[], under: Roof, facts: RoofFacts): RoofKind {
  if (roofSloped(under, facts)) return 'dormer';
  const area = ringAreaM2(corners);
  if (area < HOLE_MAX_M2 || shortestSide(corners) < HOLE_SIDE_MAX_M) return 'hole';
  return area < STAIR_ROOM_MAX_M2 ? 'stair_room' : 'upper_floor';
}

const apart = (corners: readonly GroundPoint[]): RoofMeeting => ({
  place: 'apart',
  corners,
  kind: 'building',
  choices: ['building', 'open_shed'],
  on: null,
  partOf: null,
  joinWith: null,
  joinFirst: false,
  toCheck: false,
});

/** A new roof beside others: its own building, and Join where it meets one at its own height. */
function besideMeeting(
  document: StudioDocument,
  corners: readonly GroundPoint[],
  beside: readonly number[],
  facts: RoofFacts,
): RoofMeeting {
  // A new roof on the ground stands a plinth and a storey up until its height is read.
  const own = facts.plinthHeightM + facts.storeyHeightM;
  const level = beside.find(
    (index) => Math.abs(roofFloorM(document, index, facts) - own) < LEVEL_M,
  );
  const neighbour = level === undefined ? undefined : document.roofs[level];
  // Two sloped roofs side by side would cut through each other: joined is the likely truth.
  const joinFirst = neighbour !== undefined && roofSloped(neighbour, facts);
  const choices: MeetChoice[] = ['building', 'open_shed'];
  if (level !== undefined) choices.splice(joinFirst ? 0 : 1, 0, 'join');
  return { ...apart(corners), place: 'beside', choices, joinWith: level ?? null, joinFirst };
}

/** A new roof inside one other: its kind by its size and what it lies in, and the chips for the rest. */
function insideMeeting(base: RoofMeeting, under: Roof, facts: RoofFacts): RoofMeeting {
  const kind = insideKind(base.corners, under, facts);
  const standing: RoofKind = kind === 'upper_floor' ? 'upper_floor' : 'stair_room';
  const offered: MeetChoice[] = [standing, 'hole', 'open_shed', 'separate_part'];
  const choices = [kind, ...offered.filter((choice) => choice !== kind)];
  return { ...base, place: 'inside', kind, choices };
}

/** A new roof partly over others: an upper floor that sticks out, or cut back to their edge. */
function partlyOver(
  document: StudioDocument,
  base: RoofMeeting,
  overs: readonly Over[],
): RoofMeeting {
  const choices: MeetChoice[] = ['upper_floor', 'open_shed'];
  // Cut to edge is offered only when it leaves the new roof in one piece.
  if (
    cutToEdge(
      document,
      base.corners,
      overs.map((over) => over.index),
    ) !== null
  ) {
    choices.push('cut_to_edge');
  }
  return { ...base, place: 'partly_over', kind: 'upper_floor', choices };
}

/** A new roof with ground over other roofs: inside one, over a whole one, or partly over. */
function overMeeting(
  document: StudioDocument,
  corners: readonly GroundPoint[],
  overs: readonly Over[],
  facts: RoofFacts,
): RoofMeeting {
  // It is counted from the highest roof under it, and belongs to the roof it covers most.
  const highest = overs.reduce((a, b) =>
    roofFloorM(document, b.index, facts) > roofFloorM(document, a.index, facts) ? b : a,
  );
  const most = overs.reduce((a, b) => (b.areaM2 > a.areaM2 ? b : a));
  const partOf = most.index === highest.index ? null : most.index;
  // Until heights are read the new roof is taken as the higher one: marked to check.
  const base = { ...apart(corners), on: highest.index, partOf, toCheck: true };
  const within = overs.length === 1 && most.ofNew >= WHOLE && most.ofOther < WHOLE;
  if (within) return insideMeeting(base, document.roofs[most.index] as Roof, facts);
  if (most.ofOther < WHOLE) return partlyOver(document, base, overs);
  return { ...base, place: 'over_whole', kind: 'open_shed', choices: ['open_shed', 'upper_floor'] };
}

/**
 * How a new roof on these corners meets the design's roofs. The corners are first moved onto any
 * roof they lie within 0.3 m of, so a stair room drawn on the outer wall is inside its roof.
 */
export function meetingOf(
  document: StudioDocument,
  drawn: readonly GroundPoint[],
  facts: RoofFacts,
): RoofMeeting {
  let corners = [...drawn];
  for (const roof of document.roofs) corners = metWith(corners, roof.corners);
  const overs = oversOf(document, corners);
  if (overs.length > 0) return overMeeting(document, corners, overs, facts);
  const beside = besideOf(document, corners);
  return beside.length === 0 ? apart(corners) : besideMeeting(document, corners, beside, facts);
}

/**
 * A new roof cut back to the edge of the roofs it lies over — all of the design's, or the ones
 * named: what is left of it, when that is one piece with no hole in it.
 */
export function cutToEdge(
  document: StudioDocument,
  corners: readonly GroundPoint[],
  over?: readonly number[],
): readonly GroundPoint[] | null {
  const roofs = document.roofs.filter((_, index) => over === undefined || over.includes(index));
  const left =
    without(
      [shapeOf(corners)],
      roofs.map((roof) => shapeOf(roof.corners)),
    ) ?? [];
  const piece = left[0];
  return left.length === 1 && piece !== undefined && piece.holes.length === 0 ? piece.outer : null;
}

/** Whether two roofs are made of the same thing: Join is the first guess for two sloped ones that are. */
export function sameMaterial(a: Roof, b: Roof): boolean {
  return roofMaterialNow(a) === roofMaterialNow(b);
}

/** Room for a sum's last digit, in metres. */
const SUM_SLACK_M = 1e-9;

/** How a hole meets the roof it is drawn in: clear inside, along its edge, or at a corner alone. */
export type HoleMeets = 'inside' | 'on_edge' | 'corner_only';

/**
 * How a hole meets its roof's edge. One that runs along the edge changes the outline instead of
 * cutting a hole; one that touches at a corner alone is moved clear of it.
 */
export function holeMeets(roof: readonly GroundPoint[], hole: readonly GroundPoint[]): HoleMeets {
  const near = (point: GroundPoint) => farFromEdge(point, roof) <= MET_M + SUM_SLACK_M;
  const alongEdge = hole.some((corner, i) => {
    const next = hole[(i + 1) % hole.length] as GroundPoint;
    const middle = { east: (corner.east + next.east) / 2, north: (corner.north + next.north) / 2 };
    return near(corner) && near(next) && near(middle);
  });
  if (alongEdge) return 'on_edge';
  return hole.some(near) ? 'corner_only' : 'inside';
}
