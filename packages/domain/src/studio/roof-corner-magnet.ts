import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { between, cornerAfter, cornerBefore, edgeLengths, ROOF_CORNERS_MIN } from './roof-shape';
import { type Guide, guideOf, type RoofSnap, SNAP_SOFT_REACHES, snapTargetsOf } from './roof-snap';
import {
  cornerLinesOf,
  heldOn,
  holdAt,
  lineCross,
  linesCross,
  linesNear,
  ontoLine,
  type SnapLine,
  snapToPoints,
  wallLinesOf,
} from './roof-snap-lines';
import { longSideOf } from './roof-snap-spot';

/**
 * Where a corner dragged on a standing roof snaps (`T-M05-002`, parts b and e): other roofs'
 * corners, wall middles, walls and their lines, a square corner, and a typed length's circle
 * where it meets a wall line. The drag itself is `roof-edit.ts`'s.
 */

/** Square to the edge from `from` to `to`, at `to`: the way a line runs that makes a square corner there. */
function squareAt(from: GroundPoint, to: GroundPoint): GroundPoint {
  return { east: -(to.north - from.north), north: to.east - from.east };
}

/** The two sides of a square corner at `point`, as guides. */
function sidesAt(point: GroundPoint, before: GroundPoint, after: GroundPoint): Guide[] {
  const way = (to: GroundPoint) => ({ east: to.east - point.east, north: to.north - point.north });
  return [guideOf(point, way(before)), guideOf(point, way(after))];
}

export interface Placed {
  readonly point: GroundPoint;
  readonly snap: RoofSnap | null;
  readonly guides: readonly Guide[];
}

type Candidate = { point: GroundPoint | null; snap: RoofSnap; guides: readonly Guide[] };

/** Where each square line crosses each wall line near: a corner square and on the wall line. */
function wallCrosses(squares: readonly SnapLine[], near: readonly SnapLine[]): Candidate[] {
  return near.flatMap((wall) =>
    squares.flatMap((square) => {
      const point = linesCross(square, wall);
      if (point === null) return [];
      const snap: RoofSnap = { kind: 'cross', first: square.hold, second: holdAt(wall, point) };
      return [{ point, snap, guides: [square.guide, wall.guide] }];
    }),
  );
}

/** The spot held on each wall line near; `edgeOnly`: only where that lies on the wall itself. */
function onWalls(to: GroundPoint, near: readonly SnapLine[], edgeOnly: boolean): Candidate[] {
  return near.flatMap((wall) => {
    const point = heldOn(to, wall);
    const snap = holdAt(wall, point);
    return edgeOnly && snap.kind !== 'edge_of' ? [] : [{ point, snap, guides: [wall.guide] }];
  });
}

/**
 * Where a dragged corner snaps: another roof's corner or the middle of its wall; square at a
 * neighbour where that crosses another roof's wall line; another roof's wall; a square corner — at
 * both of its neighbours, or at itself; square at one neighbour; another roof's wall line past its
 * ends. Each within `reach`; the first found wins.
 */
