import type { Coordinate } from '@heliogrid/domain';

/** A site's pin as the lead's two columns hold it: both halves, or no pin (`lead_site_pin_whole`). */
export function sitePinOf(latitude: number | null, longitude: number | null): Coordinate | null {
  return latitude === null || longitude === null ? null : { latitude, longitude };
}
