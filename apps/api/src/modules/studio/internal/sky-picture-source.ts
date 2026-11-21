import type {
  Coordinate,
  SkyPictureSource as SkyPictureSourceName,
  SkyTileKey,
} from '@heliogrid/domain';

/** One piece of a sky picture: its bytes and the ground it covers, in metres from the pin. */
export interface SourcePiece {
  readonly bytes: Buffer;
  readonly mediaType: 'image/jpeg' | 'image/png';
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/** A sky picture as its provider gives it, whole: what a studio built before the tiles reads. */
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

/** What a provider says of its picture of a place, before any tile is asked for. */
export interface SourceFacts {
  readonly source: SkyPictureSourceName;
  readonly credit: string;
  /** `YYYY-MM-DD`, or `null` when the provider does not say. */
  readonly takenOn: string | null;
  /** The finest zoom the provider cuts tiles of this place at. */
  readonly zoomMax: number;
}

/** One tile as its provider gives it, and how long the provider lets a browser keep it. */
export interface SourceTile {
  readonly bytes: Buffer;
  readonly cacheControl: string | null;
  readonly etag: string | null;
}

/** The market a picture is asked for in: the provider draws its borders and words by it. */
export interface SourceMarket {
  /** The market's country, as ISO 3166-1 alpha-2. */
  readonly region: string;
  /** The market's language tag: `en-IN`. */
  readonly language: string;
}

/**
 * Where a site's sky picture comes from. `setUp` is false where no provider is configured. Every
 * ask REJECTS when the provider does not answer, and answers `null` when it holds nothing of the
 * place. Nothing it gives is ever stored: a picture is fetched for the one who asked.
 */
export interface SkyPictureSource {
  readonly setUp: boolean;
  /** The whole picture round a pin, for a studio built before the tiles. */
  pictureAt(pin: Coordinate, market: SourceMarket): Promise<SourcePicture | null>;
  factsAt(pin: Coordinate, market: SourceMarket): Promise<SourceFacts | null>;
  /** One tile, as a JPEG at twice the provider's own density (domain's `SKY_TILE_PIXELS`). */
  tile(key: SkyTileKey, market: SourceMarket): Promise<SourceTile | null>;
}

export const SKY_PICTURE_SOURCE = Symbol('SKY_PICTURE_SOURCE');
