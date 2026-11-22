import {
  edgesCross,
  GROUND_REACH_M,
  PICTURE_CHOICES,
  PICTURE_METRES_PER_UNIT_MAX,
  PICTURE_METRES_PER_UNIT_MIN,
  PICTURE_SCALE_MAX,
  PICTURE_SCALE_MIN,
  PICTURE_SCALE_SOURCES,
  PLAN_SEE_THROUGH_MAX,
  PLAN_SEE_THROUGH_MIN,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
  ROOF_EDGE_TRUSTS,
  ROOF_HEIGHT_MAX_M,
  ROOF_HEIGHT_MIN_M,
  ROOFS_MAX,
  SKY_PICTURE_GAPS,
  SKY_PICTURE_SOURCES,
  STUDIO_DOCUMENT_SCHEMA,
  VALUE_SETTERS,
} from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum, memberRefSchema, uuidSchema } from '../common';
import { errorEnvelopeWithFacts } from '../error';

/**
 * The design document on the wire: one per design, saved whole on each change. Its shape is
 * domain's `StudioDocument`; `schemaVersion` names the shape, and `version` counts the saves, so a
 * save that started from an older count is refused rather than laid over a newer one (`F4-15`).
 */

const calendarDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Metres east or north of the pin: a real number, within the site's reach. */
const groundMetreSchema = z.number().finite().min(-GROUND_REACH_M).max(GROUND_REACH_M);
const groundPointSchema = z.object({ east: groundMetreSchema, north: groundMetreSchema }).strict();

const roofHeightSchema = z
  .object({
    metres: z.number().min(ROOF_HEIGHT_MIN_M).max(ROOF_HEIGHT_MAX_M),
    setBy: z.enum(VALUE_SETTERS),
  })
  .strict();

/**
 * One roof's outline (domain's `Roof`): its edges never cross, and each corner starts one edge.
 * `height` came after the first roofs: a roof sent or stored without it stands at the market's
 * storey height, set by the system.
 */
export const roofSchema = z
  .object({
    id: uuidSchema,
    corners: z.array(groundPointSchema).min(ROOF_CORNERS_MIN).max(ROOF_CORNERS_MAX),
    edges: z.array(z.enum(ROOF_EDGE_TRUSTS)).min(ROOF_CORNERS_MIN).max(ROOF_CORNERS_MAX),
    tracedOn: z.enum(PICTURE_CHOICES),
    height: roofHeightSchema.nullable().default(null),
  })
  .strict()
  .refine((roof) => roof.edges.length === roof.corners.length, {
    message: 'Each corner starts one edge.',
    path: ['edges'],
  })
  // The crossing check walks every pair of edges: it runs only on a corner count the roof may have,
  // so an outsized body is refused by its count, not checked at length.
  .refine((roof) => roof.corners.length <= ROOF_CORNERS_MAX && !edgesCross(roof.corners), {
    message: 'The roof’s edges cross.',
    path: ['corners'],
  });

/**
 * A picture of the company's own as it lies on the ground (domain's `LaidPicture`): which stored
 * picture, where its origin lies, its turn clockwise from north, and its scale and where that came
 * from.
 */
const laidPictureShape = {
  pictureId: uuidSchema,
  at: groundPointSchema,
  turnDeg: z.number().gt(-180).lte(180),
  metresPerUnit: z.number().min(PICTURE_METRES_PER_UNIT_MIN).max(PICTURE_METRES_PER_UNIT_MAX),
  scaleFrom: z.enum(PICTURE_SCALE_SOURCES),
};
export const laidPictureSchema = z.object(laidPictureShape).strict();
export const laidPlanSchema = z
  .object({
    ...laidPictureShape,
    seeThrough: z.number().int().min(PLAN_SEE_THROUGH_MIN).max(PLAN_SEE_THROUGH_MAX),
    locked: z.boolean(),
    hidden: z.boolean(),
    page: z.number().int().min(1),
  })
  .strict();

/**
 * `roofs`, `pictureScale`, `ownPicture` and `plan` came after the first documents were saved: a save may leave them out,
 * and a document stored without them reads as no roofs at the picture's own scale; one without
 * `ownPicture` or `plan` has no picture of the company's own and no plan.
 */
