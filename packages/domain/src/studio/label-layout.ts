import { lengthHeld, type RoofEdgeTrust } from './document';

/**
 * Where each length label sits on the screen (`T-M05-002`, part b). A label lies along its edge,
 * outside the roof, never upside down, at one size at every zoom. An edge too short for its label
 * sends the label farther out, and a label steps out past every corner's touch target, so a tap on
 * it always opens it. Where labels still touch, lengths from the
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
  /** `false`: a picture length that gave way to another label. */
  readonly shown: boolean;
}

/**
 * The gap between an edge and its label's near side: past the + dot's whole touch target (44 px
 * across, on the edge's middle), so a tap on the small label never lands on the + instead.
 */
export const LABEL_GAP_PX = 22;
/** How far a label sent out stands past where it would lie along its edge. */
export const LABEL_OUT_PX = 18;
/** Room a label keeps at each end of its edge, clear of the corner dots. */
export const LABEL_END_ROOM_PX = 10;
/** A corner dot's touch target, square round its corner: a label keeps out of every one. */
export const CORNER_TOUCH_PX = 44;
/** A label moves out from its edge in steps this long, and no farther than this, to clear them. */
const CLEAR_STEP_PX = 2;
const CLEAR_MOST_PX = 64;

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

/** How far two boxes may cross and still only meet: well under a pixel, for a turn's rounding. */
const MEET_PX = 1e-6;

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
      // Boxes that only meet along a side do not touch, a turned box's rounding included.
      if (aMax <= bMin + MEET_PX || bMax <= aMin + MEET_PX) return false;
    }
  }
  return true;
}

/** A corner's touch target, laid once per layout: its square, and the square's bounds. */
interface CornerTouch {
  readonly box: readonly ScreenPoint[];
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

function touchOf(corner: ScreenPoint): CornerTouch {
  const half = CORNER_TOUCH_PX / 2;
  return {
    box: boxOf(corner, 0, CORNER_TOUCH_PX, CORNER_TOUCH_PX),
    left: corner.x - half,
    right: corner.x + half,
    top: corner.y - half,
    bottom: corner.y + half,
  };
}

/** Whether a label's box stays out of every corner's touch target, of every roof on the screen. */
function clearOfCorners(box: readonly ScreenPoint[], touches: readonly CornerTouch[]): boolean {
  const xs = box.map((p) => p.x);
  const ys = box.map((p) => p.y);
  const [left, right] = [Math.min(...xs), Math.max(...xs)];
  const [top, bottom] = [Math.min(...ys), Math.max(...ys)];
  return !touches.some(
    (t) =>
      // Far apart by their bounds: no need for the full test.
      left < t.right &&
      right > t.left &&
      top < t.bottom &&
      bottom > t.top &&
      boxesTouch(box, t.box),
  );
}

/**
 * How much farther out a label stands so a tap on it never lands on a corner: the first step that
 * clears them all, or none when no step within reach does (it then stays where it lay).
 */
function clearing(
  start: number,
  boxAt: (away: number) => readonly ScreenPoint[],
  touches: readonly CornerTouch[],
): number {
  for (let more = 0; more <= CLEAR_MOST_PX; more += CLEAR_STEP_PX) {
    if (clearOfCorners(boxAt(start + more), touches)) return more;
  }
  return 0;
}

interface Placed {
  readonly place: LabelPlace;
  readonly box: readonly ScreenPoint[];
  readonly keeps: boolean;
  readonly reach: number;
}

function placeOne(
  ask: LabelAsk,
  corners: readonly ScreenPoint[],
  touches: readonly CornerTouch[],
): Placed {
  const { from, to, width, height } = ask;
  const reach = Math.hypot(to.x - from.x, to.y - from.y);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const degrees = ask.level ? 0 : readableDegrees(from, to);
  let normal =
    reach === 0 ? { x: 0, y: -1 } : { x: (to.y - from.y) / reach, y: -(to.x - from.x) / reach };
  if (inside({ x: mid.x + normal.x, y: mid.y + normal.y }, corners)) {
    normal = { x: -normal.x, y: -normal.y };
  }
  const short = !ask.level && width + 2 * LABEL_END_ROOM_PX > reach;
  // How far the label reaches across its edge: half its height when it lies along it.
  const across = ask.level
    ? (Math.abs(normal.x) * width) / 2 + (Math.abs(normal.y) * height) / 2
    : height / 2;
  const start = LABEL_GAP_PX + across + (short ? LABEL_OUT_PX : 0);
  const atAway = (away: number) => ({ x: mid.x + normal.x * away, y: mid.y + normal.y * away });
  // The length in hand stays where its − and + are held: it never steps away from the finger.
  const more = ask.level
    ? 0
    : clearing(start, (away) => boxOf(atAway(away), degrees, width, height), touches);
  const at = atAway(start + more);
  const keeps = ask.pinned || lengthHeld(ask.trust);
  return {
    place: { at, degrees, shown: true },
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
  const touches = roofs.flatMap((roof) => roof.corners.map(touchOf));
  const placed = roofs.map((roof) =>
    roof.labels.map((ask) => placeOne(ask, roof.corners, touches)),
  );
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

/** The free room on the screen a tag stays inside, in CSS pixels: the map less what stands on it. */
export interface TagRoom {
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

/** A tag beside a spot — what it snapped to, or why it cannot go there — as the screen measured it. */
export interface TagAsk {
  readonly spot: ScreenPoint;
  readonly width: number;
  readonly height: number;
  readonly room: TagRoom;
  /** How far the tag's near side stands from the spot, across. */
  readonly gap: number;
  /** How far the tag's near side stands from the spot, up or down. */
  readonly clear: number;
}

/**
 * Where a tag beside a spot sits: its top-left corner, from the spot. It stands above and to the
 * right of the spot; to the left where the right has no room, so its words are never cut at the
 * map's edge; held inside the room where neither side has it; below where the top has none.
 */
export function tagPlaceOf({ spot, width, height, room, gap, clear }: TagAsk): ScreenPoint {
  const right = spot.x + gap;
  const left = spot.x - gap - width;
  const start =
    right + width <= room.right
      ? right
      : left >= room.left
        ? left
        : Math.max(room.left, Math.min(right, room.right - width));
  const above = spot.y - clear - height;
  const top = above >= room.top ? above : spot.y + clear;
  return { x: start - spot.x, y: top - spot.y };
}

/** A level label where it was laid, and the edge middle it stands out from. */
export interface LevelAsk {
  readonly at: ScreenPoint;
  readonly from: ScreenPoint;
  readonly width: number;
  readonly height: number;
}

/**
 * A level label that sits on a mark it must keep off — the first corner of the roof being drawn —
 * steps on out from its edge until it is clear; where no step within reach is clear, it stays.
 */
export function levelClearOf(ask: LevelAsk, keepOff: readonly KeepOff[]): ScreenPoint {
  const { at, from, width, height } = ask;
  const reach = Math.hypot(at.x - from.x, at.y - from.y) || 1;
  const out = { x: (at.x - from.x) / reach, y: (at.y - from.y) / reach };
  const boxes = keepOff.map((box) => boxOf(box.at, 0, box.width, box.height));
  for (let more = 0; more <= CLEAR_MOST_PX; more += CLEAR_STEP_PX) {
    const step = { x: at.x + out.x * more, y: at.y + out.y * more };
    const box = boxOf(step, 0, width, height);
    if (!boxes.some((other) => boxesTouch(box, other))) return step;
  }
  return at;
}
