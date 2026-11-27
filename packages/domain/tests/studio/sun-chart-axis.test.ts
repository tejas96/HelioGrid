import { describe, expect, it } from 'vitest';
import { chartAzimuth, sunChartPoints, sunChartStartOf } from '../../src/studio/sun-chart-axis';

/**
 * Where the sun chart's compass starts (`T-M05-002`, part g, board G10): at a point no day's sun
 * passes, so every day draws as one arc.
 */

/** A day's sun from `from` to `to` degrees, five degrees a step, the short way or past north. */
function day(from: number, to: number, way: 1 | -1) {
  const curve: { azimuthDegrees: number }[] = [];
  for (let at = from; way > 0 ? at <= to : at >= to; at += 5 * way) {
    curve.push({ azimuthDegrees: ((at % 360) + 360) % 360 });
  }
  return curve;
}
/** Delhi, 28° N: every sun passes south; June's rises north of east. */
const DELHI = [day(62, 298, 1), day(90, 270, 1), day(117, 243, 1)];
/** Chennai, 13° N: June's sun passes north at noon, December's south. */
const CHENNAI = [day(66, -66, -1), day(90, 270, 1), day(113, 247, 1)];
/** Melbourne, 38° S: every sun passes north. */
const MELBOURNE = [day(60, -60, -1), day(90, -90, -1), day(120, -120, -1)];

describe('the sun chart starts where no day passes (T-M05-002)', () => {
  it.each([
    // why, days → start
    ['no day: north first', [], 0],
    ['every sun south of the site: north first', DELHI, 0],
    ['every sun north of the site: south first', MELBOURNE, 180],
    ['June north, December south: east first', CHENNAI, 90],
    ['a sun passing every start: north, as before', [day(0, 355, 1), day(185, 175, -1)], 0],
  ] as const)('%s', (_why, days, start) => {
    expect(sunChartStartOf(days)).toBe(start);
  });
});

describe('a day lies on the chart as one arc from its start (T-M05-002)', () => {
  it.each([
    ['Delhi', DELHI],
    ['Chennai', CHENNAI],
    ['Melbourne', MELBOURNE],
  ] as const)('%s', (_why, days) => {
    const start = sunChartStartOf(days);
    for (const curve of days) {
      const steps = curve
        .slice(1)
        .map((point, at) =>
          Math.abs(
            chartAzimuth(point.azimuthDegrees, start) -
              chartAzimuth(curve[at]?.azimuthDegrees ?? 0, start),
          ),
        );
      expect(Math.max(...steps)).toBeLessThanOrEqual(5 + 1e-9);
    }
  });
});

describe('the chart’s compass round from its start (T-M05-002)', () => {
  it.each([
    [0, ['n', 'e', 's', 'w', 'n']],
    [90, ['e', 's', 'w', 'n', 'e']],
    [180, ['s', 'w', 'n', 'e', 's']],
    [270, ['w', 'n', 'e', 's', 'w']],
  ] as const)('from %s°', (start, points) => {
    expect(sunChartPoints(start)).toEqual(points);
  });

  it.each([
    // azimuth, start → round the chart
    [0, 0, 0],
    [359, 0, 359],
    [10, 180, 190],
    [180, 180, 0],
    [-10, 90, 260],
    [450, 90, 0],
  ] as const)('%s° from a start at %s° lies %s° round', (azimuth, start, round) => {
    expect(chartAzimuth(azimuth, start)).toBe(round);
  });
});