export function cornerMagnet(
  corners: readonly GroundPoint[],
  corner: number,
  to: GroundPoint,
  document: StudioDocument,
  roofIndex: number,
  reach: number,
): Placed {
  const targets = snapTargetsOf(document.roofs, roofIndex);
  const onPoint = snapToPoints(to, targets, reach);
  if (onPoint !== null) return onPoint;
  const before = cornerBefore(corners, corner);
  const after = cornerAfter(corners, corner);
  const beforeThat = cornerBefore(corners, (corner - 1 + corners.length) % corners.length);
  const afterThat = cornerAfter(corners, (corner + 1) % corners.length);
  const wayAtBefore = squareAt(beforeThat, before);
  const wayAtAfter = squareAt(afterThat, after);
  const around = { points: [to], within: reach * SNAP_SOFT_REACHES };
  const walls = wallLinesOf(targets, around);
  const long = longSideOf(corners);
  const lines = long === null ? walls : [...walls, ...cornerLinesOf(targets, long, walls, around)];
  const { near, soft } = linesNear(to, lines, reach);
  const squares: SnapLine[] =
    corners.length > ROOF_CORNERS_MIN
      ? [
          { guide: guideOf(before, wayAtBefore), hold: { kind: 'square' } },
          { guide: guideOf(after, wayAtAfter), hold: { kind: 'square' } },
        ]
      : [];
  // Square at a neighbour and on another roof's wall line; then onto another roof's wall itself.
  const candidates: Candidate[] = [...wallCrosses(squares, near), ...onWalls(to, near, true)];
  if (corners.length > ROOF_CORNERS_MIN) {
    candidates.push({
      point: lineCross(before, wayAtBefore, after, wayAtAfter),
      snap: { kind: 'square_corner' },
      guides: [guideOf(before, wayAtBefore), guideOf(after, wayAtAfter)],
    });
  }
  // Square at itself: on the circle whose diameter joins its two neighbours.
  const centre = { east: (before.east + after.east) / 2, north: (before.north + after.north) / 2 };
  const radius = between(before, after) / 2;
  const fromCentre = between(centre, to);
  if (fromCentre > 0) {
    const point = {
      east: centre.east + ((to.east - centre.east) / fromCentre) * radius,
      north: centre.north + ((to.north - centre.north) / fromCentre) * radius,
    };
    candidates.push({
      point,
      snap: { kind: 'square_corner' },
      guides: sidesAt(point, before, after),
    });
  }
  if (corners.length > ROOF_CORNERS_MIN) {
    const lines = [
      {
        point: ontoLine(to, before, wayAtBefore),
        snap: { kind: 'square' } as const,
        guides: [guideOf(before, wayAtBefore)],
      },
      {
        point: ontoLine(to, after, wayAtAfter),
        snap: { kind: 'square' } as const,
        guides: [guideOf(after, wayAtAfter)],
      },
    ].sort((x, y) => between(x.point, to) - between(y.point, to));
    candidates.push(...lines);
  }
  // On another roof's wall line, past the wall's ends.
  candidates.push(...onWalls(to, near, false));
  const found = candidates.find(
    (c): c is { point: GroundPoint; snap: RoofSnap; guides: readonly Guide[] } =>
      c.point !== null && between(c.point, to) <= reach,
  );
  // A line a little out of reach shows faint before it pulls, as while drawing.
  const placed = found ?? { point: to, snap: null, guides: [] };
  return { ...placed, guides: [...placed.guides, ...soft] };
}

/** A corner kept `metres` from `centre`, on the way to `to`: a typed length held. */
function onCircle(centre: GroundPoint, metres: number, to: GroundPoint): Placed {
  const far = between(centre, to) || 1;
  return {
    point: {
      east: centre.east + ((to.east - centre.east) / far) * metres,
      north: centre.north + ((to.north - centre.north) / far) * metres,
    },
    snap: { kind: 'held', metres, centre },
    guides: [],
  };
}

/**
 * A corner held at a typed length from `centre`, moved to where that circle crosses another roof's
 * wall line, when one crossing lies within reach.
 */
function heldOnWall(
  placed: Placed,
  centre: GroundPoint,
  metres: number,
  document: StudioDocument,
  roofIndex: number,
  reach: number,
): Placed {
  const held = placed.snap;
  if (held === null || held.kind === 'cross') return placed;
  const { near } = linesNear(
    placed.point,
    wallLinesOf(snapTargetsOf(document.roofs, roofIndex), {
      points: [placed.point],
      within: reach,
    }),
    reach,
  );
  for (const wall of near) {
    const foot = ontoLine(centre, wall.guide.through, wall.guide.way);
    const off = between(centre, foot);
    if (off > metres) continue;
    const half = Math.sqrt(metres * metres - off * off);
    const { way } = wall.guide;
    const point = [
      { east: foot.east + way.east * half, north: foot.north + way.north * half },
      { east: foot.east - way.east * half, north: foot.north - way.north * half },
    ].sort((a, b) => between(a, placed.point) - between(b, placed.point))[0] as GroundPoint;
    if (between(point, placed.point) <= reach) {
      return {
        point,
        snap: { kind: 'cross', first: held, second: holdAt(wall, point) },
        guides: [wall.guide],
      };
    }
  }
  return placed;
}

/**
 * The corner in hand kept on the typed length of edge `edge`, whose other end holds still: the
 * corner after it when `after`, else the corner before.
 */
export function heldPlaced(
  corners: readonly GroundPoint[],
  edge: number,
  after: boolean,
  to: GroundPoint,
  magnet: boolean,
  on: { document: StudioDocument; roofIndex: number; reach: number },
): Placed {
  const anchor = after ? cornerAfter(corners, edge) : (corners[edge] as GroundPoint);
  const metres = edgeLengths(corners)[edge] ?? 0;
  const placed = onCircle(anchor, metres, to);
  return magnet ? heldOnWall(placed, anchor, metres, on.document, on.roofIndex, on.reach) : placed;
}
