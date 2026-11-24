import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofKindOf, roofSidesOf, standsOn } from './roof-kind';
import { cornerAfter, pointInside } from './roof-shape';

/**
 * The stairs and their clear path (`T-M05-002`, part e, E119–E122, board 7): where the stairs
 * reach the roof — a mark on a side of the stair room, or on a roof's edge for outside stairs or
 * a ladder — and the green strip of the market's clear path in front of them. A stair room's
 * stairs start on its side that faces the most open roof, `assumed`; a person moves them by a
 * drag or from the stair room's sheet. A side another roof takes holds no stairs.
 */

/** How far the clear strip runs in front of the stairs, in metres: the path through the panels is the Panels step's. */
export const STAIRS_STRIP_M = 1.6;
/** Within this far of a side's middle, or of an edge's end, the magnet pulls the stairs to it, in metres. */
export const STAIRS_PULL_M = 0.4;

/** Where the stairs stand: a side of a roof, and how far along it from its first corner. */
export interface StairsPlace {
  readonly roof: number;
  readonly side: number;
  readonly atM: number;
}

export interface StairsShown extends StairsPlace {
  readonly at: GroundPoint;
  /** On a roof's edge rather than a stair room's side: outside stairs or a ladder. */
  readonly outside: boolean;
  readonly byPerson: boolean;
  /** The clear strip in front of them, on the roof they open onto. */
  readonly strip: readonly GroundPoint[];
}

/** A side's stretches as the kernel splits them: where another roof takes it. */
export interface SideStretch {
  readonly from: number;
  readonly to: number;
  readonly other: number | null;
}

/** Every roof's sides, each split where another roof takes it (`RoofsWorked['edges']`). */
export type RoofsEdges = readonly (readonly (readonly SideStretch[])[])[];

/** Where a dragged mark lands, or a tap places the stairs; what the magnet pulled it to. */
export interface StairsDrop extends StairsPlace {
  readonly at: GroundPoint;
  readonly outside: boolean;
  readonly pulled: 'middle' | 'end' | null;
}

const isStairRoom = (roof: Roof | undefined) =>
  roof !== undefined && roofKindOf(roof) === 'stair_room';

function ends(roof: Roof, side: number): readonly [GroundPoint, GroundPoint] {
  return [roof.corners[side] as GroundPoint, cornerAfter(roof.corners, side)];
}

const lengthOf = ([a, b]: readonly [GroundPoint, GroundPoint]) =>
  Math.hypot(b.east - a.east, b.north - a.north);

const along = ([a, b]: readonly [GroundPoint, GroundPoint], metres: number): GroundPoint => {
  const length = lengthOf([a, b]) || 1;
  const share = Math.min(Math.max(metres / length, 0), 1);
  return { east: a.east + (b.east - a.east) * share, north: a.north + (b.north - a.north) * share };
};

/** The unit way out of a roof, square to its side. */
function outward(roof: Roof, side: number): GroundPoint {
  const [a, b] = ends(roof, side);
  const length = lengthOf([a, b]) || 1;
  const twice = roof.corners.reduce((sum, at, i) => {
    const next = cornerAfter(roof.corners, i);
    return sum + at.east * next.north - next.east * at.north;
  }, 0);
  // Anticlockwise from above, a roof lies to the left of each side: out is to the right.
  const right = { east: (b.north - a.north) / length, north: -(b.east - a.east) / length };
  return twice >= 0 ? right : { east: -right.east, north: -right.north };
}

/** Whether another roof takes the side at that share of it. */
function takenAt(edges: RoofsEdges, roof: number, side: number, share: number): boolean {
  return (edges[roof]?.[side] ?? []).some(
    (stretch) => stretch.other !== null && share >= stretch.from && share <= stretch.to,
  );
}

/** How far the roof under a stair room runs out in front of one of its sides; 0 where it does not. */
function openInFront(document: StudioDocument, room: Roof, side: number): number {
  const holder = standsOn(document, room);
  const under = holder === null ? undefined : document.roofs[holder];
  if (under === undefined) return 0;
  const middle = along(ends(room, side), lengthOf(ends(room, side)) / 2);
  const out = outward(room, side);
  const step = 0.1;
  let run = 0;
  while (run < 200) {
    const next = {
      east: middle.east + out.east * (run + step),
      north: middle.north + out.north * (run + step),
    };
    if (!pointInside(next, under.corners)) break;
    run += step;
  }
  return run;
}

