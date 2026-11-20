import type { Coordinate } from '@heliogrid/domain';
import type { SkyPictureSource, SourcePicture } from './sky-picture-source';

/** One grey pixel: a picture small enough to send in every test. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==',
  'base64',
);

/** A latitude no test site uses: a pin here is a place the provider does not cover. */
export const uncoveredLatitude = -89.5;

/**
 * The test suites' sky picture: a suite never reaches a third party. Every pin has a one-pixel
 * picture 100 m across, with a softer one 400 m across round it, except one at `uncoveredLatitude`.
 */
export class MemorySkyPictureSource implements SkyPictureSource {
  readonly setUp = true;

  async pictureAt(pin: Coordinate): Promise<SourcePicture | null> {
    if (pin.latitude === uncoveredLatitude) return null;
    return {
      source: 'google',
      credit: 'Test imagery',
      metresPerPixel: 100,
      takenOn: '2025-10-17',
      pieces: [
        { bytes: PIXEL, mediaType: 'image/png', west: -50, south: -50, east: 50, north: 50 },
      ],
      around: [
        { bytes: PIXEL, mediaType: 'image/png', west: -200, south: -200, east: 200, north: 200 },
      ],
    };
  }
}
