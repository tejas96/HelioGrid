import type { Coordinate } from '../format/areas';
import { GROUND_REACH_M, type StudioDocument } from './document';
import { type GroundPoint, groundOf } from './ground';

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
  const roofs = document.roofs.map((roof) => ({
    ...roof,
    corners: roof.corners.map((c) => ({ east: c.east - east, north: c.north - north })),
  }));
  const outside = roofs.some((roof) =>
    roof.corners.some(
      (c) => Math.abs(c.east) > GROUND_REACH_M || Math.abs(c.north) > GROUND_REACH_M,
    ),
  );
  return outside ? null : { ...document, roofs };
}

/** Another site: the roofs go, and so does what they set on the picture; a picked picture stays. */
const drawingCleared = (document: StudioDocument): StudioDocument => ({
  ...document,
  roofs: [],
  drawnOn: null,
  pictureScale: 1,
});

/**
 * The drawings of every design of a site, after its pin moved from `before` to `after`. A first pin
 * or the same pin changes nothing. A fix keeps each roof on its house. A move to another site
 * clears the roofs — only once the person agreed (`removeRoofs`); until then it is `refused`.
 */
export function drawingsAfterPinMove(
  documents: readonly StudioDocument[],
  before: Coordinate | null,
  after: Coordinate,
  removeRoofs: boolean,
): DrawingsAfterPinMove {
  const drawnOn = (document: StudioDocument) => document.roofs.length > 0;
  if (before === null || samePin(before, after) || !documents.some(drawnOn)) {
    return { kind: 'done', documents: documents.map(() => null) };
  }
  const shift = groundOf(before, after);
  if (Math.hypot(shift.east, shift.north) <= PIN_FIX_REACH_M) {
    const moved = documents.map((d) => (drawnOn(d) ? drawingMovedBy(d, shift) : null));
    const lost = documents.some((d, i) => drawnOn(d) && moved[i] === null);
    if (!lost) return { kind: 'done', documents: moved };
  }
  if (!removeRoofs) return { kind: 'refused' };
  return { kind: 'done', documents: documents.map((d) => (drawnOn(d) ? drawingCleared(d) : null)) };
}
