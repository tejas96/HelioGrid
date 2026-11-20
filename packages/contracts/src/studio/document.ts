import {
  PICTURE_CHOICES,
  SKY_PICTURE_GAPS,
  SKY_PICTURE_SOURCES,
  STUDIO_DOCUMENT_SCHEMA,
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

export const studioDocumentSchema = z
  .object({
    schemaVersion: z.literal(STUDIO_DOCUMENT_SCHEMA),
    picture: z.enum(PICTURE_CHOICES).nullable(),
    drawnOn: z
      .object({ source: z.string().min(1).max(40), takenOn: calendarDaySchema.nullable() })
      .strict()
      .nullable(),
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
