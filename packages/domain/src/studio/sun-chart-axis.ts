/**
 * Where the sun chart's compass starts (`T-M05-002`, part g, board G10): at a point no day's sun
 * passes, so each day is one arc. North first, as most of India's sun stays south of it; south
 * first where the sun passes north; east first in the tropics, where June's sun passes north and
 * December's south. Every sun rises in the east half and sets in the west, so east or west never
 * cuts a day whose sun passes north or south at noon.
 */

const TURN = 360;
const HALF = 180;
/** The starts tried, in turn, in degrees from north. */
const STARTS = [0, 180, 90, 270] as const;
export type SunChartStart = (typeof STARTS)[number];

/** Degrees round the chart from its start, 0 to 360. */
export function chartAzimuth(azimuth: number, start: SunChartStart): number {
  return (((azimuth - start) % TURN) + TURN) % TURN;
}

/** Whether a day's sun passes the start: two points in a row lie on its two sides. */
function passes(
  curve: readonly { readonly azimuthDegrees: number }[],
  start: SunChartStart,
): boolean {
  return curve.some((point, at) => {
    const before = curve[at - 1];
    if (before === undefined) return false;
    const step =
      chartAzimuth(point.azimuthDegrees, start) - chartAzimuth(before.azimuthDegrees, start);
    return Math.abs(step) > HALF;
  });
}

/** The first start no day's sun passes; north where every start is passed. */
export function sunChartStartOf(
  days: readonly (readonly { readonly azimuthDegrees: number }[])[],
): SunChartStart {
  return STARTS.find((start) => days.every((curve) => !passes(curve, start))) ?? 0;
}

/** The compass points round the chart from its start, the start again at the end. */
export function sunChartPoints(start: SunChartStart): readonly ('n' | 'e' | 's' | 'w')[] {
  const round = ['n', 'e', 's', 'w'] as const;
  const first = start / (TURN / round.length);
  return [0, 1, 2, 3, 4].map((step) => round[(first + step) % round.length] ?? 'n');
}
