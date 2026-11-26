import { describe, expect, it } from 'vitest';
import type { HeightGrid } from '../../src/studio/site-grid';
import { sunChartOf } from '../../src/studio/site-sun-chart';

/**
 * The sun chart (`T-M05-002`, part g, board G10): a wall south of the roof shades the winter sun
 * at noon in India and never June's, which crosses to the north; far hills shade sunrise and sunset.
 */

const SANGLI = { latitude: 16.85, longitude: 74.58 };
const STEP = 0.5;
const SIDE = 160;

/** 80 m of flat ground about the roof, with a 20 m wall from 5 m to 10 m south of it. */
function wallSouth(heightM: number): HeightGrid {
  const heights = new Float32Array(SIDE * SIDE);
  for (let r = 0; r < SIDE; r += 1) {
    const north = -40 + (r + 0.5) * STEP;
    for (let c = 0; c < SIDE; c += 1) {
      if (north > -10 && north < -5) heights[r * SIDE + c] = heightM;
    }
  }
  return { west: -40, south: -40, stepM: STEP, cols: SIDE, rows: SIDE, heights };
}

const chartOf = (heightM: number, farDeg: number | null) =>
  sunChartOf({
    grid: wallSouth(heightM),
    corners: [
      { east: -2, north: -2 },
      { east: 2, north: -2 },
      { east: 2, north: 2 },
      { east: -2, north: 2 },
    ],
    topM: 3,
    far:
      farDeg === null
        ? null
        : { stepDeg: 2, elevationsDeg: Array.from({ length: 180 }, () => farDeg) },
    place: SANGLI,
    timeZone: 'Asia/Kolkata',
    nowMs: Date.UTC(2026, 10, 26, 6),
  });
const dayOf = (chart: ReturnType<typeof chartOf>, key: string) =>
  chart.days.find((day) => day.key === key);

describe('the sun chart', () => {
  it('a tall wall to the south shades the winter noon', () => {
    const december = dayOf(chartOf(20, null), 'december');
    const noon = december?.shade.find((s) => s.from.hour <= 12 && s.to.hour >= 12);
    expect(noon).toBeDefined();
  });

  it('June’s sun crosses to the north of Sangli: the same wall never shades it', () => {
    expect(dayOf(chartOf(20, null), 'june')?.shade).toEqual([]);
  });

  it('with no wall and no hills, no day has shade', () => {
    expect(chartOf(0, null).days.every((day) => day.shade.length === 0)).toBe(true);
  });

  it('far hills 10° high shade each day’s sunrise and sunset', () => {
    const march = dayOf(chartOf(0, 10), 'march');
    expect(march?.shade.length).toBe(2);
    expect(march?.shade[0]?.from.hour).toBe(6);
    expect(march?.shade[1]?.to.hour).toBe(18);
  });

  it('marks the whole hours of the site’s clock, half an hour off UTC in India', () => {
    const june = dayOf(chartOf(0, null), 'june');
    const hours = june?.curve.filter((point) => point.onHour).length ?? 0;
    expect(hours).toBeGreaterThanOrEqual(12);
  });

  it('a roof drawn lower than the map’s deck looks from the deck, not from inside its building', () => {
    const heights = new Float32Array(SIDE * SIDE);
    for (let r = 0; r < SIDE; r += 1) {
      for (let c = 0; c < SIDE; c += 1) {
        const east = -40 + (c + 0.5) * STEP;
        const north = -40 + (r + 0.5) * STEP;
        if (Math.abs(east) < 6 && Math.abs(north) < 6) heights[r * SIDE + c] = 20;
      }
    }
    const chart = sunChartOf({
      grid: { west: -40, south: -40, stepM: STEP, cols: SIDE, rows: SIDE, heights },
      corners: [
        { east: -4, north: -4 },
        { east: 4, north: -4 },
        { east: 4, north: 4 },
        { east: -4, north: 4 },
      ],
      topM: 14,
      far: null,
      place: SANGLI,
      timeZone: 'Asia/Kolkata',
      nowMs: Date.UTC(2026, 10, 26, 6),
    });
    expect(chart.days.every((day) => day.shade.length === 0)).toBe(true);
  });
});