/** The stair room's sides that may hold its stairs: open onto the roof round it, and not taken by another roof. */
export function stairsSidesOf(document: StudioDocument, edges: RoofsEdges, room: number): number[] {
  const roof = document.roofs[room];
  if (!isStairRoom(roof) || roof === undefined) return [];
  return roof.corners.flatMap((_, side) =>
    takenAt(edges, room, side, 0.5) || openInFront(document, roof, side) <= 0 ? [] : [side],
  );
}

/** Whether a side may hold the stairs now: no other roof takes it there, and a stair room's opens onto its roof. */
function holds(document: StudioDocument, edges: RoofsEdges, place: StairsPlace): boolean {
  const roof = document.roofs[place.roof];
  if (roof === undefined || place.side >= roof.corners.length) return false;
  const length = lengthOf(ends(roof, place.side)) || 1;
  if (takenAt(edges, place.roof, place.side, place.atM / length)) return false;
  return !isStairRoom(roof) || stairsSidesOf(document, edges, place.roof).includes(place.side);
}

/** The stairs a person placed, while their side may still hold them. */
function storedPlace(document: StudioDocument, edges: RoofsEdges) {
  for (const [roof, standing] of document.roofs.entries()) {
    const side = roofSidesOf(standing).findIndex((each) => each.stairsAt !== undefined);
    const stored = roofSidesOf(standing)[side];
    if (stored?.stairsAt === undefined) continue;
    const place = { roof, side, atM: stored.stairsAt };
    // A side another roof has come to take, or one that now looks off its roof, holds them no more.
    return holds(document, edges, place)
      ? { ...place, byPerson: stored.stairsBy === 'person' }
      : null;
  }
  return null;
}

/** The stairs as stored, or the first guess: the stair room side that opens onto the most roof. */
function stairsPlaceOf(
  document: StudioDocument,
  edges: RoofsEdges,
): (StairsPlace & { readonly byPerson: boolean }) | null {
  const stored = storedPlace(document, edges);
  if (stored !== null) return stored;
  let best: { roof: number; side: number; run: number } | null = null;
  for (const [room, standing] of document.roofs.entries()) {
    if (!isStairRoom(standing) || standsOn(document, standing) === null) continue;
    for (const side of stairsSidesOf(document, edges, room)) {
      const run = openInFront(document, standing, side);
      if (best === null || run > best.run) best = { roof: room, side, run };
    }
  }
  const standing = best === null ? undefined : document.roofs[best.roof];
  if (best === null || standing === undefined) return null;
  return {
    roof: best.roof,
    side: best.side,
    atM: lengthOf(ends(standing, best.side)) / 2,
    byPerson: false,
  };
}

/** Where the stairs are, and the clear strip in front of them; `null` when nothing says. */
export function stairsOf(
  document: StudioDocument,
  edges: RoofsEdges,
  clearPathM: number,
): StairsShown | null {
  const place = stairsPlaceOf(document, edges);
  const roof = place === null ? undefined : document.roofs[place.roof];
  if (place === null || roof === undefined || place.side >= roof.corners.length) return null;
  const side = ends(roof, place.side);
  const at = along(side, place.atM);
  const outside = !isStairRoom(roof);
  // In front of a stair room's door is the roof round it; in front of outside stairs, the roof itself.
  const out = outward(roof, place.side);
  const ahead = outside ? { east: -out.east, north: -out.north } : out;
  const length = lengthOf(side) || 1;
  const way = {
    east: (side[1].east - side[0].east) / length,
    north: (side[1].north - side[0].north) / length,
  };
  const half = clearPathM / 2;
  const corner = (across: number, deep: number): GroundPoint => ({
    east: at.east + way.east * across + ahead.east * deep,
    north: at.north + way.north * across + ahead.north * deep,
  });
  const strip = [
    corner(-half, 0),
    corner(half, 0),
    corner(half, STAIRS_STRIP_M),
    corner(-half, STAIRS_STRIP_M),
  ];
  return { ...place, at, outside, strip };
}

