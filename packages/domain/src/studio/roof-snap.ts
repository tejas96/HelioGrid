import type { Roof } from './document';
import type { GroundPoint } from './ground';
import { between, cornerAfter, nearestOnSegment } from './roof-shape';

/**
 * What a corner snaps to while drawn or dragged (`T-M05-002`, part b): the design's other roofs,
 * and the magnet's holds — square or parallel to the roof's long side, level with an earlier corner
 * — each with the guide line it is held on.
 */

/** How near a spot must come to a corner, an edge or a line-up to snap onto it, in metres. */
export const SNAP_M = 0.5;
/**
 * How near a new side must come to square with, or parallel to, the roof's long side to be held
 * there, in degrees: gentle, so a wall that is truly a little off is drawn as tapped. A hold never
 * moves the corner more than `SNAP_M` either, so a long side drawn zoomed out is not pulled far.
 */
export const SNAP_DEGREES = 2;

/**
 * Whether the magnet is on (`T-M05-002`, part b): one switch, on until a person turns it off, and
 * off for a moment while Alt is held on a desktop. The account still holds the helpers a person
 * turned off (`studioHelpersOff`, the shape older studios wrote): any one off is the magnet off.
 */
export function magnetOf(off: readonly string[], free: boolean): boolean {
  return !free && off.length === 0;
}

/**
 * Who owns a corner or an edge a spot can snap to. The design's other roofs now; the building and
 * its neighbours from the height map join here (part g).
 */
export type SnapOwner = { readonly kind: 'roof'; readonly roof: number };

/** What a spot can snap to besides the roof in hand. */
export interface SnapTargets {
  readonly corners: readonly { readonly at: GroundPoint; readonly owner: SnapOwner }[];
  readonly edges: readonly {
    readonly from: GroundPoint;
    readonly to: GroundPoint;
    readonly owner: SnapOwner;
  }[];
}

export const NO_SNAP_TARGETS: SnapTargets = { corners: [], edges: [] };

/** The corners and edges of the design's roofs, except the roof at `except` — the one in hand. */
export function snapTargetsOf(roofs: readonly Roof[], except?: number): SnapTargets {
  const others = roofs.flatMap((roof, index) =>
    index === except ? [] : [{ roof, owner: { kind: 'roof', roof: index } as const }],
  );
  return {
    corners: others.flatMap(({ roof, owner }) => roof.corners.map((at) => ({ at, owner }))),
    edges: others.flatMap(({ roof, owner }) =>
      roof.corners.map((from, i) => ({ from, to: cornerAfter(roof.corners, i), owner })),
    ),
  };
}

/** What a spot snapped to, named on the small label beside it. */
export type RoofSnap =
  | { readonly kind: 'corner_of'; readonly owner: SnapOwner }
  | { readonly kind: 'edge_of'; readonly owner: SnapOwner }
  /** Against the inside of a roof's parapet: a roof dragged onto it stands clear of the wall. */
  | { readonly kind: 'inside_parapet'; readonly owner: SnapOwner }
  /** Square to the roof's long side. */
  | { readonly kind: 'square' }
  /** Parallel to the roof's long side. */
  | { readonly kind: 'parallel' }
  /**
   * Level with an earlier corner (`corner`, from 0): an L closes straight; `along` when the side is
   * held square or parallel as well.
   */
  | {
      readonly kind: 'lines_up';
      readonly corner: number;
      readonly along: 'square' | 'parallel' | null;
    }
  /** A corner dragged into a square corner. */
  | { readonly kind: 'square_corner' }
  /** A set length kept: the corner runs on the circle of `metres` round `centre`. */
  | { readonly kind: 'held'; readonly metres: number; readonly centre: GroundPoint };

/** A guide drawn across the map: the line through `through`, running `way` (one metre long). */
export interface Guide {
  readonly through: GroundPoint;
  readonly way: GroundPoint;
}

/** A guide through `through`, running `way`, scaled to one metre. */
export function guideOf(through: GroundPoint, way: GroundPoint): Guide {
  const reach = Math.hypot(way.east, way.north) || 1;
  return { through, way: { east: way.east / reach, north: way.north / reach } };
}

export interface Snapped {
  readonly point: GroundPoint;
  readonly snap: RoofSnap | null;
  /** The lines the spot is held on, drawn dashed across the map; none when nothing holds it. */
  readonly guides: readonly Guide[];
}

/** A spot on another roof's corner, then on its edge, when one lies within `SNAP_M`. */
export function snapToTargets(at: GroundPoint, targets: SnapTargets): Snapped | null {
  const corner = targets.corners.find((target) => between(target.at, at) <= SNAP_M);
  if (corner !== undefined) {
    return { point: corner.at, snap: { kind: 'corner_of', owner: corner.owner }, guides: [] };
  }
  let best: Snapped | null = null;
  let bestReach = SNAP_M;
  for (const edge of targets.edges) {
    const on = nearestOnSegment(at, edge.from, edge.to);
    const reach = between(on, at);
    if (reach <= bestReach) {
      bestReach = reach;
      const guide = { through: edge.from, way: unit(edge.from, edge.to) };
      best = { point: on, snap: { kind: 'edge_of', owner: edge.owner }, guides: [guide] };
    }
  }
  return best;
}

function unit(from: GroundPoint, to: GroundPoint): GroundPoint {
  const reach = between(from, to) || 1;
  return { east: (to.east - from.east) / reach, north: (to.north - from.north) / reach };
}

