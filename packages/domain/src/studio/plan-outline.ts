import type { PictureChoice, PictureStamp, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { LaidPlan } from './own-picture';
import { groundOnLaid, laidOnGround, turnInRange } from './own-picture-acts';
import { type DraftRefusal, draftClose } from './roof-draw';
import {
  CORNER_GAP_M,
  pointInside,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
  roofArea,
} from './roof-shape';

/**
 * A plan's closed outlines as roofs (`T-M05-002d`, board 4.3, 4.4): which outline a tap lands in,
 * its corners on the ground, and the roof it makes with the plan's exact lengths.
 */

const HALF_TURN_DEG = 180;

/** A corner this close to the straight line through its neighbours is no corner: it is dropped. */
const STRAIGHT_DEG = 2;

/** An outline's corners without repeats or corners on a straight run, at most `max`. */
function cornersOf(points: readonly GroundPoint[], gap: number, max: number): GroundPoint[] {
  const apart = points.filter((point, i) => {
    const next = points[(i + 1) % points.length] as GroundPoint;
    return Math.hypot(next.east - point.east, next.north - point.north) >= gap;
  });
  const bent = apart.filter((point, i) => {
    const before = apart[(i - 1 + apart.length) % apart.length] as GroundPoint;
    const after = apart[(i + 1) % apart.length] as GroundPoint;
    const turn =
      Math.atan2(after.north - point.north, after.east - point.east) -
      Math.atan2(point.north - before.north, point.east - before.east);
    const deg = Math.abs(turnInRange((turn * HALF_TURN_DEG) / Math.PI));
    return deg >= STRAIGHT_DEG;
  });
  return bent.length > max ? [] : bent;
}

/**
 * A plan's closed outline on the ground, as a roof's corners: `null` when it is no roof's shape — too
 * few corners once straight runs and repeats are dropped, or more than a roof may have.
 */
export function planOutlineCorners(
  plan: LaidPlan,
  points: readonly number[],
  limits: { readonly gap: number; readonly min: number; readonly max: number },
): GroundPoint[] | null {
  const ground: GroundPoint[] = [];
  for (let i = 0; i + 1 < points.length; i += 2) {
    ground.push(laidOnGround(plan, points[i] as number, points[i + 1] as number));
  }
  const corners = cornersOf(ground, limits.gap, limits.max);
  return corners.length < limits.min ? null : corners;
}

/** The trust a roof made from the plan gives its edges: exact when the plan's scale holds, else traced. */
export function planEdgeTrust(plan: LaidPlan): 'plan' | 'traced' {
  return plan.scaleFrom === 'guess' ? 'traced' : 'plan';
}

/**
 * A roof made from a tapped closed outline of the plan (board 4.4): its corners the outline's on
 * the ground, its edges exact when the plan's scale holds, checked as a drawn roof is. The first
 * roof keeps the picture it was drawn on (M04-10).
 */
export function roofFromPlanOutline(
  document: StudioDocument,
  points: readonly number[],
  made: {
    readonly id: string;
    readonly tracedOn: PictureChoice;
    readonly stamp: PictureStamp | null;
  },
):
  | { readonly kind: 'made'; readonly document: StudioDocument }
  | { readonly kind: 'refused'; readonly refusal: DraftRefusal | 'no_outline' } {
  const plan = document.plan;
  if (plan == null) return { kind: 'refused', refusal: 'no_outline' };
  const corners = planOutlineCorners(plan, points, {
    gap: CORNER_GAP_M,
    min: ROOF_CORNERS_MIN,
    max: ROOF_CORNERS_MAX,
  });
  if (corners === null) return { kind: 'refused', refusal: 'no_outline' };
  const close = draftClose(corners, document.roofs, made.id, made.tracedOn, false);
  if (close.kind === 'refused') return close;
  const trust = planEdgeTrust(plan);
  const roof = { ...close.roof, edges: close.roof.edges.map(() => trust) };
  const first = document.roofs.length === 0 && document.drawnOn === null;
  return {
    kind: 'made',
    document: {
      ...document,
      roofs: [...document.roofs, roof],
      drawnOn: first ? made.stamp : document.drawnOn,
    },
  };
}

/** What a tap on the ground does to a laid plan (board 4.3): makes a roof, picks it, or puts it down. */
export type PlanTap =
  | { readonly kind: 'outline'; readonly line: number }
  | { readonly kind: 'pick' }
  | { readonly kind: 'put_down' }
  | { readonly kind: 'none' };

/**
 * A tap at a spot of the ground, for a plan as it lies. Picked, a tap off it puts it down. Resting
 * and unlocked, a tap inside a closed outline makes that roof — the smallest outline holding the
 * spot, so a room inside the house is its own — and a tap elsewhere on it picks it. A locked or
 * hidden plan lets every tap through to the roof under it.
 */
export function planTapAt(
  plan: LaidPlan,
  lines: {
    readonly extent: {
      readonly west: number;
      readonly south: number;
      readonly east: number;
      readonly north: number;
    };
    readonly lines: readonly { readonly points: readonly number[]; readonly closed: boolean }[];
  },
  picked: boolean,
  spot: GroundPoint,
): PlanTap {
  if (plan.locked || plan.hidden) return { kind: 'none' };
  const at = groundOnLaid(plan, spot);
  const { west, south, east, north } = lines.extent;
  const onIt = at.x >= west && at.x <= east && at.y >= south && at.y <= north;
  if (picked) return onIt ? { kind: 'none' } : { kind: 'put_down' };
  if (!onIt) return { kind: 'none' };
  let best: { line: number; area: number } | null = null;
  lines.lines.forEach((line, index) => {
    if (!line.closed) return;
    const ring = pointsOf(line.points);
    if (!pointInside({ east: at.x, north: at.y }, ring)) return;
    const area = roofArea(ring);
    if (best === null || area < best.area) best = { line: index, area };
  });
  const found = best as { line: number; area: number } | null;
  return found === null ? { kind: 'pick' } : { kind: 'outline', line: found.line };
}

function pointsOf(points: readonly number[]): GroundPoint[] {
  const ring: GroundPoint[] = [];
  for (let i = 0; i + 1 < points.length; i += 2) {
    ring.push({ east: points[i] as number, north: points[i + 1] as number });
  }
  return ring;
}

/** Where a spot of the ground snaps on a plan (board 4.6): onto its corner, or onto its line. */
export interface PlanSnap {
  readonly point: GroundPoint;
  readonly on: 'corner' | 'line';
}

/**
 * A spot drawn near a laid plan, onto its nearest corner within `reachM`, else onto its nearest line;
 * `null` when the plan is hidden or nothing is in reach. Worked in the plan's own units, so a plan of
 * many thousand lines is read once per spot, never laid on the ground whole.
 */
export function planSnapAt(
  plan: LaidPlan,
  lines: readonly { readonly points: readonly number[]; readonly closed: boolean }[],
  spot: GroundPoint,
  reachM: number,
): PlanSnap | null {
  if (plan.hidden) return null;
  const at = groundOnLaid(plan, spot);
  const reach = reachM / plan.metresPerUnit;
  const corner = nearestCorner(lines, at, reach);
  const best = corner ?? nearestLine(lines, at, reach);
  if (best === null) return null;
  return { point: laidOnGround(plan, best.x, best.y), on: corner === null ? 'line' : 'corner' };
}

type Near = { x: number; y: number; d: number };
type Lines = readonly { readonly points: readonly number[]; readonly closed: boolean }[];

function nearestCorner(
  lines: Lines,
  at: { readonly x: number; readonly y: number },
  reach: number,
): Near | null {
  let best: Near | null = null;
  for (const { points } of lines) {
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i] as number;
      const y = points[i + 1] as number;
      const d = Math.hypot(x - at.x, y - at.y);
      if (d <= reach && (best === null || d < best.d)) best = { x, y, d };
    }
  }
  return best;
}

function nearestLine(
  lines: Lines,
  at: { readonly x: number; readonly y: number },
  reach: number,
): Near | null {
  let best: Near | null = null;
  for (const { points, closed } of lines) {
    const count = points.length / 2;
    const ends = closed ? count : count - 1;
    for (let i = 0; i < ends; i++) {
      const j = (i + 1) % count;
      const on = nearestOnLine(
        at,
        points[2 * i] as number,
        points[2 * i + 1] as number,
        points[2 * j] as number,
        points[2 * j + 1] as number,
      );
      if (on.d <= reach && (best === null || on.d < best.d)) best = on;
    }
  }
  return best;
}

function nearestOnLine(
  at: { readonly x: number; readonly y: number },
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { x: number; y: number; d: number } {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = dx * dx + dy * dy;
  const share =
    length === 0 ? 0 : Math.max(0, Math.min(1, ((at.x - x0) * dx + (at.y - y0) * dy) / length));
  const x = x0 + share * dx;
  const y = y0 + share * dy;
  return { x, y, d: Math.hypot(x - at.x, y - at.y) };
}
