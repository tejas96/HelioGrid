import type { Coordinate, SkyPictureSource as SkyPictureSourceName } from '@heliogrid/domain';

/** One piece of a sky picture: its bytes and the ground it covers, in metres from the pin. */
export interface SourcePiece {
  readonly bytes: Buffer;
  readonly mediaType: 'image/jpeg' | 'image/png';
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/** A sky picture as its provider gives it. */
export interface SourcePicture {
  readonly source: SkyPictureSourceName;
  readonly credit: string;
  readonly metresPerPixel: number;
  /** `YYYY-MM-DD`, or `null` when the provider does not say. */
  readonly takenOn: string | null;
  readonly pieces: readonly SourcePiece[];
  /**
   * A softer picture round the sharp one, at a coarser zoom: the street and the neighbours, to find
   * the building and to move round it. Empty where the provider gives none.
   */
  readonly around: readonly SourcePiece[];
}

/**
 * Where a site's sky picture comes from. `setUp` is false where no provider is configured;
 * `pictureAt` REJECTS when the provider does not answer, and answers `null` when it holds no
 * picture of the place. Nothing it gives is ever stored: a picture is fetched for one opening.
 */
export interface SkyPictureSource {
  readonly setUp: boolean;
  pictureAt(pin: Coordinate): Promise<SourcePicture | null>;
}

export const SKY_PICTURE_SOURCE = Symbol('SKY_PICTURE_SOURCE');
