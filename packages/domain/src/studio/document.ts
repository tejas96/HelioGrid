import type { GroundPoint } from './ground';
import type { LaidPicture, LaidPlan } from './own-picture';
import type {
  RoofHeight,
  RoofKindSet,
  RoofMaterialSet,
  RoofParapet,
  RoofShapeSet,
  RoofSide,
  SetDegrees,
  SetMetres,
} from './roof-parts';

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

/**
 * How an edge's length is known: traced on the picture (drawn dashed), typed by a person (solid),
 * measured on site (solid, with a tick), the market's usual size a typed roof starts at, which no
 * person set, or read from a CAD plan (`T-M05-002d`) — exact, so solid like a set length, and
 * derived. Every reader takes `assumed` and `plan` before anything writes them: an open studio older
 * than the release that writes one would refuse the design (`CLAUDE.md` §8, expand then contract).
 */
export const ROOF_EDGE_TRUSTS = ['traced', 'typed', 'measured', 'assumed', 'plan'] as const;
export type RoofEdgeTrust = (typeof ROOF_EDGE_TRUSTS)[number];

/** A length a person set: typed, or measured on site. */
export type SetEdgeTrust = Extract<RoofEdgeTrust, 'typed' | 'measured'>;

/**
 * Whether this length is held: it holds while other corners move, and its label always shows. A
 * person's length is, and so is a plan's, which is exact.
 */
export function lengthHeld(trust: RoofEdgeTrust): boolean {
  return trust === 'typed' || trust === 'measured' || trust === 'plan';
}

/**
 * A design holds at most this many roofs: what a studio lets a person draw. A reader takes more
 * (`ROOFS_READ_MAX`) one release before any studio draws them (`CLAUDE.md` §8, expand then
 * contract).
 */
export const ROOFS_MAX = 50;
/** How many roofs a stored design may hold: 100 houses, each with a stair room (`T-M05-002`, part e). */
export const ROOFS_READ_MAX = 200;
/**
 * How many corners a design's roofs hold in all, so a design at every cap stays under the save's
 * size limit.
 */
export const CORNERS_TOTAL_MAX = 2_000;

/**
 * How far from the pin a corner may lie, in metres east or north: far past any picture (about
 * 460 m across), near enough that the ground stays flat (`ground.ts`).
 */
export const GROUND_REACH_M = 2_000;

/** How far the first true length may stretch or shrink the picture: five times either way. */
export const PICTURE_SCALE_MIN = 0.2;
export const PICTURE_SCALE_MAX = 5;

/** One roof's outline on the site's ground. */
export interface Roof {
  /** Made by the studio when the roof closes; names the roof inside its design, never a record. */
  readonly id: string;
  /** Metres east and north of the pin, in order: 3 to 100 corners (`roof-shape.ts`). */
  readonly corners: readonly GroundPoint[];
  /** How each edge's length is known: edge i runs from corner i to corner i + 1. */
  readonly edges: readonly RoofEdgeTrust[];
  /** The picture the roof was traced on. */
  readonly tracedOn: PictureChoice;
  /**
   * The roof's height. `null` on a roof stored before heights, or one no one has set: it stands
   * at the market's storey height, set by the system (`roofHeightOf`).
   */
  readonly height: RoofHeight | null;
  /*
   * Part e's fields. Each is absent on a roof stored before it, and an absent one reads as the
   * studio's own value: a building on the ground, of the first material, flat, with the market's
   * parapet and setback (`roof-kind.ts`).
   */
  /** What the roof is; absent, a building. */
  readonly kind?: RoofKindSet;
  /**
   * The roof it stands on, by id: its height is counted from that roof's. Absent, or naming no
   * roof of the design, it stands on the ground.
   */
  readonly on?: string;
  /**
   * The roof it belongs to, by id, where that is not the one it stands on: a hole's or a separate
   * part's roof, or the roof an upper floor across two roofs covers most. It moves, copies and
   * goes with that roof.
   */
  readonly partOf?: string;
  readonly material?: RoofMaterialSet;
  readonly shape?: RoofShapeSet;
  /** The roof's one slope; a side or a face with its own carries it there. */
  readonly slope?: SetDegrees;
  /** How far a sloped roof's drip edge — its outline — lies past its walls. */
  readonly overhang?: SetMetres;
  readonly parapet?: RoofParapet;
  /** The roof's one setback, in from the inside of its parapet. */
  readonly setback?: SetMetres;
  /**
   * What each side holds of its own, one entry for each corner. A list that does not match the
   * corners reads as no entry at all (`roofSidesOf`).
   */
  readonly sides?: readonly RoofSide[];
}

export interface StudioDocument {
  readonly schemaVersion: typeof STUDIO_DOCUMENT_SCHEMA;
  /** The picture a person picked; `null` lets the studio pick by itself. */
  readonly picture: PictureChoice | null;
  /** The picture the first roof was drawn on, kept so a newer one is told apart; `null` until then. */
  readonly drawnOn: PictureStamp | null;
  /** The roofs, in the order they were drawn: roof 1 first. A document saved before roofs has none. */
  readonly roofs: readonly Roof[];
  /**
   * How much the picture is stretched about the pin to its true size: 1 until the first true length
   * is set, which sizes the picture and every roof on it together (`roof-length.ts`).
   */
  readonly pictureScale: number;
  /**
   * The company's own photo or drone map laid as the ground, shown when `picture` is `own`; `null`
   * or absent when none is laid. A document saved before part d has none.
   */
  readonly ownPicture?: LaidPicture | null;
  /** The plan laid over the ground, whichever picture shows; absent or `null` when none is laid. */
  readonly plan?: LaidPlan | null;
  /** A person passed over "Where do the stairs reach the roof?": it is not asked again. */
  readonly stairsSkipped?: boolean;
}

/** A design no one has changed yet. */
export const EMPTY_STUDIO_DOCUMENT: StudioDocument = {
  schemaVersion: STUDIO_DOCUMENT_SCHEMA,
  picture: null,
  drawnOn: null,
  roofs: [],
  pictureScale: 1,
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
  /** The company's own photo or drone map (`T-M05-002d`). */
  | { readonly kind: 'own' }
  | { readonly kind: 'waiting' }
  | { readonly kind: 'none'; readonly reason: NoPictureReason };

/**
 * The picture is picked by itself — the sky picture first, then none — unless a person picked one.
 * The company's own shows when it is picked and one is laid (`T-M05-002d`); picked with none laid,
 * the ground shows none, as a picked "none" does.
 */
export function shownPicture(
  choice: PictureChoice | null,
  sky: SkyPictureRead,
  ownLaid = false,
): ShownPicture {
  if (choice === 'own') return ownLaid ? { kind: 'own' } : { kind: 'none', reason: 'picked' };
  if (choice === 'none') return { kind: 'none', reason: 'picked' };
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

/**
 * The picture the roofs were drawn on is newer now (`T-M05-002d`, board 5.1): the sky picture for
 * roofs drawn on it, your own for roofs drawn on yours — never one for the other.
 */
export function pictureUpdatedOver(
  drawnOn: PictureStamp | null,
  skyTakenOn: string | null,
  ownTakenOn: string | null,
): boolean {
  const own = drawnOn?.source === 'own';
  return pictureNewerThanDrawn(drawnOn, own ? ownTakenOn : skyTakenOn);
}
