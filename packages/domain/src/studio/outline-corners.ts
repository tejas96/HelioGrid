import type { GroundPoint } from './ground';
import { between, nearestOnSegment } from './roof-shape';

/**
 * An outline cut to its corners (Douglas–Peucker): the one simplifier the height map's traced
 * buildings go through, on the server as they are traced and in the magnet, each at its own
 * tolerance.
 */

/** A run of points kept where it turns more than `tolerance` off its chord (Douglas–Peucker). */
function simplifiedRun(points: readonly GroundPoint[], tolerance: number): GroundPoint[] {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined || points.length < 3) return [...points];
  let farAt = 0;
  let far = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const off = between(
      points[i] as GroundPoint,
      nearestOnSegment(points[i] as GroundPoint, first, last),
    );
    if (off > far) {
      far = off;
      farAt = i;
    }
  }
  if (far <= tolerance) return [first, last];
  const head = simplifiedRun(points.slice(0, farAt + 1), tolerance);
  return [...head.slice(0, -1), ...simplifiedRun(points.slice(farAt), tolerance)];
}

/**
 * An outline kept to its true corners: split at the corner farthest from its first, each half
 * simplified, so a 40-step trace of a house reads as the house's few corners.
 */
export function outlineCorners(ring: readonly GroundPoint[], tolerance: number): GroundPoint[] {
  const first = ring[0];
  if (first === undefined || ring.length <= 4) return [...ring];
  let farAt = 0;
  for (let i = 1; i < ring.length; i += 1) {
    if (between(ring[i] as GroundPoint, first) > between(ring[farAt] as GroundPoint, first))
      farAt = i;
  }
  const out = simplifiedRun(ring.slice(0, farAt + 1), tolerance);
  const back = simplifiedRun([...ring.slice(farAt), first], tolerance);
  const corners = [...out.slice(0, -1), ...back.slice(0, -1)];
  return corners.length >= 3 ? corners : [...ring];
}
