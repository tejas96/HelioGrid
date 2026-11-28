import type { GroundPoint } from './ground';
import { between, nearestOnSegment } from './roof-shape';
import {
  GHOST_CATCH_REACHES,
  type RoofHold,
  SNAP_DEGREES,
  SNAP_M,
  SNAP_SOFT_REACHES,
  type SnapOwner,
  type Snapped,
  type SnapTargets,
} from './roof-snap';
import {
  across,
  along,
  cornerLinesOf,
  crossedOrOn,
  dot,
  heldOn,
  holdAt,
  linesNear,
  type SnapLine,
  snapToPoints,
  unit,
  wallLinesOf,
} from './roof-snap-lines';

/**
 * Where a spot lands while a roof (or a face) is drawn (`T-M05-002`, parts b and e): the magnet's
 * own holds — square or parallel to the long side, or for the first side to the roof beside it,
 * level with an earlier corner — with the other roofs' points and lines, crossed where two meet.
 */

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

/** The new side held square or parallel to `long`, when it leans within `SNAP_DEGREES`. */
function heldWay(
  long: GroundPoint,
  last: GroundPoint,
  at: GroundPoint,
  reach: number,
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
    if (off > reach) return null;
    return { way: held, reach: Math.abs(lean), along };
  }
  return null;
}

/** An earlier corner a spot moving along `way` from `last` comes level with, within reach. */
function levelWith(
  earlier: readonly GroundPoint[],
  last: GroundPoint,
  way: GroundPoint,
  far: number,
  reach: number,
): { corner: number; reach: number } | null {
  let found: { corner: number; reach: number } | null = null;
  earlier.forEach((corner, index) => {
    const level = dot(way, { east: corner.east - last.east, north: corner.north - last.north });
    const off = Math.abs(level - far);
    if (level > 0 && off <= reach && (found === null || off < Math.abs(found.reach - far))) {
      found = { corner: index, reach: level };
    }
  });
  return found;
}

/**
 * The magnet's own holds on a spot: where it lands and the lines it is held on. Held on two lines,
 * `single` is where the first alone holds it: the corner stays there unless the spot is on the
 * crossing, which shows as a ghost.
 */
interface OwnHeld {
  readonly point: GroundPoint;
  readonly lines: { line: SnapLine; snap: RoofHold }[];
  readonly single?: { readonly point: GroundPoint; readonly snap: RoofHold };
}

/** A free spot still lines up with an earlier corner, along the long side's frame. */
function linedUp(
  earlier: readonly GroundPoint[],
  long: GroundPoint,
  at: GroundPoint,
  reach: number,
): OwnHeld {
  let point = at;
  let single: OwnHeld['single'];
  const lines: { line: SnapLine; snap: RoofHold }[] = [];
  for (const axis of [long, across(long)]) {
    let best: { corner: number; off: number } | null = null;
    earlier.forEach((corner, index) => {
      const off = dot(axis, { east: corner.east - point.east, north: corner.north - point.north });
      if (Math.abs(off) <= reach && (best === null || Math.abs(off) < Math.abs(best.off))) {
        best = { corner: index, off };
      }
    });
    const found = best as { corner: number; off: number } | null;
    // A second line-up never takes the corner further than the reach from where it was tapped.
    if (found !== null && between(along(point, axis, found.off), at) <= reach) {
      const first = lines[0];
      if (first !== undefined) single = { point, snap: first.snap };
      point = along(point, axis, found.off);
      const snap: RoofHold = { kind: 'lines_up', corner: found.corner, along: null };
      const guide = { through: earlier[found.corner] as GroundPoint, way: across(axis) };
      lines.push({ line: { guide, hold: snap }, snap });
    }
  }
  return single === undefined ? { point, lines } : { point, lines, single };
}

/** The wall of another roof nearest a corner: what a roof's first side squares to. */
function nearestWall(
  last: GroundPoint,
  targets: SnapTargets,
): { way: GroundPoint; owner: SnapOwner } | null {
  let best: { way: GroundPoint; owner: SnapOwner; off: number } | null = null;
  for (const edge of targets.edges) {
    if (between(edge.from, edge.to) === 0) continue;
    const off = between(last, nearestOnSegment(last, edge.from, edge.to));
    if (best === null || off < best.off)
      best = { way: unit(edge.from, edge.to), owner: edge.owner, off };
  }
  return best;
}

/**
 * The magnet's own holds on a spot: square or parallel to the long side — for the first side, to
 * the roof beside it — and level with an earlier corner. `lines`: the lines it is held on.
 */
