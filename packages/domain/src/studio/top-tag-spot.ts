import type { GroundPoint } from './ground';
import { innerPoint, pointInside, roofArea, roofMiddle } from './roof-shape';

/**
 * Where a tag on a roof's top stands (`T-M05-002g`, the LiDAR heights view): on that roof's own
 * open top, never on a roof that stands on it — a stair room in its middle hides the middle, and
 * the two tags would read as one roof's.
 */

/** The shares of the way from the middle out to a corner, or to a side's middle, tried in turn. */
const OUT_SHARES = [0.5, 0.7] as const;

/**
 * A point on the roof's top that no taller roof over it covers: its inside point when that is
 * open, else the first open point out toward its corners and sides' middles; its inside point
 * where all are covered. `over`: the outlines of the roofs that stand taller on its ground.
 */
export function topTagSpot(
  corners: readonly GroundPoint[],
  over: readonly (readonly GroundPoint[])[],
): GroundPoint {
  const inner = innerPoint(corners);
  const open = (point: GroundPoint) =>
    pointInside(point, corners) && over.every((outline) => !pointInside(point, outline));
  if (open(inner)) return inner;
  const middle = roofMiddle(corners);
  const ends = corners.flatMap((corner, at) => {
    const next = corners[(at + 1) % corners.length] ?? corner;
    return [
      corner,
      { east: (corner.east + next.east) / 2, north: (corner.north + next.north) / 2 },
    ];
  });
  for (const share of OUT_SHARES) {
    for (const end of ends) {
      const point = {
        east: middle.east + (end.east - middle.east) * share,
        north: middle.north + (end.north - middle.north) * share,
      };
      if (open(point)) return point;
    }
  }
  return inner;
}

/**
 * Each roof's tag spot among the roofs of one building, in their order: a roof covers another's
 * top where it is the smaller and stands inside it — a stair room on its roof.
 */
export function topTagSpotsOf(outlines: readonly (readonly GroundPoint[])[]): GroundPoint[] {
  return outlines.map((corners, at) => {
    const area = roofArea(corners);
    const over = outlines.filter(
      (other, from) =>
        from !== at && roofArea(other) < area && pointInside(innerPoint(other), corners),
    );
    return topTagSpot(corners, over);
  });
}
