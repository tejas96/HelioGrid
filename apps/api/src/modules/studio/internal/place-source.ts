import type { Coordinate, MarketCode, PlaceRegion } from '@heliogrid/domain';

/** One suggestion as the map service names it. */
export interface SourceSuggestion {
  readonly placeId: string;
  readonly title: string;
  readonly line: string;
}

/** A place as the map service describes it — its own region names, before the market reads them. */
export interface SourcePlace {
  readonly address: string | null;
  readonly point: Coordinate;
  readonly region: PlaceRegion;
  /** ISO 3166-1 alpha-2, or `null` when the service names no country. */
  readonly countryCode: string | null;
}

/**
 * The map service a site's place is found with. Every method REJECTS when the service does not
 * answer; `null` is its answer that no such place exists.
 */
export interface PlaceSource {
  suggest(query: string, session: string, market: MarketCode): Promise<readonly SourceSuggestion[]>;
  place(placeId: string, session: string): Promise<SourcePlace | null>;
  at(point: Coordinate): Promise<SourcePlace | null>;
}

export const PLACE_SOURCE = Symbol('PLACE_SOURCE');
