/**
 * The line maths of the roof kernel (`T-M05-002`, part e). A roof's faces come from its sides
 * moving inward as the height grows — a wavefront — and each side is a line that moves:
 * `n · p = a + b · t`, where `n` is the side's inward unit normal, `t` the time (a height, or a
 * share of an offset) and `b` the side's speed. Where three such lines pass through one point at
 * one time, the wavefront changes; everything here is those small solves.
 */

/** A point of the plan: x east, y north, in metres. */
export interface PlanPoint {
  readonly x: number;
  readonly y: number;
}

/** A point of the plan at a time. */
export interface TimedPoint extends PlanPoint {
  readonly t: number;
}

/** A side's line as it moves: `nx·x + ny·y = a + b·t`. Its speed changes at a phase, never its way. */
export interface MovingLine {
  readonly nx: number;
  readonly ny: number;
  a: number;
  b: number;
}

/** Two directions this close to one line are parallel: the sine of a hundredth of a degree. */
export const PARALLEL = 1.7e-4;
/** Two places this close are one, in metres. */
export const SAME_PLACE_M = 1e-6;
/** Two times this close are one. */
export const SAME_TIME = 1e-7;

/** The line through `from` and `to`, standing still, with its normal to the left of the way. */
export function lineThrough(from: PlanPoint, to: PlanPoint): MovingLine | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < SAME_PLACE_M) return null;
  const nx = -dy / length;
  const ny = dx / length;
  return { nx, ny, a: nx * from.x + ny * from.y, b: 0 };
}

/** The way a line runs, its normal to the left. */
export function wayOf(line: MovingLine): PlanPoint {
  return { x: line.ny, y: -line.nx };
}

/** The turn from one line's way to another's: above zero to the left, below to the right. */
export function turnBetween(first: MovingLine, second: MovingLine): number {
  return first.nx * second.ny - first.ny * second.nx;
}

/** Where two lines cross at a time; `null` when they run the same way. */
export function crossingAt(one: MovingLine, other: MovingLine, t: number): PlanPoint | null {
  const det = turnBetween(one, other);
  if (Math.abs(det) < PARALLEL) return null;
  const c1 = one.a + one.b * t;
  const c2 = other.a + other.b * t;
  return { x: (c1 * other.ny - c2 * one.ny) / det, y: (one.nx * c2 - other.nx * c1) / det };
}

/** A 3 × 3 determinant, row by row. */
function det3(m: readonly number[]): number {
  const [a, b, c, d, e, f, g, h, i] = m as readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

/** Lines whose three-way solve is this flat never meet at one point at one time. */
const NEVER_MEET = 1e-9;

/**
 * The one point and time three moving lines pass through together; `null` when they never do, or
 * always do. Each line gives one equation in x, y and t.
 */
export function meetingOf(one: MovingLine, two: MovingLine, three: MovingLine): TimedPoint | null {
  const rows = [one, two, three];
  const whole = det3(rows.flatMap((l) => [l.nx, l.ny, -l.b]));
  if (Math.abs(whole) < NEVER_MEET) return null;
  const x = det3(rows.flatMap((l) => [l.a, l.ny, -l.b])) / whole;
  const y = det3(rows.flatMap((l) => [l.nx, l.a, -l.b])) / whole;
  const t = det3(rows.flatMap((l) => [l.nx, l.ny, l.a])) / whole;
  return { x, y, t };
}

/** A ring's area: above zero when it runs anticlockwise. */
export function ringArea(ring: readonly PlanPoint[]): number {
  let twice = 0;
  for (let i = 0; i < ring.length; i++) {
    const from = ring[i] as PlanPoint;
    const to = ring[(i + 1) % ring.length] as PlanPoint;
    twice += from.x * to.y - to.x * from.y;
  }
  return twice / 2;
}

export function distance(a: PlanPoint, b: PlanPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
