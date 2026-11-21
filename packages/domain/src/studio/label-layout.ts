import type { RoofEdgeTrust } from './document';

/**
 * Where each length label sits on the screen (`T-M05-002`, part b). A label lies along its edge,
 * outside the roof, never upside down, at one size at every zoom. An edge too short for its label
 * sends the label out, with a thin line back to the edge. Where labels still touch, lengths from the
 * picture give way; a length a person set, a measured one, the active one and one a person tapped
 * to see always show. Everything here is in screen pixels: the screen measures, this decides.
 */

/** A point on the screen, in CSS pixels, y down. */
export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/** One edge's label, as the screen measured it. */
export interface LabelAsk {
  readonly from: ScreenPoint;
  readonly to: ScreenPoint;
  readonly trust: RoofEdgeTrust;
  /** The label's own size, in CSS pixels, before it is turned along the edge. */
  readonly width: number;
  readonly height: number;
  /** Always shown: the length being set, or one a person tapped to see. */
  readonly pinned: boolean;
  /**
   * Kept level, never turned along its edge: the length in hand, whose − and + are pressed. It
   * stands clear of its edge by its own reach across it, and is never sent out.
   */
  readonly level: boolean;
}

/** One roof's labels, edge i running from corner i to corner i + 1. */
export interface RoofLabelAsk {
  readonly corners: readonly ScreenPoint[];
  readonly labels: readonly LabelAsk[];
}

/** A control on the screen a label keeps off: a move or turn handle, by its middle and size. */
export interface KeepOff {
  readonly at: ScreenPoint;
  readonly width: number;
  readonly height: number;
}

export interface LabelPlace {
  /** The label's middle. */
  readonly at: ScreenPoint;
  /** The turn along the edge, in degrees clockwise, kept between −90 and 90: never upside down. */
  readonly degrees: number;
  /** Sent out past a short edge: the thin line runs from `leaderFrom` on the edge to the label. */
  readonly out: boolean;
  readonly leaderFrom: ScreenPoint | null;
  /** `false`: a picture length that gave way to another label. */
  readonly shown: boolean;
}

/** The gap between an edge and its label's near side: clear of the + dot on the edge's middle. */
export const LABEL_GAP_PX = 12;
/** How far a label sent out stands past where it would lie along its edge. */
export const LABEL_OUT_PX = 18;
/** Room a label keeps at each end of its edge, clear of the corner dots. */
export const LABEL_END_ROOM_PX = 10;

/** Whether a point lies inside a polygon (even-odd). */
function inside(point: ScreenPoint, corners: readonly ScreenPoint[]): boolean {
  let within = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const a = corners[i] as ScreenPoint;
    const b = corners[j] as ScreenPoint;
    if (a.y > point.y !== b.y > point.y) {
      const crossX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
      if (point.x < crossX) within = !within;
    }
  }
  return within;
}

/** The turn that reads left to right: an edge drawn right to left reads the same way round. */
function readableDegrees(from: ScreenPoint, to: ScreenPoint): number {
  const degrees = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  if (degrees > 90) return degrees - 180;
  if (degrees <= -90) return degrees + 180;
  return degrees;
}

/** A label's four corners, for the touch check. */
function boxOf(at: ScreenPoint, degrees: number, width: number, height: number): ScreenPoint[] {
  const r = (degrees * Math.PI) / 180;
  const ux = { x: Math.cos(r), y: Math.sin(r) };
  const uy = { x: -Math.sin(r), y: Math.cos(r) };
  const w = width / 2;
  const h = height / 2;
  return [
    [-w, -h],
    [w, -h],
    [w, h],
    [-w, h],
  ].map(([a, b]) => ({
    x: at.x + ux.x * (a as number) + uy.x * (b as number),
    y: at.y + ux.y * (a as number) + uy.y * (b as number),
  }));
}

/** Whether two turned boxes overlap (separating axes). */
function boxesTouch(a: readonly ScreenPoint[], b: readonly ScreenPoint[]): boolean {
  for (const box of [a, b]) {
    for (let i = 0; i < box.length; i++) {
      const p = box[i] as ScreenPoint;
      const q = box[(i + 1) % box.length] as ScreenPoint;
      const axis = { x: q.y - p.y, y: p.x - q.x };
      const span = (points: readonly ScreenPoint[]) => {
        const dots = points.map((pt) => pt.x * axis.x + pt.y * axis.y);
        return [Math.min(...dots), Math.max(...dots)] as const;
      };
      const [aMin, aMax] = span(a);
      const [bMin, bMax] = span(b);
      if (aMax <= bMin || bMax <= aMin) return false;
    }
  }
  return true;
}

interface Placed {
  readonly place: LabelPlace;
  readonly box: readonly ScreenPoint[];
  readonly keeps: boolean;
  readonly reach: number;
}

function placeOne(ask: LabelAsk, corners: readonly ScreenPoint[]): Placed {
  const { from, to, width, height } = ask;
  const reach = Math.hypot(to.x - from.x, to.y - from.y);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const degrees = ask.level ? 0 : readableDegrees(from, to);
  let normal =
    reach === 0 ? { x: 0, y: -1 } : { x: (to.y - from.y) / reach, y: -(to.x - from.x) / reach };
  if (inside({ x: mid.x + normal.x, y: mid.y + normal.y }, corners)) {
    normal = { x: -normal.x, y: -normal.y };
  }
  const out = !ask.level && width + 2 * LABEL_END_ROOM_PX > reach;
  // How far the label reaches across its edge: half its height when it lies along it.
  const across = ask.level
    ? (Math.abs(normal.x) * width) / 2 + (Math.abs(normal.y) * height) / 2
    : height / 2;
  const away = LABEL_GAP_PX + across + (out ? LABEL_OUT_PX : 0);
  const at = { x: mid.x + normal.x * away, y: mid.y + normal.y * away };
  const keeps = ask.pinned || ask.trust !== 'traced';
  return {
    place: { at, degrees, out, leaderFrom: out ? mid : null, shown: true },
    box: boxOf(at, degrees, width, height),
    keeps,
    reach,
  };
}

/**
 * Every roof's labels, in the order asked. The handles are laid first, then the labels that always
 * show; then the picture lengths, the longest first, each one shown only where it touches none laid
 * before it.
 */
export function labelLayoutOf(
  roofs: readonly RoofLabelAsk[],
  keepOff: readonly KeepOff[] = [],
): LabelPlace[][] {
  const placed = roofs.map((roof) => roof.labels.map((ask) => placeOne(ask, roof.corners)));
  const order = placed
    .flatMap((labels, r) => labels.map((label, e) => ({ label, r, e })))
    .sort((a, b) => Number(b.label.keeps) - Number(a.label.keeps) || b.label.reach - a.label.reach);
  const laid: (readonly ScreenPoint[])[] = keepOff.map((box) =>
    boxOf(box.at, 0, box.width, box.height),
  );
  const shown = placed.map((labels) => labels.map(() => true));
  for (const { label, r, e } of order) {
    const touches = laid.some((box) => boxesTouch(box, label.box));
    if (touches && !label.keeps) {
      (shown[r] as boolean[])[e] = false;
      continue;
    }
    laid.push(label.box);
  }
  return placed.map((labels, r) =>
    labels.map((label, e) => ({ ...label.place, shown: (shown[r] as boolean[])[e] as boolean })),
  );
}
