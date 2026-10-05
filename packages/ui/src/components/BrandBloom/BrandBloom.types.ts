/**
 * Where the brand bloom sits. The four page placements are the ones every onboarding, tenant
 * configuration and auth artboard draws with `--glow-brand`; `size` is the art bloom behind a
 * mark (an empty state, the no-connection sun); nothing set fills the parent's box.
 */
export type BloomPlacement = 'top' | 'centre' | 'desktop' | 'desktop-wide';

export interface BrandBloomProps {
  /** A page placement — the artboards' own geometry. Omit for an art bloom sized by `size`. */
  placement?: BloomPlacement;
  /** Diameter of an art bloom centred in its parent; ignored when `placement` is set. */
  size?: number;
}

export interface BloomGeometry {
  readonly width: number;
  readonly height: number;
  /** Offset of the bloom's top edge from the parent's top; `null` centres the bloom vertically. */
  readonly top: number | null;
  /** Offset from the parent's left edge; `null` centres the bloom horizontally. */
  readonly left: number | null;
}

/**
 * The bloom geometry, one row per placement — art dimensions, not layout, so they are named
 * roles here and never transcribed into a screen (`SCR-M01-01` contract item 8). The phone
 * placements are the artboards' 520×420 and 520×520 boxes, measured from the screen's top edge:
 * a larger wash lay under the fields and washed out their edge. Every bloom is an ellipse.
 */
export const BLOOM_GEOMETRY: Record<BloomPlacement, BloomGeometry> = {
  top: { width: 520, height: 420, top: -140, left: null },
  centre: { width: 520, height: 520, top: null, left: null },
  desktop: { width: 900, height: 820, top: -180, left: 120 },
  'desktop-wide': { width: 1100, height: 820, top: -220, left: null },
};
