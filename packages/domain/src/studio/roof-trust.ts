import { type ProvenanceTier, weakestTier } from '../format/qualified';
import type { PictureChoice, Roof, RoofEdgeTrust, StudioDocument } from './document';

/**
 * How far each roof figure can be trusted (`F8-01`, `F8-02`): a length traced on a picture is
 * derived, one traced on the bare grid or typed by a person is estimated, one measured on site is
 * measured. Trust shows on the model by the line itself (`ROOF_EDGE_TRUSTS`) and on the area's pill.
 */

const SET_TIER: Record<Exclude<RoofEdgeTrust, 'traced'>, ProvenanceTier> = {
  typed: 'estimated',
  measured: 'measured',
};

/**
 * The tier of the length that sized the picture: `null` while the picture keeps its own scale. The
 * design keeps no record of which length came first, so the honest tier is the weakest of the
 * lengths a person set (`F8-04`); a scaled picture whose set length was split away is estimated.
 */
export function scaleTierOf(document: StudioDocument): ProvenanceTier | null {
  const set = document.roofs.flatMap((roof) =>
    roof.edges.flatMap((trust) => (trust === 'traced' ? [] : [SET_TIER[trust]])),
  );
  if (set.length > 0) return weakestTier(set);
  return document.pictureScale === 1 ? null : 'estimated';
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
