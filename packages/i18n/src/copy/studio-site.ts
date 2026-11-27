import type { TranslatedText } from '@heliogrid/contracts';
import type { FloorChoice, SiteDataCredit, SiteFitLine, SiteSay } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { PERCENT } from './proposal-builder-facts';

type T = Translator['t'];

/**
 * The bar's words on the site's data (`T-M05-002`, part g, board group 6): where the heights came
 * from, a roof with no building under it, the floors, a source that did not answer.
 */
const SITE = {
  fromData: /*i18n*/ { id: 'Heights from Google’s height map of {month}.' },
  fromDataUndated: /*i18n*/ { id: 'Heights from Google’s height map.' },
  noBuilding: /*i18n*/ { id: 'No height data under a roof. Set its height in its sheet.' },
  noHeightsTitle: /*i18n*/ { id: 'No Google heights here' },
  floorsAsk: /*i18n*/ { id: 'How many floors is it?' },
  notAnswered: /*i18n*/ { id: 'Google’s height data did not answer. Heights are estimates.' },
  updated: /*i18n*/ { id: 'Heights updated from Google’s newer data. Your own values are kept.' },
  floorsName: /*i18n*/ { id: 'Floors' },
  straightDown: /*i18n*/ { id: 'Straight-down picture' },
  straightDownLine: /*i18n*/ {
    id: '{source} · {sharpness} · {date} · tall walls stand where they are',
  },
  skyUndated: /*i18n*/ { id: '{source} · about {sharpness} · date not given' },
  heightsGoogle: /*i18n*/ { id: 'Google height map · {date} · {sharpness}' },
  heightsGoogleUndated: /*i18n*/ { id: 'Google height map · {sharpness}' },
  sunlight: /*i18n*/ { id: 'Sunlight' },
  seeThrough: /*i18n*/ { id: 'See-through' },
  seeThroughLess: /*i18n*/ { id: 'Less see-through' },
  seeThroughMore: /*i18n*/ { id: 'More see-through' },
  lineUpLift: /*i18n*/ { id: 'Height of the map' },
  lineUpLower: /*i18n*/ { id: 'Lower the map' },
  lineUpRaise: /*i18n*/ { id: 'Raise the map' },
  mapUp: /*i18n*/ { id: 'Move the map up' },
  mapDown: /*i18n*/ { id: 'Move the map down' },
  mapLeft: /*i18n*/ { id: 'Move the map left' },
  mapRight: /*i18n*/ { id: 'Move the map right' },
  mapBack: /*i18n*/ { id: 'Back to automatic' },
  fitUnclear: /*i18n*/ { id: 'The height map is unclear here. Slide it if it looks wrong.' },
  fitAbove: /*i18n*/ { id: 'The height map reads {map} here: {by} above this roof.' },
  fitBelow: /*i18n*/ { id: 'The height map reads {map} here: {by} below this roof.' },
  fitLevel: /*i18n*/ { id: 'The height map reads {map} here: level with this roof.' },
  fitTagAbove: /*i18n*/ { id: 'Map {by} above' },
  fitTagBelow: /*i18n*/ { id: 'Map {by} below' },
} as const;

const FIT_LINE = {
  unclear: SITE.fitUnclear,
} as const satisfies Record<SiteFitLine, unknown>;

/** Each source's credit as its owner words it. */
const SITE_CREDIT_TEXT: Record<SiteDataCredit, string> = {
  google_solar: 'Includes solar data from Google',
  openstreetmap: '© OpenStreetMap contributors',
  pvgis: 'Data and calculations based on PVGIS – © European Union, Joint Research Centre',
};

/** The highest floors chip: G+3, and taller from the height slider. */
const FLOORS_TOP: FloorChoice = 3;

/** A bar message on the site's data: its title where it has one, and its line. */
export interface SiteSayWords {
  readonly title: TranslatedText | null;
  readonly line: TranslatedText;
}

/** The site data's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioSiteWords(t: T) {
  return {
    /** What the bar says of the data. `month` is the data's month and year, already formatted. */
    siteSay: (say: SiteSay, month: string | null): SiteSayWords => {
      switch (say.kind) {
        case 'from_data':
          return {
            title: null,
            line: month === null ? t(SITE.fromDataUndated) : t(SITE.fromData, { month }),
          };
        case 'no_building':
          return { title: null, line: t(SITE.noBuilding) };
        case 'floors':
          return { title: t(SITE.noHeightsTitle), line: t(SITE.floorsAsk) };
        case 'not_answered':
          return { title: null, line: t(SITE.notAnswered) };
        default:
          return { title: null, line: t(SITE.updated) };
      }
    },
    siteFloorsName: t(SITE.floorsName),
    siteStraightDown: t(SITE.straightDown),
    /** The straight-down picture's line: who gave it, its sharpness and date, what it is for. */
    siteStraightDownLine: (source: string, sharpness: string, date: string) =>
      t(SITE.straightDownLine, { source, sharpness, date }),
    /** The sky picture's line where its provider gives no date (Google's never does). */
    siteSkyUndated: (source: string, sharpness: string) =>
      t(SITE.skyUndated, { source, sharpness }),
    /**
     * Each data source's credit, worded as its owner requires — never translated (Solar policies,
     * OpenStreetMap's attribution guidelines, PVGIS's conditions).
     */
    siteCredit: (credit: SiteDataCredit): TranslatedText => shownAsSent(SITE_CREDIT_TEXT[credit]),
    siteSunlight: t(SITE.sunlight),
    siteSeeThrough: t(SITE.seeThrough),
    siteSeeThroughLess: t(SITE.seeThroughLess),
    siteSeeThroughMore: t(SITE.seeThroughMore),
    siteLineUpLift: t(SITE.lineUpLift),
    siteLineUpLower: t(SITE.lineUpLower),
    siteLineUpRaise: t(SITE.lineUpRaise),
    siteMapUp: t(SITE.mapUp),
    siteMapDown: t(SITE.mapDown),
    siteMapLeft: t(SITE.mapLeft),
    siteMapRight: t(SITE.mapRight),
    siteMapBack: t(SITE.mapBack),
    /** The roof sheet's line on the map (board G21): where its read is unclear. */
    siteFit: (line: SiteFitLine): TranslatedText => t(FIT_LINE[line]),
    /** A share as a percent, the number formatted by the market: `62%`. */
    sitePercent: (value: string): TranslatedText => t(PERCENT, { value }),
    /** A floors chip, as reps count floors: G, G+1, G+2, G+3+. */
    siteFloor: (floors: FloorChoice): TranslatedText =>
      shownAsSent(floors === 0 ? 'G' : floors === FLOORS_TOP ? `G+${floors}+` : `G+${floors}`),
  };
}