/** With no stairs placed and none guessed, the bar asks where they reach the roof, until skipped. */
export function stairsAsk(document: StudioDocument, stairs: StairsShown | null): boolean {
  return stairs === null && document.stairsSkipped !== true && document.roofs.length > 0;
}

/** The nearest point of a side to `point`, and how far along it, in metres. */
function onSide(roof: Roof, side: number, point: GroundPoint) {
  const [a, b] = ends(roof, side);
  const length = lengthOf([a, b]);
  const run =
    length === 0
      ? 0
      : Math.min(
          length,
          Math.max(
            0,
            ((point.east - a.east) * (b.east - a.east) +
              (point.north - a.north) * (b.north - a.north)) /
              length,
          ),
        );
  const at = along([a, b], run);
  return { run, length, far: Math.hypot(point.east - at.east, point.north - at.north) };
}

/** The stairs dropped on one side, or `null` where it is out of reach or another roof takes it. */
function dropOn(
  document: StudioDocument,
  edges: RoofsEdges,
  at: { readonly roof: number; readonly side: number },
  point: GroundPoint,
  magnet: boolean,
): (StairsDrop & { readonly far: number }) | null {
  const roof = document.roofs[at.roof] as Roof;
  const near = onSide(roof, at.side, point);
  if (near.length === 0) return null;
  if (!holds(document, edges, { ...at, atM: near.run })) return null;
  const pull = magnet ? pulledTo(near.run, near.length, isStairRoom(roof)) : null;
  const atM = pull?.atM ?? near.run;
  return {
    ...at,
    atM,
    at: along(ends(roof, at.side), atM),
    outside: !isStairRoom(roof),
    pulled: pull?.to ?? null,
    far: near.far,
  };
}

/**
 * Where the stairs land when dropped or tapped at `point`: the nearest side of a stair room or
 * roof edge within `reachM`, never where another roof takes it. With the magnet on, a side's
 * middle and an edge's ends pull it.
 */
export function stairsDropOf(
  document: StudioDocument,
  edges: RoofsEdges,
  point: GroundPoint,
  reachM: number,
  magnet: boolean,
): StairsDrop | null {
  const drops = document.roofs.flatMap((roof, index) =>
    roofKindOf(roof) === 'hole'
      ? []
      : roof.corners.map((_, side) =>
          dropOn(document, edges, { roof: index, side }, point, magnet),
        ),
  );
  const best = drops.reduce<(StairsDrop & { readonly far: number }) | null>(
    (found, each) =>
      each === null || each.far > reachM || (found !== null && each.far >= found.far)
        ? found
        : each,
    null,
  );
  if (best === null) return null;
  const { far: _far, ...drop } = best;
  return drop;
}

/** A side's middle pulls a stair room's stairs; an edge's middle and ends pull outside stairs. */
function pulledTo(run: number, length: number, room: boolean) {
  if (Math.abs(run - length / 2) <= STAIRS_PULL_M)
    return { atM: length / 2, to: 'middle' as const };
  if (room) return null;
  if (run <= STAIRS_PULL_M) return { atM: 0, to: 'end' as const };
  if (length - run <= STAIRS_PULL_M) return { atM: length, to: 'end' as const };
  return null;
}

/** The stairs placed by a person: only that side holds them. */
export function stairsPlaced(document: StudioDocument, place: StairsPlace): StudioDocument {
  const roofs = document.roofs.map((roof, index) => {
    const had = roofSidesOf(roof).some((side) => side.stairsAt !== undefined);
    if (!had && index !== place.roof) return roof;
    const sides = roofSidesOf(roof).map((side, i) => {
      const { stairsAt: _at, stairsBy: _by, ...rest } = side;
      return index === place.roof && i === place.side
        ? { ...rest, stairsAt: place.atM, stairsBy: 'person' as const }
        : rest;
    });
    return { ...roof, sides };
  });
  return { ...document, roofs };
}

/** "Where do the stairs reach the roof?" passed over: it is not asked again. */
export function stairsPassed(document: StudioDocument): StudioDocument {
  return { ...document, stairsSkipped: true };
}