export const studioDocumentSchema = z
  .object({
    schemaVersion: z.literal(STUDIO_DOCUMENT_SCHEMA),
    picture: z.enum(PICTURE_CHOICES).nullable(),
    drawnOn: z
      .object({ source: z.string().min(1).max(40), takenOn: calendarDaySchema.nullable() })
      .strict()
      .nullable(),
    roofs: z.array(roofSchema).max(ROOFS_MAX).default([]),
    pictureScale: z.number().min(PICTURE_SCALE_MIN).max(PICTURE_SCALE_MAX).default(1),
    // Absent until a studio lays one: a reader from before them refuses any key it does not know,
    // so an answer carries neither until the release that writes them.
    ownPicture: laidPictureSchema.nullable().optional(),
    plan: laidPlanSchema.nullable().optional(),
  })
  .strict();
export type StudioDocumentWire = z.infer<typeof studioDocumentSchema>;

/** Who holds the design's turn to edit; `null` when no one does. `mine`: the reader holds it. */
export const editTurnSchema = z.object({ editor: memberRefSchema, mine: z.boolean() }).nullable();
export type EditTurnWire = z.infer<typeof editTurnSchema>;

/** A design's document as it stands: `version` 0 is a design no one has saved yet. */
export const designDocumentSchema = z.object({
  document: studioDocumentSchema,
  version: z.number().int().nonnegative(),
  savedAt: z.string().datetime().nullable(),
  savedBy: memberRefSchema.nullable(),
  editTurn: editTurnSchema,
});
export type DesignDocumentWire = z.infer<typeof designDocumentSchema>;

/**
 * A save: the whole document, the version the change was made on, and the opening of the studio
 * that made it — a random id each opening draws — so a save whose answer was lost is told apart
 * from the same person's save on another device.
 */
export const saveDocumentSchema = z
  .object({
    baseVersion: z.number().int().nonnegative(),
    document: studioDocumentSchema,
    opening: uuidSchema,
  })
  .strict();
export type SaveDocument = z.infer<typeof saveDocumentSchema>;

export const savedDocumentSchema = z.object({
  version: z.number().int().positive(),
  savedAt: z.string().datetime(),
});
export type SavedDocument = z.infer<typeof savedDocumentSchema>;

/** Someone saved after the version this save started from: who, and when. Nothing merges. */
export const DESIGN_SAVED_FIRST = 'DESIGN_SAVED_FIRST' as const;
/** Another person holds the design's turn to edit. */
export const DESIGN_EDIT_TURN_HELD = 'DESIGN_EDIT_TURN_HELD' as const;
export const designSaveConflictEnvelope = z.union([
  errorEnvelopeWithFacts(
    z.literal(DESIGN_SAVED_FIRST),
    z.object({
      version: z.number().int().positive(),
      savedAt: z.string().datetime(),
      savedBy: memberRefSchema.nullable(),
      /** The save that came first was this opening's own, whose answer was lost. */
      byThisOpening: z.boolean(),
    }),
  ),
  errorEnvelopeWithFacts(z.literal(DESIGN_EDIT_TURN_HELD), z.object({ editor: memberRefSchema })),
]);

/**
 * One piece of a sky picture and the ground it covers, in metres east and north of the pin. The
 * picture is fetched each time a design opens and lives only in the reader's memory: it is never
 * stored or put in a file, so it travels as the image itself.
 */
export const skyPicturePieceSchema = z.object({
  image: z.string().startsWith('data:image/'),
  west: z.number(),
  south: z.number(),
  east: z.number(),
  north: z.number(),
});
export type SkyPicturePiece = z.infer<typeof skyPicturePieceSchema>;

/** The sky picture of a design's site, or why there is none. */
export const skyPictureSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('picture'),
    source: extensibleEnum(SKY_PICTURE_SOURCES),
    /** The provider's credit line, as the provider words it. */
    credit: z.string(),
    /** The picture's sharpness: the ground one pixel covers. */
    metresPerPixel: z.number().positive(),
    /** `YYYY-MM-DD`, or `null` when the provider does not say. */
    takenOn: calendarDaySchema.nullable(),
    pieces: z.array(skyPicturePieceSchema).min(1),
    /**
     * A softer picture round the sharp one, at a coarser zoom: the street and the neighbours, to
     * find the building and to move round it. Absent from an api older than it: read as none.
     */
    around: z.array(skyPicturePieceSchema).optional(),
  }),
  z.object({ kind: z.literal('none'), gap: extensibleEnum(SKY_PICTURE_GAPS) }),
]);
export type SkyPictureWire = z.infer<typeof skyPictureSchema>;
