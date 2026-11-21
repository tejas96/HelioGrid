import type { Coordinate } from '@heliogrid/domain';
import type {
  SkyPictureSource,
  SourceFacts,
  SourcePicture,
  SourceTile,
} from './sky-picture-source';

/** One grey pixel: a picture small enough to send in every test. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==',
  'base64',
);
/** The same pixel as a tile travels: a JPEG. */
const TILE = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwAooooA/9k=',
  'base64',
);

/** How many bytes the test provider's tile is: a reader checks the tile came whole, as bytes. */
export const memoryTileBytes = TILE.length;
/** A latitude no test site uses: a pin here is a place the provider does not cover. */
export const uncoveredLatitude = -89.5;
/** The finest zoom the test provider cuts its tiles at: past India's own cap, so the cap shows. */
export const memoryZoomMax = 21;
/** What the test provider lets a browser do with a tile. */
export const memoryCacheControl = 'private, max-age=86400';

/**
 * The test suites' sky picture: a suite never reaches a third party. Every pin has a one-pixel
 * picture 100 m across, with a softer one 400 m across round it, and every tile is one pixel —
 * except at `uncoveredLatitude`, where the provider holds nothing.
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

  async factsAt(pin: Coordinate): Promise<SourceFacts | null> {
    if (pin.latitude === uncoveredLatitude) return null;
    return {
      source: 'google',
      credit: 'Test imagery',
      takenOn: '2025-10-17',
      zoomMax: memoryZoomMax,
    };
  }

  async tile(): Promise<SourceTile | null> {
    return { bytes: TILE, cacheControl: memoryCacheControl, etag: '"test-tile"' };
  }
}
