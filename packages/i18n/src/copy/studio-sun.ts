import type { TranslatedText } from '@heliogrid/contracts';
import type { CompassPoint, SunDay } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/**
 * The sun bar's words (`T-M05-002`, part g, board G8–G13): the day chips, the day line, play, the
 * bearing, and the sun chart's (G10). Clock times and dates come formatted by the market.
 */
const SUN = {
  sun: /*i18n*/ { id: 'Sun' },
  days: /*i18n*/ { id: 'Day' },
  winter: /*i18n*/ { id: 'Winter' },
  summer: /*i18n*/ { id: 'Summer' },
  equinox: /*i18n*/ { id: 'Equinox' },
  today: /*i18n*/ { id: 'Today' },
  date: /*i18n*/ { id: '{day} {month}' },
  timeOfDay: /*i18n*/ { id: 'Time of day' },
  play: /*i18n*/ { id: 'Play the day' },
  pause: /*i18n*/ { id: 'Pause' },
  close: /*i18n*/ { id: 'Close the sun' },
  chart: /*i18n*/ { id: 'Sun path and shade times' },
  down: /*i18n*/ { id: 'The sun stays down that day.' },
  sunrise: /*i18n*/ { id: 'Sunrise {time}' },
  sunset: /*i18n*/ { id: 'Sunset {time}' },
  bearing: /*i18n*/ { id: '{degrees}° {point} · {up}° up' },
  below: /*i18n*/ { id: 'Below the horizon' },
  n: /*i18n*/ { id: 'N' },
  ne: /*i18n*/ { id: 'NE' },
  e: /*i18n*/ { id: 'E' },
  se: /*i18n*/ { id: 'SE' },
  s: /*i18n*/ { id: 'S' },
  sw: /*i18n*/ { id: 'SW' },
  w: /*i18n*/ { id: 'W' },
  nw: /*i18n*/ { id: 'NW' },
  chartTitle: /*i18n*/ { id: 'Sun path' },
  chartFrom: /*i18n*/ { id: 'Seen from the middle of {roof}' },
  chartPicture: /*i18n*/ { id: 'The sun’s paths over the skyline this roof sees' },
  shade: /*i18n*/ { id: 'Shade {times}' },
  shadeAnd: /*i18n*/ { id: '{first} and {second}' },
  noShade: /*i18n*/ { id: 'No shade' },
  chartClose: /*i18n*/ { id: 'Close the sun path' },
} as const;

const POINT: Record<CompassPoint, (typeof SUN)[CompassPoint]> = {
  n: SUN.n,
  ne: SUN.ne,
  e: SUN.e,
  se: SUN.se,
  s: SUN.s,
  sw: SUN.sw,
  w: SUN.w,
  nw: SUN.nw,
};

/** The PVGIS credit as its owner words it: never translated. */
const PVGIS_CREDIT =
  'Far hills: data and calculations based on PVGIS – © European Union, Joint Research Centre';

export function studioSunWords(t: T) {
  return {
    sun: t(SUN.sun),
    sunDays: t(SUN.days),
    sunTimeOfDay: t(SUN.timeOfDay),
    sunPlay: t(SUN.play),
    sunPause: t(SUN.pause),
    sunClose: t(SUN.close),
    sunChart: t(SUN.chart),
    sunDown: t(SUN.down),
    sunBelow: t(SUN.below),
    /** A day chip: a season's name, or near the equator its date (`date`, from `sunDate`). */
    sunDay: (day: SunDay, date: TranslatedText): TranslatedText => {
      if (day === 'winter') return t(SUN.winter);
      if (day === 'summer') return t(SUN.summer);
      if (day === 'equinox') return t(SUN.equinox);
      return day === 'today' ? t(SUN.today) : date;
    },
    /** A day of the month and its short name: `21 Dec`. */
    sunDate: (day: number, month: string): TranslatedText => t(SUN.date, { day, month }),
    sunrise: (time: string): TranslatedText => t(SUN.sunrise, { time }),
    sunset: (time: string): TranslatedText => t(SUN.sunset, { time }),
    /** `127° SE · 25° up`. */
    sunBearing: (degrees: number, point: CompassPoint, up: number): TranslatedText =>
      t(SUN.bearing, { degrees, point: t(POINT[point]), up }),
    sunPoint: (point: CompassPoint): TranslatedText => t(POINT[point]),
    sunChartTitle: t(SUN.chartTitle),
    sunChartFrom: (roof: string): TranslatedText => t(SUN.chartFrom, { roof }),
    sunChartPicture: t(SUN.chartPicture),
    sunChartClose: t(SUN.chartClose),
    /** One day's shade, `times` each `7:00–7:50`; none says so. */
    sunShade: (times: readonly string[]): TranslatedText => {
      if (times.length === 0) return t(SUN.noShade);
      const joined = times.reduce((first, second) => t(SUN.shadeAnd, { first, second }));
      return t(SUN.shade, { times: joined });
    },
    sunPvgisCredit: shownAsSent(PVGIS_CREDIT),
  };
}
