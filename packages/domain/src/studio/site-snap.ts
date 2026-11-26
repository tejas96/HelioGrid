import type { GroundPoint } from './ground';
import { outlineCorners } from './outline-corners';
import { between, nearestOnSegment } from './roof-shape';
import { ringTargets, type SnapTargets } from './roof-snap';

/**
 * The site's buildings as the magnet reads them (`T-M05-002`, part g): each outline the height map
 * traced, simplified to its true corners — a traced outline steps along every cell of its walls,
 * and a magnet on every step fumbles — and each of its walls that is an eave named so.
 */

/** A site's buildings as the magnet reads them: each outline, and each eave along one. */
export interface SiteSnap {
  readonly outlines: readonly (readonly GroundPoint[])[];
  readonly eaves: readonly {
    readonly from: GroundPoint;
    readonly to: GroundPoint;
    readonly building: number;
  }[];
}

/** A traced wall's steps within this of its true line are dropped: a parapet's width. */
export const OUTLINE_TRUE_M = 0.6;
/** An eave lies along a simplified wall when its middle is within this of it and they run alike. */
const EAVE_ON_WALL_M = OUTLINE_TRUE_M;
const EAVE_ALIKE_COS = 0.98;

const wayOf = (from: GroundPoint, to: GroundPoint) => {
  const length = between(from, to) || 1;
  return { east: (to.east - from.east) / length, north: (to.north - from.north) / length };
};

/** Whether an eave runs along a wall: its middle on the wall, the two running alike. */
function eaveAlong(eave: SiteSnap['eaves'][number], from: GroundPoint, to: GroundPoint): boolean {
  const middle = {
    east: (eave.from.east + eave.to.east) / 2,
    north: (eave.from.north + eave.to.north) / 2,
  };
  if (between(middle, nearestOnSegment(middle, from, to)) > EAVE_ON_WALL_M) return false;
  const a = wayOf(eave.from, eave.to);
  const b = wayOf(from, to);
  return Math.abs(a.east * b.east + a.north * b.north) >= EAVE_ALIKE_COS;
}

/**
 * The site's buildings as snap targets: each simplified outline's corners and walls; a wall an
 * eave runs along is owned by the eave, so the label names it.
 */
export function siteSnapTargets(site: SiteSnap): SnapTargets {
  const walls = ringTargets(
    site.outlines.map((ring, building) => ({
      ring: outlineCorners(ring, OUTLINE_TRUE_M),
      owner: { kind: 'building', building } as const,
    })),
  );
  return {
    corners: walls.corners,
    edges: walls.edges.map((edge) =>
      edge.owner.kind === 'building' &&
      site.eaves.some((eave) => eaveAlong(eave, edge.from, edge.to))
        ? { ...edge, owner: { kind: 'eave', building: edge.owner.building } }
        : edge,
    ),
  };
}
