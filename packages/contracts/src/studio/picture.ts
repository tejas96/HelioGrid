import {
  DESIGN_PICTURE_FILE_ROLES,
  DESIGN_PICTURE_KINDS,
  DESIGN_PICTURE_REFUSALS,
  DESIGN_PICTURE_STATES,
  PICTURE_METRES_PER_UNIT_MAX,
  PICTURE_METRES_PER_UNIT_MIN,
  PLAN_LINES_MAX,
  PLAN_UNITS,
} from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum, geoPointSchema, memberRefSchema, uuidSchema } from '../common';
import { errorEnvelope } from '../error';

/**
 * A picture of the company's own (`T-M05-002d`): a photo, a drone map or a plan, stored with the
 * design (`design_picture`) and never changed. A photo, a drone map, a PDF and a text DXF are read
 * on the device, which stores the cut-out pieces and the plan's lines; a DWG or a binary DXF is
 * stored whole and read on our server into the same lines.
 */

const calendarDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const metresPerUnitSchema = z
  .number()
  .min(PICTURE_METRES_PER_UNIT_MIN)
  .max(PICTURE_METRES_PER_UNIT_MAX);

/** A PDF this long is read whole; a longer one is not a house's plans. */
export const DESIGN_PICTURE_PAGES_MAX = 200;
/** The most stored files one picture keeps: a drone map's 200 m at 3 cm is 49 pieces. */
export const DESIGN_PICTURE_FILES_MAX = 120;
export const DESIGN_PICTURE_NAME_MAX = 200;

/** A box in the picture's own units — pixels, drawing units or PDF points — about its origin. */
const pictureBoxSchema = z
  .object({ west: z.number(), south: z.number(), east: z.number(), north: z.number() })
  .strict()
  .refine((box) => box.west < box.east && box.south < box.north, { message: 'An empty box.' });

/**
 * What the file said of itself. `metresPerUnit`, `turnDeg` and `centre` are the file's own scale,
 * north and place — `null` where it has none: a photo has none of them, a drone map whose place
 * system we cannot read has its scale alone. `unit` is a CAD plan's unit as the file names it;
 * `unitGuess` is ours, from the plan's size, for one that names none. `takenOn` is the capture date
 * where the file holds one.
 */
export const designPictureFactsSchema = z
  .object({
    takenOn: calendarDaySchema.nullable(),
    metresPerUnit: metresPerUnitSchema.nullable(),
    turnDeg: z.number().min(-180).max(180).nullable(),
    centre: geoPointSchema.nullable(),
    unit: z.enum(PLAN_UNITS).nullable(),
    unitGuess: z.enum(PLAN_UNITS).nullable(),
    pages: z.number().int().min(1).max(DESIGN_PICTURE_PAGES_MAX),
    /** The page we laid first: the one most like a plan, the roof's or terrace's before a floor's. */
    pickedPage: z.number().int().min(1).max(DESIGN_PICTURE_PAGES_MAX),
  })
  .strict()
  .refine((facts) => facts.pickedPage <= facts.pages, {
    message: 'The picked page is past the last.',
    path: ['pickedPage'],
  });
export type DesignPictureFacts = z.infer<typeof designPictureFactsSchema>;

const pictureFileRefSchema = z
  .object({
    fileId: uuidSchema,
    page: z.number().int().min(1).max(DESIGN_PICTURE_PAGES_MAX),
    role: z.enum(DESIGN_PICTURE_FILE_ROLES),
    /** A piece's box; `null` for a page's lines, which carry their own extent. */
    box: pictureBoxSchema.nullable(),
  })
  .strict()
  .refine((part) => (part.role === 'piece') === (part.box !== null), {
    message: 'A piece has its box; lines have none.',
    path: ['box'],
  });

/** Keep a picture read on the device: its facts and the files it already stored and confirmed. */
export const addDesignPictureSchema = z
  .object({
    kind: z.enum(DESIGN_PICTURE_KINDS),
    name: z.string().trim().min(1).max(DESIGN_PICTURE_NAME_MAX),
    facts: designPictureFactsSchema,
    files: z.array(pictureFileRefSchema).min(1).max(DESIGN_PICTURE_FILES_MAX),
  })
  .strict();
export type AddDesignPicture = z.infer<typeof addDesignPictureSchema>;

/** Keep a CAD plan our server reads: the DWG or binary DXF already stored and confirmed. */
export const addCadPlanSchema = z
  .object({
    name: z.string().trim().min(1).max(DESIGN_PICTURE_NAME_MAX),
    fileId: uuidSchema,
  })
  .strict();
export type AddCadPlan = z.infer<typeof addCadPlanSchema>;

/** One stored part as a reader fetches it: a short-lived link to its bytes. */
const pictureFileSchema = z.object({
  page: z.number().int().positive(),
  role: extensibleEnum(DESIGN_PICTURE_FILE_ROLES),
  box: pictureBoxSchema.nullable(),
  url: z.string().url(),
  expiresAt: z.string().datetime(),
});

/**
 * A picture as it stands. `facts` and `files` are empty while our server still reads a plan, and
 * stay so when it could not: `refusal` says why.
 */
export const designPictureSchema = z.object({
  id: uuidSchema,
  kind: extensibleEnum(DESIGN_PICTURE_KINDS),
  name: z.string(),
  state: extensibleEnum(DESIGN_PICTURE_STATES),
  refusal: extensibleEnum(DESIGN_PICTURE_REFUSALS).nullable(),
  facts: designPictureFactsSchema.nullable(),
  files: z.array(pictureFileSchema),
  addedAt: z.string().datetime(),
  addedBy: memberRefSchema.nullable(),
});
export type DesignPictureWire = z.infer<typeof designPictureSchema>;

export const designPictureParamsSchema = z.object({ id: uuidSchema, pictureId: uuidSchema });

/**
 * A file named that this design cannot keep: not stored against it, not yet confirmed, or not of a
 * type its part takes — a piece is a JPEG, lines are JSON, a server-read plan is a DWG or DXF.
 */
export const DESIGN_PICTURE_FILE_REFUSED = 'DESIGN_PICTURE_FILE_REFUSED' as const;
export const designPictureFileRefusedEnvelope = errorEnvelope(
  z.literal(DESIGN_PICTURE_FILE_REFUSED),
);

/**
 * A plan's lines, one file per page: the device's readers and our server's write it, the studio
 * draws it. Points are in the plan's own units, `[x0, y0, x1, y1, …]`, y up.
 */
export const planLinesSchema = z
  .object({
    page: z.number().int().min(1).max(DESIGN_PICTURE_PAGES_MAX),
    extent: pictureBoxSchema,
    lines: z
      .array(
        z
          .object({
            points: z
              .array(z.number().finite())
              .min(4)
              .refine((points) => points.length % 2 === 0, { message: 'An x without its y.' }),
            closed: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(PLAN_LINES_MAX),
  })
  .strict();
export type PlanLines = z.infer<typeof planLinesSchema>;
