import {
  FLOORS_ABOVE_MAX,
  HEIGHT_DATA_QUALITIES,
  LINE_UP_LIFT_MAX_M,
  LINE_UP_SHIFT_MAX_M,
  SITE_DATA_CREDITS,
  SITE_DATA_GAPS,
  SITE_DATA_SOURCES,
} from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum } from '../common';
import { groundPointSchema } from './roof';

/**
 * The site data on the wire (`T-M05-002`, part g): what the height map, the building data, the far
 * hills and the time zone say of a design's site, read by the api in the request and sent as one
 * small answer — heights as two-byte centimetres, never Google's raw files. Every place in it is on
 * the site's ground, metres east and north of the pin; every height in metres above the site's
 * datum, the ground of the pin's building.
 */

const calendarDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const metres = z.number().finite();

/** Domain's `HeightGridWire`: heights in whole centimetres, two bytes each, little-endian base64. */
export const heightGridWireSchema = z.object({
  west: metres,
  south: metres,
  stepM: z.number().positive(),
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
  centimetres: z.string(),
});

/** Domain's `PictureGridWire`: a grey picture, one byte a cell, base64. */
export const pictureGridWireSchema = z.object({
  west: metres,
  south: metres,
  stepM: z.number().positive(),
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
  grey: z.string(),
});

/** Far-horizon and skyline angles, `stepDeg` apart from north clockwise. */
export const skylineWireSchema = z.object({
  stepDeg: z.number().positive(),
  elevationsDeg: z.array(z.number().min(0).max(90)),
});

const outlineSchema = z.array(groundPointSchema).min(3);

export const siteBuildingSchema = z.object({
  outline: outlineSchema,
  groundM: metres,
  heightM: z.number().nonnegative().nullable(),
  floorsAbove: z.number().int().nonnegative().nullable(),
});

export const siteEaveSchema = z.object({
  from: groundPointSchema,
  to: groundPointSchema,
  heightM: z.number().nonnegative(),
});

export const siteFaceSchema = z.object({
  middle: groundPointSchema,
  slopeDeg: z.number().min(0).max(90),
  facingDeg: z.number().min(0).lt(360),
  areaM2: z.number().nonnegative(),
  heightM: metres,
});

/**
 * One part of the site the height map covers: a house is one, a campus one for each group of
 * roofs. `grid` is the sharp heights round the roofs, `surround` a metre a cell to the data's edge.
 */
export const siteAreaSchema = z.object({
  grid: heightGridWireSchema,
  surround: heightGridWireSchema,
});

export const siteDataSchema = z.object({
  source: extensibleEnum(SITE_DATA_SOURCES),
  /** How sharp the height map is; `null` where there is none. */
  quality: extensibleEnum(HEIGHT_DATA_QUALITIES).nullable(),
  /** The height data's own date, `YYYY-MM-DD`; `null` where it gives none. */
  dataOn: calendarDaySchema.nullable(),
  areas: z.array(siteAreaSchema),
  buildings: z.array(siteBuildingSchema),
  eaves: z.array(siteEaveSchema),
  faces: z.array(siteFaceSchema),
  /** Google's straight-down picture round the pin, grey, to line the height map up by its edges. */
  straightDown: pictureGridWireSchema.nullable(),
  /** The far hills, from PVGIS; `null` where it did not answer or the place is over the sea. */
  farHorizon: skylineWireSchema.nullable(),
  /** The site's IANA time zone; `null` where the point is in none (at sea). */
  timeZone: z.string().min(1).max(64).nullable(),
  /** Whose data shows: each one's credit line shows where its data does. */
  credits: z.array(extensibleEnum(SITE_DATA_CREDITS)),
  /** What did not answer, each said in one line. */
  gaps: z.array(extensibleEnum(SITE_DATA_GAPS)),
});
export type SiteDataWire = z.infer<typeof siteDataSchema>;

/**
 * What the design keeps of its site's data (domain's `SiteDataKept`). Every reader takes it one
 * release before any studio writes it: a reader from before it refuses a key it does not know.
 */
export const siteDataKeptSchema = z
  .object({
    dataStamp: z
      .object({
        source: z.enum(SITE_DATA_SOURCES),
        quality: z.enum(HEIGHT_DATA_QUALITIES).nullable(),
        dataOn: calendarDaySchema.nullable(),
      })
      .strict()
      .optional(),
    changed: z
      .object({ dataOn: calendarDaySchema.nullable(), changed: z.boolean() })
      .strict()
      .optional(),
    floors: z.number().int().min(0).max(FLOORS_ABOVE_MAX).optional(),
    lineUp: z
      .object({
        east: z.number().min(-LINE_UP_SHIFT_MAX_M).max(LINE_UP_SHIFT_MAX_M),
        north: z.number().min(-LINE_UP_SHIFT_MAX_M).max(LINE_UP_SHIFT_MAX_M),
        lift: z.number().min(-LINE_UP_LIFT_MAX_M).max(LINE_UP_LIFT_MAX_M),
      })
      .strict()
      .optional(),
  })
  .strict();
