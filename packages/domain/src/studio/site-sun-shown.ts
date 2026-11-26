import type { CalendarDay } from './site-sun';
import type { SunClock } from './site-sun-bar';
import type { SunPosition } from './sun';

/**
 * What the sun chart and sunlight show (`T-M05-002`, part g, board G10 and G24), as the screens
 * read them; the kernel works them out.
 */

/** A skyline as the chart draws it: the angle above the horizon each `stepDeg` from north. */
export interface SkylineAngles {
  readonly stepDeg: number;
  readonly elevationsDeg: readonly number[];
}

/** The chart's three days: the solstices and the March equinox. */
export const SUN_CHART_DAYS = ['june', 'march', 'december'] as const;
export type SunChartDay = (typeof SUN_CHART_DAYS)[number];

export interface SunChartCurvePoint extends SunPosition {
  /** A whole hour of the site's clock: the chart marks it with a dot. */
  readonly onHour: boolean;
}

export interface SunChartDayLine {
  readonly key: SunChartDay;
  readonly on: CalendarDay;
  /** The sun over the horizon that day, a point each 5 minutes. */
  readonly curve: readonly SunChartCurvePoint[];
  /** When the roof is in shade, from and to. */
  readonly shade: readonly { readonly from: SunClock; readonly to: SunClock }[];
}

export interface SunChart {
  /** The near skyline and the far one joined: what the roof sees. */
  readonly skyline: SkylineAngles;
  /** The far hills alone, dashed on the chart; `null` where PVGIS had none. */
  readonly far: SkylineAngles | null;
  readonly days: readonly SunChartDayLine[];
}

/** One roof's sunlight: a share for each metre of it, at the metre's middle. */
export interface RoofSunlight {
  readonly cellM: number;
  readonly cells: readonly {
    readonly east: number;
    readonly north: number;
    readonly share: number;
  }[];
}

/** The sunlight key runs from 60 % (much shade) to 100 % (none). */
export const SUNLIGHT_KEY_FROM = 0.6;
export const SUNLIGHT_KEY_TO = 1;
