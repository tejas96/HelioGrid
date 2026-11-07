import { type Point, SCENE, SUN_ARC } from './SolarSky.shapes';

/**
 * Where the sun sits on the door's sky, from the hour on the device. A plain daylight model
 * (06:00–18:30) is enough for a calm picture; it is not an astronomical calculation.
 */
export type SkyPhase = 'day' | 'night';

const SUNRISE = 6;
const SUNSET = 18.5;
/** Where the moon rests on the arc after sunset. */
const MOON_PLACE = 0.72;

/** Hours since midnight on the device, e.g. 9.25 for 09:15. */
export function hoursOf(now: Date): number {
  return now.getHours() + now.getMinutes() / 60;
}

export function skyPhase(hours: number): SkyPhase {
  return hours < SUNRISE || hours >= SUNSET ? 'night' : 'day';
}

/** 0 at sunrise, 1 at sunset, clamped; the moon's place after dark. */
export function arcPlace(hours: number): number {
  if (skyPhase(hours) === 'night') return MOON_PLACE;
  return Math.min(1, Math.max(0, (hours - SUNRISE) / (SUNSET - SUNRISE)));
}

/** A point on the sun's quadratic arc. */
export function pointOnArc(t: number): Point {
  const u = 1 - t;
  const { start, control, end } = SUN_ARC;
  return [
    u * u * start[0] + 2 * u * t * control[0] + t * t * end[0],
    u * u * start[1] + 2 * u * t * control[1] + t * t * end[1],
  ];
}

/**
 * The sun's rise into its place as offsets from where it rests, sampled along the arc so a
 * transform-only motion follows the curve: the first entry is sunrise, the last is (0, 0).
 */
export function riseOffsets(place: number, samples = 8): readonly Point[] {
  const [restX, restY] = pointOnArc(place);
  return Array.from({ length: samples + 1 }, (_, i) => {
    const [x, y] = pointOnArc((place * i) / samples);
    return [x - restX, y - restY] as const;
  });
}

/** A run along a wire, as offsets from its first point, and each turn's share of the whole length. */
export interface WireRun {
  readonly offsets: readonly Point[];
  readonly stops: readonly number[];
}

export function wireRun(points: readonly Point[]): WireRun {
  const [x0, y0] = points[0] ?? [0, 0];
  const lengths = points.slice(1).map((p, i) => {
    const q = points[i] ?? p;
    return Math.hypot(p[0] - q[0], p[1] - q[1]);
  });
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const stops = [0];
  let run = 0;
  for (const length of lengths) {
    run += length;
    stops.push(run / total);
  }
  return { offsets: points.map(([x, y]) => [x - x0, y - y0] as const), stops };
}

/**
 * How the scene's box maps onto a view that shows it whole, centred and standing on the view's
 * foot (`xMidYMax meet`): one scale, and the shift of the scene's top-left corner.
 */
export function meetFit(width: number, height: number): { scale: number; dx: number; dy: number } {
  const scale = Math.min(width / SCENE.width, height / SCENE.height);
  return { scale, dx: (width - SCENE.width * scale) / 2, dy: height - SCENE.height * scale };
}

/** The share of the box the scene's art takes, from its foot: the front door leaves a band of sky over it. */
export const ART_SHARE = { door: 0.92, band: 1 } as const;
