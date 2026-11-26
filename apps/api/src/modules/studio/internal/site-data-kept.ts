import {
  type HeightMapAnswer,
  heightGridWireSchema,
  pictureGridWireSchema,
  siteBuildingSchema,
  siteEaveSchema,
} from '@heliogrid/contracts';
import {
  type Coordinate,
  type GroundBox,
  HEIGHT_DATA_KEEP_DAYS,
  HEIGHT_DATA_QUALITIES,
} from '@heliogrid/domain';
import {
  CALL_RADIUS_MAX_M,
  gridToWire,
  pictureToWire,
  siteReadOf,
} from '@heliogrid/domain/studio-kernel';
import { z } from 'zod';
import { bandsOf } from './geotiff-read';

/**
 * What the api keeps of a place's height data for up to 30 days (`T-M05-002`, part g; Solar terms
 * §21.2): Google's answers as they came — the panels step reads them later with no new call — and
 * the site data read from them, so a place is read once a month whoever designs there. Every kept
 * shape names the moment it was kept; one older than 30 days is never served.
 */

const DAY_MS = 86_400_000;
const KEEP_MS = HEIGHT_DATA_KEEP_DAYS * DAY_MS;

/** A call's middle, snapped to a grid about 22 m a side, so neighbours' pins share one call. */
const SNAP_DEG = 0.0002;
/** A snapped call reaches this much further, so it still covers what the pin's call would. */
const SNAP_MARGIN_M = 16;
/**
 * A call's radius is a whole number of these, at least the smallest: so a roof edit that grows a
 * group by a metre still finds the map kept for it, as the radius is part of the kept key.
 */
const RADIUS_STEP_M = 25;
const RADIUS_MIN_M = 50;

export const snapped = (point: Coordinate): Coordinate => ({
  latitude: Math.round(point.latitude / SNAP_DEG) * SNAP_DEG,
  longitude: Math.round(point.longitude / SNAP_DEG) * SNAP_DEG,
});

/** A call's radius from its snapped middle: its group's, the snap's margin more, within Google's. */
export const snappedRadius = (radiusM: number): number =>
  Math.min(
    CALL_RADIUS_MAX_M,
    Math.max(RADIUS_MIN_M, Math.ceil((radiusM + SNAP_MARGIN_M) / RADIUS_STEP_M) * RADIUS_STEP_M),
  );

/** Four decimals of a degree, about 10 m: the snap's grid is coarser. */
const KEY_DIGITS = 4;
const RGB = 3;

/** Five decimals of a degree, about a metre: Google answers the one building nearest a point. */
const POINT_DIGITS = 5;
const pointOf = (point: Coordinate) =>
  `${point.latitude.toFixed(POINT_DIGITS)}_${point.longitude.toFixed(POINT_DIGITS)}`;

const placeOf = (point: Coordinate) =>
  `${point.latitude.toFixed(KEY_DIGITS)}_${point.longitude.toFixed(KEY_DIGITS)}`;

export const keys = {
  heightMap: (call: Coordinate, radiusM: number, sharpest: boolean) =>
    `solar/height-map/${placeOf(call)}_${Math.round(radiusM)}${sharpest ? '_sharpest' : ''}.json`,
  building: (point: Coordinate) => `solar/building/${pointOf(point)}.json`,
  horizon: (call: Coordinate) => `pvgis/horizon/${placeOf(call)}.json`,
  /** Which kept height map covers a pin: its own call's, wherever its roofs put that call. */
  pinMap: (pin: Coordinate) => `solar/pin-map/${pointOf(pin)}.json`,
};

/**
 * The kept shapes' version: a kept answer of another version — written by a release before a
 * change to these shapes — is read as none and asked again, never served as this shape.
 */
export const keptVersion = 1;

const keptSchema = { v: z.literal(keptVersion), keptAt: z.number() };
const dataOnSchema = z.string().nullable();

