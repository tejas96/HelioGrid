import type { GroundPoint } from './ground';

/**
 * The site data (`T-M05-002`, part g): what a height map, a building's roof faces, the far hills
 * and the time zone say of a site, read once by the server and sent to the studio as one small
 * answer. These are its words and the facts of it the design keeps.
 */

/**
 * Where a site's heights come from: Google's height map, OpenStreetMap's building outlines (where
 * Google has none), or nowhere — the roofs then stand at the market's floors.
 */
export const SITE_DATA_SOURCES = ['google_solar', 'openstreetmap', 'none'] as const;
export type SiteDataSource = (typeof SITE_DATA_SOURCES)[number];

/** How sharp Google's height map is: 0.1 m from the air, 0.25 m from the air, 0.25 m from space. */
export const HEIGHT_DATA_QUALITIES = ['high', 'medium', 'base'] as const;
export type HeightDataQuality = (typeof HEIGHT_DATA_QUALITIES)[number];

/**
 * What did not answer, so the studio says it in one line and goes on: no height service is set up,
 * the height service did not answer or holds nothing here, the building outlines did not answer,
 * the far horizon did not answer, or the person asked for data too often in a minute.
 */
export const SITE_DATA_GAPS = [
  'not_set_up',
  'heights_not_answered',
  'heights_not_covered',
  'outlines_not_answered',
  'horizon_not_answered',
  'capped',
] as const;
export type SiteDataGap = (typeof SITE_DATA_GAPS)[number];

/** Whose data the studio shows, each with its own credit line where its data shows. */
export const SITE_DATA_CREDITS = ['google_solar', 'openstreetmap', 'pvgis'] as const;
export type SiteDataCredit = (typeof SITE_DATA_CREDITS)[number];

/** The floors chips: G, G+1, G+2 and G+3+, as the floors above the ground floor. */
export const FLOOR_CHOICES = [0, 1, 2, 3] as const;
export type FloorChoice = (typeof FLOOR_CHOICES)[number];
/** A building may be told to stand this many floors above its ground floor at most. */
export const FLOORS_ABOVE_MAX = 60;

/** A person lines the height map up with the picture: lifted ±3 m and moved ±5 m, by 10 cm. */
export const LINE_UP_LIFT_MAX_M = 3;
export const LINE_UP_SHIFT_MAX_M = 5;
export const LINE_UP_STEP_M = 0.1;

/**
 * Google's height data is kept this many days at most, then deleted and fetched again (owner
 * ruling 2026-11-26; Solar terms §21.2: up to 30 consecutive days).
 */
export const HEIGHT_DATA_KEEP_DAYS = 30;

/** How sharp each quality of Google's height map is: the ground one cell covers, in metres. */
export const HEIGHT_DATA_SHARPNESS_M: Record<HeightDataQuality, number> = {
  high: 0.1,
  medium: 0.25,
  base: 0.25,
};

/** Height data this many months old or more asks whether the building has changed. */
export const HEIGHT_DATA_STALE_MONTHS = 12;

/** The data a design's system values were made from: its source, sharpness and date. */
export interface SiteDataStamp {
  readonly source: SiteDataSource;
  readonly quality: HeightDataQuality | null;
  /** `YYYY-MM-DD`, or `null` when the source gives no date. */
  readonly dataOn: string | null;
}

/** A person's line-up of the height map under the picture, in metres; absent, automatic. */
export interface SiteLineUp {
  readonly east: number;
  readonly north: number;
  readonly lift: number;
}

/** A person's answer to "Has the building changed?" for the data of one date. */
export interface SiteChanged {
  readonly dataOn: string | null;
  readonly changed: boolean;
}

/**
 * What the design keeps of its site's data. Every field is absent on a design from before part g
 * and on one the data never reached: the studio then reads the data as new and keeps every value a
 * person set.
 */
export interface SiteDataKept {
  readonly dataStamp?: SiteDataStamp;
  readonly changed?: SiteChanged;
  /** The floors above the ground floor a person tapped, where the data gives no height. */
  readonly floors?: number;
  readonly lineUp?: SiteLineUp;
}

