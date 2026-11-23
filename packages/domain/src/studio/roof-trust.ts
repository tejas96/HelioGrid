import { type ProvenanceTier, weakestTier } from '../format/qualified';
import type { PictureChoice, Roof, RoofEdgeTrust, StudioDocument } from './document';
import { onPicture } from './roof-length';

/**
 * How far each roof figure can be trusted (`F8-01`, `F8-02`): a length traced on a picture is
 * derived, one traced on the bare grid or typed by a person is estimated, one measured on site is
 * measured, and one read from a CAD plan is derived. Trust shows on the model by the line itself (`ROOF_EDGE_TRUSTS`) and on the area's pill.
 */

const SET_TIER: Record<Exclude<RoofEdgeTrust, 'traced'>, ProvenanceTier> = {
  typed: 'estimated',
  measured: 'measured',
  assumed: 'assumed',
  plan: 'derived',
};

/**
 * The tier of the length that sized a picture, for the roofs traced on it: `null` while the picture
 * keeps a scale of its own that holds. The design keeps no record of which length came first, so
 * the honest tier is the weakest of the lengths a person set on those roofs (`F8-04`); a picture
 * sized and then split from its set length is estimated. A picture of the company's own at our
 * guessed size is `assumed` until a length is set (`T-M05-002d`); a drone map's own scale holds.
 */
export function scaleTierOf(
  document: StudioDocument,
  tracedOn: PictureChoice = 'sky',
): ProvenanceTier | null {
  if (tracedOn === 'none') return null;
  // A typed or grid roof's lengths never sized the picture: only the roofs on this picture count,
  // and of those only a length someone set — a plan's came with the plan.
  const set = document.roofs
    .filter((roof) => onPicture(roof) && roof.tracedOn === tracedOn)
    .flatMap((roof) =>
      roof.edges.flatMap((trust) =>
        trust === 'traced' || trust === 'plan' ? [] : [SET_TIER[trust]],
      ),
    );
  if (set.length > 0) return weakestTier(set);
  if (tracedOn === 'sky') return document.pictureScale === 1 ? null : 'estimated';
  switch (document.ownPicture?.scaleFrom) {
    case 'file':
      return null;
    case 'guess':
      return 'assumed';
    default:
      return 'estimated';
  }
}

/**
 * One edge's tier. A traced length is derived from a picture, estimated on the bare grid, and never
 * stronger than the length that sized the picture.
 */
export function edgeTier(
  trust: RoofEdgeTrust,
  tracedOn: PictureChoice,
  scaleTier: ProvenanceTier | null,
): ProvenanceTier {
  if (trust !== 'traced') return SET_TIER[trust];
  const own: ProvenanceTier = tracedOn === 'none' ? 'estimated' : 'derived';
  return scaleTier === null ? own : (weakestTier([own, scaleTier]) ?? own);
}

/** A roof's area tier: the weakest of its edges' tiers. */
export function roofAreaTier(roof: Roof, scaleTier: ProvenanceTier | null): ProvenanceTier {
  const tiers = roof.edges.map((trust) => edgeTier(trust, roof.tracedOn, scaleTier));
  return weakestTier(tiers) ?? 'estimated';
}