/** A height map as kept: read round its call's middle, on its own datum. */
export const keptHeightMapSchema = z.object({
  ...keptSchema,
  /** The point the map was asked and read round: every place in it is in metres from here. */
  middle: z.object({ latitude: z.number(), longitude: z.number() }),
  quality: z.enum(HEIGHT_DATA_QUALITIES),
  dataOn: dataOnSchema,
  /** Metres above sea level that the kept heights count from. */
  datumM: z.number(),
  /** The whole map at its own sharpness, metres east and north of the call's middle. */
  grid: heightGridWireSchema,
  buildings: z.array(siteBuildingSchema),
  eaves: z.array(siteEaveSchema),
  straightDown: pictureGridWireSchema.nullable(),
  /** Google's files as they came, as base64. */
  files: z.object({ surface: z.string(), buildings: z.string(), picture: z.string().nullable() }),
});
export type KeptHeightMap = z.infer<typeof keptHeightMapSchema>;

/** Where the height map covering a pin is kept: the straight-down picture is read from it. */
export const keptPinMapSchema = z.object({ ...keptSchema, key: z.string().min(1) });

/** A place Google holds no height map of — kept too, so it is not asked again for 30 days. */
export const keptNoMapSchema = z.object({ ...keptSchema, none: z.literal(true) });

const pointSchema = z.object({ latitude: z.number(), longitude: z.number() });

/** Google's building nearest a point; `null` where it holds none, kept the same way. */
export const keptBuildingSchema = z.object({
  ...keptSchema,
  answer: z
    .object({
      quality: z.enum(HEIGHT_DATA_QUALITIES),
      dataOn: dataOnSchema,
      middle: pointSchema,
      faces: z.array(
        z.object({
          middle: pointSchema,
          slopeDeg: z.number(),
          facingDeg: z.number(),
          areaM2: z.number(),
          heightAboveSeaM: z.number(),
        }),
      ),
      reply: z.unknown(),
    })
    .nullable(),
});
export type KeptBuilding = z.infer<typeof keptBuildingSchema>;

export const keptHorizonSchema = z.object({
  ...keptSchema,
  points: z
    .array(z.object({ bearingFromSouthDeg: z.number(), elevationDeg: z.number() }))
    .nullable(),
});
export type KeptHorizon = z.infer<typeof keptHorizonSchema>;

/** Whether a kept answer may still be served at `now`. */
export const fresh = (kept: { readonly keptAt: number } | null, now: number): boolean =>
  kept !== null && now - kept.keptAt < KEEP_MS;

const WHOLE_MAP: GroundBox = { west: -1_000, east: 1_000, south: -1_000, north: 1_000 };

/** Google's height map read into what is kept; `null` where it holds no ground round the call. */
export async function keptHeightMapOf(
  call: Coordinate,
  answer: HeightMapAnswer,
  now: number,
): Promise<KeptHeightMap | null> {
  const [dsm] = await bandsOf(answer.surface);
  const [mask] = await bandsOf(answer.buildings);
  if (dsm === undefined || mask === undefined) throw new Error('a height map came with no band');
  const rgb = answer.picture === null ? null : await bandsOf(answer.picture);
  const read = siteReadOf({
    pin: call,
    dsm,
    mask,
    rgb:
      rgb !== null && rgb.length >= RGB
        ? [
            rgb[0] as (typeof rgb)[number],
            rgb[1] as (typeof rgb)[number],
            rgb[2] as (typeof rgb)[number],
          ]
        : null,
    near: WHOLE_MAP,
  });
  if (read === null) return null;
  return {
    v: keptVersion,
    keptAt: now,
    middle: { latitude: call.latitude, longitude: call.longitude },
    quality: answer.quality,
    dataOn: answer.dataOn,
    datumM: read.datumM,
    grid: gridToWire(read.near),
    buildings: read.buildings.map((building) => ({ ...building, outline: [...building.outline] })),
    eaves: [...read.eaves],
    straightDown: read.picture === null ? null : pictureToWire(read.picture),
    files: {
      surface: Buffer.from(answer.surface).toString('base64'),
      buildings: Buffer.from(answer.buildings).toString('base64'),
      picture: answer.picture === null ? null : Buffer.from(answer.picture).toString('base64'),
    },
  };
}
