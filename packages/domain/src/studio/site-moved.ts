import type { Coordinate } from '../format/areas';
import { EMPTY_STUDIO_DOCUMENT, GROUND_REACH_M, type StudioDocument } from './document';
import { type GroundPoint, groundOf } from './ground';
import { roofPlaced } from './roof-move';

/**
 * How far the pin may move and still be the same site, in metres: a fix onto the right house. The
 * old spot then still lies on the sharp sky picture round the new pin (about 150 m across), so every
 * roof stays where it was drawn. Further, the pin names another site: its roofs would lie off the
 * map, where the camera never goes.
 */
export const PIN_FIX_REACH_M = 75;

/**
 * What the site's drawings become when its pin moves: each design's document, or `null` where it
 * is not written; `refused` when roofs would be left behind and the person was not asked yet.
 */
export type DrawingsAfterPinMove =
  | { readonly kind: 'refused' }
  | { readonly kind: 'done'; readonly documents: readonly (StudioDocument | null)[] };

const samePin = (left: Coordinate, right: Coordinate) =>
  left.latitude === right.latitude && left.longitude === right.longitude;

/**
 * A roof is stored in metres from the pin, on a picture stretched about the pin by `pictureScale`
 * (`roof-length.ts`), so a fixed pin carries every roof back by its shift, stretched the same:
 * each roof stays on the house it was drawn on. `null` when a corner would leave the site's reach.
 */
function drawingMovedBy(document: StudioDocument, shift: GroundPoint): StudioDocument | null {
  const east = shift.east * document.pictureScale;
  const north = shift.north * document.pictureScale;
  const back = (c: GroundPoint) => ({ east: c.east - east, north: c.north - north });
  const roofs = document.roofs.map((roof) => roofPlaced(roof, back));
  const outside = roofs.some((roof) =>
    roof.corners.some(
      (c) => Math.abs(c.east) > GROUND_REACH_M || Math.abs(c.north) > GROUND_REACH_M,
    ),
  );
  if (outside) return null;
  // A laid photo and plan lie on the same stretched ground as the roofs: they go back with them.
  const { ownPicture, plan } = document;
  return {
    ...document,
    roofs,
    ...(ownPicture == null ? {} : { ownPicture: { ...ownPicture, at: back(ownPicture.at) } }),
    ...(plan == null ? {} : { plan: { ...plan, at: back(plan.at) } }),
  };
}

/**
 * Another site: nothing of the old place stays — its roofs and what they set on the picture, the
 * photo and plan laid on it, the stairs question passed over and the site's answers (the building
 * changed, the map's line-up, the floors), which would else turn the new site's heights off or lay
 * its scan off its roofs. A picked sky or bare picture and how flat roofs wear stay: they are the
 * person's choices, not facts of the place; their own photo was the old place's.
 */
const drawingCleared = (document: StudioDocument): StudioDocument => ({
  ...EMPTY_STUDIO_DOCUMENT,
  picture: document.picture === 'own' ? null : document.picture,
  ...(document.flatRoofs === undefined ? {} : { flatRoofs: document.flatRoofs }),
});

/** A design holds something of its place: a roof, a laid photo or plan, or the site's answers. */
const holdsPlace = (document: StudioDocument) =>
  document.roofs.length > 0 ||
  document.ownPicture != null ||
  document.plan != null ||
  document.site !== undefined ||
  document.stairsSkipped === true;

/**
 * The drawings of every design of a site, after its pin moved from `before` to `after`. A first pin
 * or the same pin changes nothing. A fix keeps each roof, laid photo and plan on its house. A move
 * to another site clears all of the old place — once the person agreed (`removeRoofs`) where roofs
 * would go; until then it is `refused`.
 */
export function drawingsAfterPinMove(
  documents: readonly StudioDocument[],
  before: Coordinate | null,
  after: Coordinate,
  removeRoofs: boolean,
): DrawingsAfterPinMove {
  const drawnOn = (document: StudioDocument) => document.roofs.length > 0;
  if (before === null || samePin(before, after) || !documents.some(holdsPlace)) {
    return { kind: 'done', documents: documents.map(() => null) };
  }
  const shift = groundOf(before, after);
  if (Math.hypot(shift.east, shift.north) <= PIN_FIX_REACH_M) {
    const moved = documents.map((d) => (holdsPlace(d) ? drawingMovedBy(d, shift) : null));
    const lost = documents.some((d, i) => drawnOn(d) && moved[i] === null);
    if (!lost) return { kind: 'done', documents: moved };
  }
  // Only roofs are asked about: the rest of the old place means nothing on another site.
  if (!removeRoofs && documents.some(drawnOn)) return { kind: 'refused' };
  return {
    kind: 'done',
    documents: documents.map((d) => (holdsPlace(d) ? drawingCleared(d) : null)),
  };
}
