import type { Roof, RoofEdgeTrust } from './document';
import type { GroundPoint } from './ground';
import type { RoofSide } from './roof-parts';
import { CORNER_GAP_M } from './roof-shape';

/**
 * A roof on a new outline (`T-M05-002`, part e): after Join made two roofs one, or Cut to edge
 * trimmed one. Each side that still stands where it stood keeps what it held.
 */

const same = (a: GroundPoint, b: GroundPoint) =>
  Math.hypot(a.east - b.east, a.north - b.north) < CORNER_GAP_M;

/**
 * Each side of a new outline with what the side it came from held: a side that stands where a side
 * of one of the roofs stood keeps that side's trust and settings; a side the join or the cut made
 * is traced, with nothing of its own.
 */
function sidesKept(
  outline: readonly GroundPoint[],
  sources: readonly Roof[],
): { readonly edges: RoofEdgeTrust[]; readonly sides: RoofSide[] } {
  const edges: RoofEdgeTrust[] = [];
  const sides: RoofSide[] = [];
  outline.forEach((from, i) => {
    const to = outline[(i + 1) % outline.length] as GroundPoint;
    let trust: RoofEdgeTrust = 'traced';
    let side: RoofSide = {};
    for (const source of sources) {
      const count = source.corners.length;
      const at = source.corners.findIndex(
        (corner, j) =>
          same(corner, from) && same(source.corners[(j + 1) % count] as GroundPoint, to),
      );
      if (at < 0) continue;
      trust = source.edges[at] ?? 'traced';
      side = source.sides?.length === count ? (source.sides[at] ?? {}) : {};
    }
    edges.push(trust);
    sides.push(side);
  });
  return { edges, sides };
}

/** A roof on a new outline, each side keeping what it held where it still stands. */
export function reshaped(
  roof: Roof,
  outline: readonly GroundPoint[],
  sources: readonly Roof[],
): Roof {
  const { sides: _sides, ...rest } = roof;
  const kept = sidesKept(outline, sources);
  const own = kept.sides.some((side) => Object.keys(side).length > 0);
  return { ...rest, corners: outline, edges: kept.edges, ...(own ? { sides: kept.sides } : {}) };
}
