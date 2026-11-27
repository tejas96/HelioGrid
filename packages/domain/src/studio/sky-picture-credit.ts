import type { SkyPictureSource } from './document';
import type { GroundBox } from './ground';

/**
 * The credit a provider burns into its picture (`T-M05-002`): Google's Static Maps picture carries
 * Google's logo and its imagery line along its foot. Laid on the 3D ground, tilted and enlarged,
 * they read as a sign on the site, so the studio lays the picture without that strip; the credit
 * stays in the page's own words beside the map.
 */

/**
 * The share of a Static Maps picture's height the credit takes at its foot: 24 px of 640 at
 * `scale=1` (48 of 1,280 at the studio's `scale=2`), the same share at every scale.
 */
const STATIC_MAPS_CREDIT_SHARE = 24 / 640;

/** The share of the picture's height, at its foot, that carries the provider's credit; `0` for none. */
export function creditStripOf(source: SkyPictureSource | string): number {
  return source === 'google' ? STATIC_MAPS_CREDIT_SHARE : 0;
}

/** The ground a piece covers once its foot's `strip` share is cut away: its south moves north. */
export function boxWithoutStrip<B extends GroundBox>(box: B, strip: number): B {
  if (strip <= 0) return box;
  return { ...box, south: box.south + (box.north - box.south) * strip };
}
