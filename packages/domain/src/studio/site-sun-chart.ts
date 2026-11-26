import type { Coordinate } from '../format/areas';
import type { GroundPoint } from './ground';
import { roofMiddle } from './roof-shape';
import type { HeightGrid } from './site-grid';
import { mapHeightInside } from './site-roof-fit';
import { type Skyline, shadeStretches, skylineAt, skylinesJoined } from './site-skyline';
import { type CalendarDay, siteClockOf, siteMidnightMs, sunPathOf } from './site-sun';
import { type SunClock, siteDayOf } from './site-sun-bar';
import { SUN_CHART_DAYS, type SunChart, type SunChartDay } from './site-sun-shown';

/**
 * The sun chart (`T-M05-002`, part g, board G10): the skyline a roof sees from its middle — the
 * height map's neighbours, trees and the roof's own parts, with the far hills from PVGIS laid
 * under it — and three days' sun over it, all round the compass, with the times the sun is behind
 * the skyline: the roof's shade, in the site's clock.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
const STEP_MS = 5 * MS_PER_MINUTE;
const JUNE = 6;
const MARCH = 3;
const DECEMBER = 12;
const SOLSTICE_DAY = 21;
const EQUINOX_DAY = 20;
/** A panel lies a little over the deck: the chart's eye stands this high over the roof's top. */
const EYE_OVER_ROOF_M = 0.3;

const pad = (value: number) => String(value).padStart(2, '0');
function clockOf(timeZone: string, atMs: number): SunClock {
  const { hour, minute } = siteClockOf(timeZone, atMs);
  return { hour, minute, hhmm: `${pad(hour)}:${pad(minute)}` };
}

function dayOf(key: SunChartDay, year: number): CalendarDay {
  if (key === 'june') return { year, month: JUNE, day: SOLSTICE_DAY };
  if (key === 'march') return { year, month: MARCH, day: EQUINOX_DAY };
  return { year, month: DECEMBER, day: SOLSTICE_DAY };
}

/**
 * The chart for a roof: its middle and its top above the grid's datum, the site's sharp grid and
 * far horizon, in the year of `nowMs` on the site's clock.
 */
export function sunChartOf(input: {
  readonly grid: HeightGrid;
  /** The roof's corners: the eye stands at their middle. */
  readonly corners: readonly GroundPoint[];
  readonly topM: number;
  readonly far: Skyline | null;
  readonly place: Coordinate;
  readonly timeZone: string;
  readonly nowMs: number;
}): SunChart {
  const { grid, corners, topM, far, place, timeZone } = input;
  // On the higher of the roof as drawn and the map's deck under it: a roof drawn lower than the
  // map would see its own building as a wall all round.
  const deckM = Math.max(topM, mapHeightInside(grid, corners, 0) ?? topM);
  const near = skylineAt(grid, { ...roofMiddle(corners), height: deckM + EYE_OVER_ROOF_M });
  const skyline = skylinesJoined(near, far);
  const { year } = siteDayOf(timeZone, input.nowMs);
  const days = SUN_CHART_DAYS.map((key) => {
    const on = dayOf(key, year);
    const start = siteMidnightMs(timeZone, on);
    const path = sunPathOf(place, start, start + MS_PER_DAY, STEP_MS);
    const curve = path
      .filter((point) => point.elevationDegrees > 0)
      .map(({ atMs, azimuthDegrees, elevationDegrees }) => ({
        azimuthDegrees,
        elevationDegrees,
        onHour: siteClockOf(timeZone, atMs).minute === 0,
      }));
    const shade = shadeStretches(path, skyline).map((stretch) => ({
      from: clockOf(timeZone, stretch.fromMs),
      to: clockOf(timeZone, stretch.toMs),
    }));
    return { key, on, curve, shade };
  });
  return { skyline, far, days };
}
