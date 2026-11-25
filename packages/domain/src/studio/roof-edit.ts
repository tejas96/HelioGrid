import { cornerRoom, lengthHeld, type RoofEdgeTrust, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { type DragResult, type EditResult, faultOf, roofAt, withRoof } from './roof-check';
import {
  between,
  CORNER_GAP_M,
  cornerAfter,
  cornerBefore,
  edgeLengths,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
} from './roof-shape';
import { roofWithCorner, roofWithoutCorner } from './roof-sides';
import { type Guide, guideOf, type RoofSnap, SNAP_M, snapTargetsOf } from './roof-snap';
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
 * Fixing a roof's shape once it stands (`T-M05-002`, part b): drag a corner with the magnet, add
 * one with the +, remove a picked one (moving and turning a whole roof: `roof-move.ts`). A drag
 * hands back the roof as it would stand, what it snapped to, and why it would go back.
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

interface Placed {
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
function cornerMagnet(
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
  const walls = wallLinesOf(targets);
  const long = longSideOf(corners);
  const lines = long === null ? walls : [...walls, ...cornerLinesOf(targets, long, walls)];
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
    wallLinesOf(snapTargetsOf(document.roofs, roofIndex)),
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
function heldPlaced(
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

/**
 * A corner dragged to `to`. The magnet, when on, pulls it within `reach` and lets go as the finger
 * moves on; off, the corner goes exactly where it is dragged.
 * A typed neighbour edge keeps its length: the corner slides round that edge's other end, and with
 * the magnet on stops where that circle crosses another roof's wall line. Two typed neighbours hold
 * the corner still. A fault means the roof goes back when the drag ends.
 */
export function cornerDragged(
  document: StudioDocument,
  roofIndex: number,
  corner: number,
  to: GroundPoint,
  magnet: boolean,
  /** How near a spot must come to snap, in metres: the screen's reach at this zoom. */
  reach: number = SNAP_M,
): DragResult {
  const roof = roofAt(document, roofIndex);
  const { corners, edges } = roof;
  const count = corners.length;
  const beforeEdge = (corner - 1 + count) % count;
  const heldBefore = lengthHeld(edges[beforeEdge] ?? 'traced');
  const heldAfter = lengthHeld(edges[corner] ?? 'traced');
  if (heldBefore && heldAfter) return { document, snap: null, fault: 'two_held', guides: [] };
  const held = heldBefore || heldAfter ? (heldBefore ? beforeEdge : corner) : null;
  const placed =
    held === null
      ? magnet
        ? cornerMagnet(corners, corner, to, document, roofIndex, reach)
        : { point: to, snap: null, guides: [] }
      : heldPlaced(corners, held, held === corner, to, magnet, { document, roofIndex, reach });
  const moved = corners.map((c, i) => (i === corner ? placed.point : c));
  return {
    document: withRoof(document, roofIndex, { ...roof, corners: moved }),
    snap: placed.snap,
    fault: faultOf(moved),
    guides: placed.guides,
  };
}

/** The + on an edge: a corner at its middle, ready to drag. Both halves are traced. */
export function cornerAdded(document: StudioDocument, roofIndex: number, edge: number): EditResult {
  const roof = roofAt(document, roofIndex);
  if (roof.corners.length >= ROOF_CORNERS_MAX || cornerRoom(document.roofs) < 1) {
    return { kind: 'refused', refusal: 'too_many_corners' };
  }
  const start = roof.corners[edge] as GroundPoint;
  const end = cornerAfter(roof.corners, edge);
  // Its middle would stand within the corner gap of both ends: no room for a corner.
  if (between(start, end) < 2 * CORNER_GAP_M) return { kind: 'refused', refusal: 'too_close' };
  const middle = { east: (start.east + end.east) / 2, north: (start.north + end.north) / 2 };
  const corners = [...roof.corners.slice(0, edge + 1), middle, ...roof.corners.slice(edge + 1)];
  const edges: RoofEdgeTrust[] = [
    ...roof.edges.slice(0, edge),
    'traced',
    'traced',
    ...roof.edges.slice(edge + 1),
  ];
  const added = roofWithCorner(roof, edge, middle, { corners, edges });
  return { kind: 'done', document: withRoof(document, roofIndex, added) };
}

/** The corner of a roof nearest a point: where a finger on crowded dots meant to hold. */
export function cornerNearest(corners: readonly GroundPoint[], at: GroundPoint): number {
  let best = 0;
  corners.forEach((corner, i) => {
    if (between(corner, at) < between(corners[best] as GroundPoint, at)) best = i;
  });
  return best;
}

/** × on a picked corner: it goes, and its two edges join as one traced edge. A roof keeps three. */
export function cornerRemoved(
  document: StudioDocument,
  roofIndex: number,
  corner: number,
): EditResult {
  const roof = roofAt(document, roofIndex);
  const count = roof.corners.length;
  if (count <= ROOF_CORNERS_MIN) return { kind: 'refused', refusal: 'keeps_three' };
  const corners = roof.corners.filter((_, i) => i !== corner);
  const beforeEdge = (corner - 1 + count) % count;
  // The edge before the corner becomes the joined edge; the edge after it goes.
  const edges = roof.edges
    .map((trust, i): RoofEdgeTrust => (i === beforeEdge ? 'traced' : trust))
    .filter((_, i) => i !== corner);
  const fault = faultOf(corners);
  if (fault !== null) return { kind: 'refused', refusal: fault };
  const removed = roofWithoutCorner(roof, corner, { corners, edges });
  return { kind: 'done', document: withRoof(document, roofIndex, removed) };
}