/** The ground a building's outline covers on the site, with the ground it stands on. */
export interface SiteBuilding {
  readonly outline: readonly GroundPoint[];
  /** Metres above the site's datum. */
  readonly groundM: number;
  /** OpenStreetMap's height of it above its ground, where it gives one. */
  readonly heightM: number | null;
  /** The floors OpenStreetMap gives above its ground floor, where it gives them. */
  readonly floorsAbove: number | null;
}

/** A building edge where the height falls to the ground: an eave a roof's corner pulls to. */
export interface SiteEave {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  /** The roof's height at the edge, above the building's ground. */
  readonly heightM: number;
}

/**
 * A grid of heights on the site's ground (`T-M05-002`, part g): square cells `stepM` a side, from
 * the south-west corner `west, south` (metres east and north of the pin), row 0 the southmost.
 * Each height is in metres above the site's datum; `NaN` where the data holds none.
 */
export interface HeightGrid {
  readonly west: number;
  readonly south: number;
  readonly stepM: number;
  readonly cols: number;
  readonly rows: number;
  readonly heights: Float32Array;
}

/** A height grid as it travels: heights in whole centimetres, two bytes each, as base64. */
export interface HeightGridWire {
  readonly west: number;
  readonly south: number;
  readonly stepM: number;
  readonly cols: number;
  readonly rows: number;
  readonly centimetres: string;
}

/** A grey picture as it travels: one byte a cell, 0 black to 255 white, as base64. */
export interface PictureGridWire {
  readonly west: number;
  readonly south: number;
  readonly stepM: number;
  readonly cols: number;
  readonly rows: number;
  readonly grey: string;
}

/** One of Google's roof faces on the site: where it lies, its slope and the way it faces. */
export interface SiteFace {
  readonly middle: GroundPoint;
  readonly slopeDeg: number;
  /** The compass bearing it slopes down toward. */
  readonly facingDeg: number;
  readonly areaM2: number;
  /** The face's plane at its middle, metres above the site's datum. */
  readonly heightM: number;
}

const MONTHS_A_YEAR = 12;

/**
 * Whether height data of `dataOn` is a year old or more on `today` (both `YYYY-MM-DD`). Data with no
 * date never asks.
 */
export function heightDataStale(dataOn: string | null, today: string): boolean {
  if (dataOn === null) return false;
  const [fromYear, fromMonth, fromDay] = dataOn.split('-').map(Number) as [number, number, number];
  const [toYear, toMonth, toDay] = today.split('-').map(Number) as [number, number, number];
  const months =
    (toYear - fromYear) * MONTHS_A_YEAR + (toMonth - fromMonth) - (toDay < fromDay ? 1 : 0);
  return months >= HEIGHT_DATA_STALE_MONTHS;
}

/**
 * Whether the changed-roof question waits for an answer: the data is a year old or more, or a drawn
 * roof has no building under it, and no answer was given for this data's date.
 */
export function changedQuestionOpen(
  site: SiteDataKept | undefined,
  dataOn: string | null,
  today: string,
  roofWithNoBuilding: boolean,
): boolean {
  if (site?.changed !== undefined && site.changed.dataOn === dataOn) return false;
  return roofWithNoBuilding || heightDataStale(dataOn, today);
}

/** Whether the data's heights stand: not when a person said the building changed since this data. */
export function dataHeightsApply(site: SiteDataKept | undefined, dataOn: string | null): boolean {
  return !(site?.changed?.changed === true && site.changed.dataOn === dataOn);
}

/**
 * A roof's height from its floors: the plinth, then one storey for the ground floor and one for each
 * floor above it.
 */
export function heightFromFloors(
  floorsAbove: number,
  market: { readonly plinthHeightM: number; readonly storeyHeightM: number },
): number {
  return Math.round((market.plinthHeightM + market.storeyHeightM * (floorsAbove + 1)) * 100) / 100;
}
