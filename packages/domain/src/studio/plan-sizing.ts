import type { SetEdgeTrust, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { PICTURE_METRES_PER_UNIT_MAX, PICTURE_METRES_PER_UNIT_MIN } from './own-picture';
import { planOutlineCorners } from './plan-outline';
import { type EditResult, faultOf } from './roof-check';
import { LENGTH_MAX_M, LENGTH_MIN_M } from './roof-length';
import {
  between,
  CORNER_GAP_M,
  edgeLengths,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
} from './roof-shape';

/**
 * A plan laid at our guess — a PDF at 1:100 (`T-M05-002d`, DONE WHEN part d): the first length typed
 * on a roof made from it sizes the plan and every roof made from it, so their lengths are the plan's,
 * and the picture under them never moves.
 */

const LIMITS = { gap: CORNER_GAP_M, min: ROOF_CORNERS_MIN, max: ROOF_CORNERS_MAX };
/** A roof's corner and its outline's agree to this, in metres. */
const SAME_CORNER_M = 0.01;

/** Whether two rings are the same corners, from any start and either way round. */
function sameRing(a: readonly GroundPoint[], b: readonly GroundPoint[]): boolean {
  if (a.length !== b.length) return false;
  const n = a.length;
  const near = (p: GroundPoint | undefined, q: GroundPoint | undefined) =>
    p !== undefined && q !== undefined && between(p, q) < SAME_CORNER_M;
  for (let start = 0; start < n; start++) {
    const ahead = a.every((p, i) => near(p, b[(start + i) % n]));
    const back = a.every((p, i) => near(p, b[(start - i + n) % n]));
    if (ahead || back) return true;
  }
  return false;
}

/**
 * The roofs made from the plan's closed outlines while its scale is our guess: the ones its first
 * length sizes with it. None once the plan's scale is the file's or a person's.
 */
export function roofsOnPlan(
  document: StudioDocument,
  outlines: readonly (readonly number[])[],
): readonly number[] {
  const plan = document.plan;
  if (plan == null || plan.scaleFrom !== 'guess') return [];
  const rings = outlines
    .map((points) => planOutlineCorners(plan, points, LIMITS))
    .filter((ring): ring is GroundPoint[] => ring !== null);
  return document.roofs.flatMap((roof, i) =>
    rings.some((ring) => sameRing(ring, roof.corners)) ? [i] : [],
  );
}

/**
 * The first length on a roof made from the guessed plan: the plan and those roofs sized about that
 * roof's middle, the plan's scale now a person's — so the edges are the plan's, and the one typed
 * keeps its own trust. Refused as a first length on a picture is.
 */
export function planSizedByLength(
  document: StudioDocument,
  planRoofs: readonly number[],
  roofIndex: number,
  edge: number,
  metres: number,
  trust: SetEdgeTrust,
): EditResult {
  if (metres < LENGTH_MIN_M) return { kind: 'refused', refusal: 'too_short' };
  if (metres > LENGTH_MAX_M) return { kind: 'refused', refusal: 'too_long' };
  const plan = document.plan;
  const roof = document.roofs[roofIndex];
  const traced = roof === undefined ? 0 : (edgeLengths(roof.corners)[edge] ?? 0);
  if (plan == null || roof === undefined || traced <= 0) {
    return { kind: 'refused', refusal: 'scale_out_of_range' };
  }
  const k = metres / traced;
  const metresPerUnit = plan.metresPerUnit * k;
  if (metresPerUnit < PICTURE_METRES_PER_UNIT_MIN || metresPerUnit > PICTURE_METRES_PER_UNIT_MAX) {
    return { kind: 'refused', refusal: 'scale_out_of_range' };
  }
  const middle = {
    east: roof.corners.reduce((sum, c) => sum + c.east, 0) / roof.corners.length,
    north: roof.corners.reduce((sum, c) => sum + c.north, 0) / roof.corners.length,
  };
  const scaled = (p: GroundPoint): GroundPoint => ({
    east: middle.east + (p.east - middle.east) * k,
    north: middle.north + (p.north - middle.north) * k,
  });
  const roofs = document.roofs.map((r, i) =>
    planRoofs.includes(i)
      ? {
          ...r,
          corners: r.corners.map(scaled),
          edges: r.edges.map((_, j) => (i === roofIndex && j === edge ? trust : ('plan' as const))),
        }
      : r,
  );
  const sized: StudioDocument = {
    ...document,
    plan: { ...plan, metresPerUnit, at: scaled(plan.at), scaleFrom: 'person' },
    roofs,
  };
  for (const i of planRoofs) {
    const fault = faultOf(roofs[i]?.corners ?? []);
    if (fault !== null) return { kind: 'refused', refusal: fault };
  }
  return { kind: 'done', document: sized };
}
