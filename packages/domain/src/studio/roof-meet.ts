import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { groundRoofHeightM } from './roof-height';
import {
  LEVEL_M,
  type RoofFacts,
  roofFloorM,
  roofHasWalls,
  roofMaterialNow,
  roofSloped,
} from './roof-levels';
import type { MeetChoice, RoofMeeting } from './roof-meeting';
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
  startsLike: null,
  joinFirst: false,
  toCheck: false,
});

/** A new roof beside others: its own building, and Join where it meets one at its own height. */
function besideMeeting(
  document: StudioDocument,
  corners: readonly GroundPoint[],
  beside: readonly number[],
  facts: RoofFacts,
  as: Roof | undefined,
): RoofMeeting {
  // A new roof on the ground stands a plinth and a storey up until its height is read.
  const own = groundRoofHeightM({ storeyHeightM: facts.storeyHeightM, roof: facts });
  const level = beside.find(
    (index) => Math.abs(roofFloorM(document, index, facts) - own) < LEVEL_M,
  );
  const neighbour = level === undefined ? undefined : document.roofs[level];
  // Two sloped roofs of one material side by side would cut through each other: joined is the
  // likely truth. A roof just drawn starts like this neighbour, so it is what the neighbour is; a
  // roof that already says what it is made of and how it is shaped is taken at its word.
  const alike =
    neighbour !== undefined &&
    (as === undefined ||
      (roofSloped(as, facts) && roofMaterialNow(as) === roofMaterialNow(neighbour)));
  const joinFirst = neighbour !== undefined && alike && roofSloped(neighbour, facts);
  const choices: MeetChoice[] = ['building', 'open_shed'];
  if (level !== undefined) choices.splice(joinFirst ? 0 : 1, 0, 'join');
  const startsLike = level ?? beside[0] ?? null;
  return {
    ...apart(corners),
    place: 'beside',
    choices,
    joinWith: level ?? null,
    startsLike,
    joinFirst,
  };
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

/**
 * The roof a new outline lies inside, of the roofs under it: the highest one that covers it whole
 * and is bigger than it. An open shed is a cover, not a floor: a roof drawn under one lies in the
 * walled roof beneath, where there is one. `null` when a higher roof takes only part of it.
 */
function holderOf(document: StudioDocument, overs: readonly Over[], facts: RoofFacts): Over | null {
  const floor = (over: Over) => roofFloorM(document, over.index, facts);
  const walled = (over: Over) => roofHasWalls(document.roofs[over.index] as Roof);
  const covering = overs.filter((over) => over.ofNew >= WHOLE && over.ofOther < WHOLE);
  const floors = covering.filter(walled);
  const pool = floors.length > 0 ? floors : covering;
  if (pool.length === 0) return null;
  const holder = pool.reduce((a, b) => (floor(b) > floor(a) ? b : a));
  // A walled roof higher than the holder that takes only part of the outline: it is partly over that one.
  const above = overs.some((over) => walled(over) && floor(over) > floor(holder) + LEVEL_M);
  return above ? null : holder;
}

/** A new roof with ground over other roofs: inside one, over a whole one, or partly over. */
function overMeeting(
  document: StudioDocument,
  corners: readonly GroundPoint[],
  overs: readonly Over[],
  facts: RoofFacts,
): RoofMeeting {
  const holder = holderOf(document, overs, facts);
  if (holder !== null) {
    // It stands on the roof it lies in, whatever lies under that one.
    const base = { ...apart(corners), on: holder.index, toCheck: true, startsLike: holder.index };
    return insideMeeting(base, document.roofs[holder.index] as Roof, facts);
  }
  // It is counted from the highest roof under it, and belongs to the roof it covers most.
  const highest = overs.reduce((a, b) =>
    roofFloorM(document, b.index, facts) > roofFloorM(document, a.index, facts) ? b : a,
  );
  const most = overs.reduce((a, b) => (b.areaM2 > a.areaM2 ? b : a));
  const partOf = most.index === highest.index ? null : most.index;
  // Until heights are read the new roof is taken as the higher one: marked to check.
  const base = {
    ...apart(corners),
    on: highest.index,
    partOf,
    toCheck: true,
    startsLike: most.index,
  };
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
  /** The roof as it is, where it already says what it is made of: a copy, or a roof moved here. */
  as?: Roof,
): RoofMeeting {
  let corners = [...drawn];
  for (const roof of document.roofs) corners = metWith(corners, roof.corners);
  const overs = oversOf(document, corners);
  if (overs.length > 0) return overMeeting(document, corners, overs, facts);
  const beside = besideOf(document, corners);
  if (beside.length === 0) return apart(corners);
  return besideMeeting(document, corners, beside, facts, as);
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
