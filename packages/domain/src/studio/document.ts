/**
 * The design document: everything a person makes in the studio, stored whole, one per design. It
 * names no record of a host's (`docs/tasks/M05-design-studio.md`, *The wall*). Every place in it is
 * on the site's ground (`ground.ts`), never on a picture.
 */

/** The document's shape version. A reader meets only the versions it knows how to read. */
export const STUDIO_DOCUMENT_SCHEMA = 1 as const;

/**
 * The pictures a roof can be drawn on: the sky picture a map service gives, the company's own
 * photo, drone map or plan, or none — a roof then has its typed size alone.
 */
export const PICTURE_CHOICES = ['sky', 'own', 'none'] as const;
export type PictureChoice = (typeof PICTURE_CHOICES)[number];

/** Who gives the sky picture. */
export const SKY_PICTURE_SOURCES = ['google'] as const;
export type SkyPictureSource = (typeof SKY_PICTURE_SOURCES)[number];

/**
 * Why a site has no sky picture: no service is set up for this company's studio, the service did
 * not answer, or it holds no picture of this place.
 */
export const SKY_PICTURE_GAPS = ['not_set_up', 'not_answered', 'not_covered'] as const;
export type SkyPictureGap = (typeof SKY_PICTURE_GAPS)[number];

/** The picture a roof was first drawn on: who gave it, and the day it was taken where known. */
export interface PictureStamp {
  readonly source: string;
  /** `YYYY-MM-DD`, or `null` when the service does not say. */
  readonly takenOn: string | null;
}

export interface StudioDocument {
  readonly schemaVersion: typeof STUDIO_DOCUMENT_SCHEMA;
  /** The picture a person picked; `null` lets the studio pick by itself. */
  readonly picture: PictureChoice | null;
  /** The picture the first roof was drawn on, kept so a newer one is told apart; `null` until then. */
  readonly drawnOn: PictureStamp | null;
}

/** A design no one has changed yet. */
export const EMPTY_STUDIO_DOCUMENT: StudioDocument = {
  schemaVersion: STUDIO_DOCUMENT_SCHEMA,
  picture: null,
  drawnOn: null,
};

/** What the studio knows of the sky picture of a site. */
export type SkyPictureRead =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly takenOn: string | null }
  | { readonly kind: 'none'; readonly gap: SkyPictureGap };

/** Why the ground shows no picture: a person picked none, or the sky picture is not to be had. */
export type NoPictureReason = 'picked' | SkyPictureGap;

/** The picture the ground shows. While the sky picture is still on its way, the ground waits for it. */
export type ShownPicture =
  | { readonly kind: 'sky' }
  | { readonly kind: 'waiting' }
  | { readonly kind: 'none'; readonly reason: NoPictureReason };

/**
 * The picture is picked by itself — the sky picture first, then the company's own, then none —
 * unless a person picked one. A company's own picture is added in a later part of the roof step;
 * until it is, picking it shows none, as a picked "none" does.
 */
export function shownPicture(choice: PictureChoice | null, sky: SkyPictureRead): ShownPicture {
  if (choice === 'none' || choice === 'own') return { kind: 'none', reason: 'picked' };
  if (sky.kind === 'loading') return { kind: 'waiting' };
  if (sky.kind === 'none') return { kind: 'none', reason: sky.gap };
  return { kind: 'sky' };
}

/**
 * Whether the picture fetched now was taken after the one the roof was drawn on — the studio then
 * asks once to check the outline. Unknown dates never claim a change.
 */
export function pictureNewerThanDrawn(
  drawnOn: PictureStamp | null,
  fetchedTakenOn: string | null,
): boolean {
  if (drawnOn === null || drawnOn.takenOn === null || fetchedTakenOn === null) return false;
  return fetchedTakenOn > drawnOn.takenOn;
}