function dot(a: GroundPoint, b: GroundPoint): number {
  return a.east * b.east + a.north * b.north;
}

function along(from: GroundPoint, way: GroundPoint, metres: number): GroundPoint {
  return { east: from.east + way.east * metres, north: from.north + way.north * metres };
}

/** Square to a way: a quarter turn. */
const across = (way: GroundPoint): GroundPoint => ({ east: -way.north, north: way.east });

/**
 * The roof's long side so far, as a way (one metre long): what every hold is measured against, so
 * one side drawn a little off never bends the next. `null` before two corners.
 */
export function longSideOf(corners: readonly GroundPoint[]): GroundPoint | null {
  let best: { from: GroundPoint; to: GroundPoint; reach: number } | null = null;
  for (let i = 1; i < corners.length; i += 1) {
    const from = corners[i - 1] as GroundPoint;
    const to = corners[i] as GroundPoint;
    const reach = between(from, to);
    if (reach > 0 && (best === null || reach > best.reach)) best = { from, to, reach };
  }
  return best === null ? null : unit(best.from, best.to);
}

const free = (at: GroundPoint): Snapped => ({ point: at, snap: null, guides: [] });

/** The new side held square or parallel to the long side, when it leans within `SNAP_DEGREES`. */
function heldWay(
  long: GroundPoint,
  last: GroundPoint,
  at: GroundPoint,
): { way: GroundPoint; reach: number; along: 'square' | 'parallel' } | null {
  const side = { east: at.east - last.east, north: at.north - last.north };
  for (const [way, along] of [
    [long, 'parallel'],
    [across(long), 'square'],
  ] as const) {
    const lean = dot(side, way);
    const off = Math.abs(side.east * way.north - side.north * way.east);
    if ((Math.atan2(off, Math.abs(lean)) * 180) / Math.PI > SNAP_DEGREES) continue;
    const sign = lean < 0 ? -1 : 1;
    const held = { east: way.east * sign, north: way.north * sign };
    if (off > SNAP_M) return null;
    return { way: held, reach: Math.abs(lean), along };
  }
  return null;
}

/** An earlier corner a spot moving along `way` from `last` comes level with, within `SNAP_M`. */
function levelWith(
  earlier: readonly GroundPoint[],
  last: GroundPoint,
  way: GroundPoint,
  reach: number,
): { corner: number; reach: number } | null {
  let found: { corner: number; reach: number } | null = null;
  earlier.forEach((corner, index) => {
    const level = dot(way, { east: corner.east - last.east, north: corner.north - last.north });
    const off = Math.abs(level - reach);
    if (level > 0 && off <= SNAP_M && (found === null || off < Math.abs(found.reach - reach))) {
      found = { corner: index, reach: level };
    }
  });
  return found;
}

/** A free spot still lines up with an earlier corner, along the long side's frame. */
function linedUp(earlier: readonly GroundPoint[], long: GroundPoint, at: GroundPoint): Snapped {
  let point = at;
  let snap: RoofSnap | null = null;
  const guides: Guide[] = [];
  for (const axis of [long, across(long)]) {
    let best: { corner: number; off: number } | null = null;
    earlier.forEach((corner, index) => {
      const off = dot(axis, { east: corner.east - point.east, north: corner.north - point.north });
      if (Math.abs(off) <= SNAP_M && (best === null || Math.abs(off) < Math.abs(best.off))) {
        best = { corner: index, off };
      }
    });
    const found = best as { corner: number; off: number } | null;
    if (found !== null) {
      point = along(point, axis, found.off);
      snap = { kind: 'lines_up', corner: found.corner, along: null };
      guides.push({ through: earlier[found.corner] as GroundPoint, way: across(axis) });
    }
  }
  return { point, snap, guides };
}

/**
 * Where a tap lands while drawing, with the magnet on: onto another roof's corner or edge; else
 * held square or parallel to the roof's long side, within `SNAP_DEGREES`; and level with an earlier
 * corner. Each hold comes with the guide it is held on. With the magnet off, exactly where tapped.
 */
export function draftSpot(
  corners: readonly GroundPoint[],
  at: GroundPoint,
  targets: SnapTargets,
  magnet: boolean,
): Snapped {
  if (!magnet) return free(at);
  const onTarget = snapToTargets(at, targets);
  if (onTarget !== null) return onTarget;
  const last = corners.at(-1);
  const long = longSideOf(corners);
  if (last === undefined || long === null || between(last, at) === 0) return free(at);
  // The corners a line-up can name: not the last, whose line the new side already starts on.
  const earlier = corners.slice(0, -1);
  const held = heldWay(long, last, at);
  // A free spot never lines up with the corner before last: on the last side's own line, that
  // would make a straight-through corner.
  if (held === null) return linedUp(corners.slice(0, -2), long, at);
  const level = levelWith(earlier, last, held.way, held.reach);
  const guides: Guide[] = [{ through: last, way: held.way }];
  if (level === null) {
    return { point: along(last, held.way, held.reach), snap: { kind: held.along }, guides };
  }
  guides.push({ through: earlier[level.corner] as GroundPoint, way: across(held.way) });
  return {
    point: along(last, held.way, level.reach),
    snap: { kind: 'lines_up', corner: level.corner, along: held.along },
    guides,
  };
}