function ownHolds(
  corners: readonly GroundPoint[],
  at: GroundPoint,
  targets: SnapTargets,
  reach: number,
): OwnHeld {
  const last = corners.at(-1);
  if (last === undefined || between(last, at) === 0) return { point: at, lines: [] };
  const long = longSideOf(corners);
  if (long === null) {
    const wall = nearestWall(last, targets);
    const held = wall === null ? null : heldWay(wall.way, last, at, reach);
    if (wall === null || held === null) return { point: at, lines: [] };
    const snap: RoofHold = { kind: 'frame', along: held.along, owner: wall.owner };
    const line = { guide: { through: last, way: held.way }, hold: snap };
    return { point: along(last, held.way, held.reach), lines: [{ line, snap }] };
  }
  // The corners a line-up can name: not the last, whose line the new side already starts on.
  const earlier = corners.slice(0, -1);
  const held = heldWay(long, last, at, reach);
  // A free spot never lines up with the corner before last: on the last side's own line, that
  // would make a straight-through corner.
  if (held === null) return linedUp(corners.slice(0, -2), long, at, reach);
  const heldSnap: RoofHold = { kind: held.along };
  const heldLine = { guide: { through: last, way: held.way }, hold: heldSnap };
  const level = levelWith(earlier, last, held.way, held.reach, reach);
  // The two holds together never move the corner further than the reach: past it, square alone.
  if (level === null || between(along(last, held.way, level.reach), at) > reach) {
    return {
      point: along(last, held.way, held.reach),
      lines: [{ line: heldLine, snap: heldSnap }],
    };
  }
  const snap: RoofHold = { kind: 'lines_up', corner: level.corner, along: held.along };
  const levelLine = {
    guide: { through: earlier[level.corner] as GroundPoint, way: across(held.way) },
    hold: snap,
  };
  return {
    point: along(last, held.way, level.reach),
    lines: [
      { line: heldLine, snap },
      { line: levelLine, snap },
    ],
    single: { point: along(last, held.way, held.reach), snap: heldSnap },
  };
}

/**
 * Where a tap lands while drawing, with the magnet on: onto another roof's corner or the middle of
 * its wall; else held by the magnet's own holds and by the lines of other roofs' walls — and where
 * two of those cross within reach, a ghost there, taken by a spot on it. Each hold comes with the guide it is held
 * on, and a line a little out of reach shows faint. With the magnet off, exactly where tapped.
 * `reach`: how near a spot must come, in metres (the screen's reach at this zoom).
 */
export function draftSpot(
  corners: readonly GroundPoint[],
  at: GroundPoint,
  targets: SnapTargets,
  magnet: boolean,
  reach: number = SNAP_M,
): Snapped {
  if (!magnet) return free(at);
  const onPoint = snapToPoints(at, targets, reach);
  if (onPoint !== null) return onPoint;
  const own = ownHolds(corners, at, targets, reach);
  // Only the lines that can pull or show faint here: the rest of the site is never compared.
  const around = { points: [at], within: reach * SNAP_SOFT_REACHES };
  const walls = wallLinesOf(targets, around);
  const long = longSideOf(corners);
  const lines = long === null ? walls : [...walls, ...cornerLinesOf(targets, long, walls, around)];
  const { near, soft } = linesNear(at, lines, reach);
  const withSoft = (snapped: Snapped): Snapped =>
    soft.length === 0 ? snapped : { ...snapped, guides: [...snapped.guides, ...soft] };
  const [ownFirst, ownSecond] = own.lines;
  if (ownSecond !== undefined) {
    // Held on two of its own lines: their crossing is a corner, named by the last line-up made,
    // taken only by a spot on it; beside it, the first line alone holds and the crossing is a ghost.
    const guides = own.lines.map(({ line }) => line.guide);
    if (own.single === undefined || between(own.point, at) <= reach * GHOST_CATCH_REACHES)
      return withSoft({ point: own.point, snap: ownSecond.snap, guides });
    return withSoft({ point: own.single.point, snap: own.single.snap, guides, ghost: own.point });
  }
  if (ownFirst !== undefined) {
    return withSoft(crossedOrOn(at, { ...ownFirst, point: own.point }, near, reach));
  }
  const [nearest, ...rest] = near;
  if (nearest === undefined) return withSoft(free(at));
  const point = heldOn(at, nearest);
  return withSoft(
    crossedOrOn(at, { line: nearest, point, snap: holdAt(nearest, point) }, rest, reach),
  );
}
