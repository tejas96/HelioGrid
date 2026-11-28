import type { GroundPoint } from './ground';
import { distanceToSegment, roofsOverlap } from './roof-shape';

/**
 * Roofs that touch (`T-M05-002`, parts b and g): two outlines within 30 cm are one building — LiDAR
 * moves them as one, and the magnet guides a drawing on it by every roof of it alone.
 */

/** Roofs on the ground this close are one building. */
export const SAME_BUILDING_M = 0.3;
/** What a centimetre-kept corner may be off by: 30 cm apart on paper is 30 cm. */
export const EDGE_SLACK_M = 1e-6;

/** How far apart two outlines are at their nearest; 0 where they touch or overlap. */
export function outlinesApart(one: readonly GroundPoint[], other: readonly GroundPoint[]): number {
  if (roofsOverlap(one, other)) return 0;
  let nearest = Number.POSITIVE_INFINITY;
  for (const [points, ring] of [
    [one, other],
    [other, one],
  ] as const) {
    for (const point of points) {
      for (let i = 0; i < ring.length; i += 1) {
        const a = ring[i] as GroundPoint;
        const b = ring[(i + 1) % ring.length] as GroundPoint;
        nearest = Math.min(nearest, distanceToSegment(point, a, b));
      }
    }
  }
  return nearest;
}
