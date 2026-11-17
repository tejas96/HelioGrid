import type { Coordinate, MarketCode } from '@heliogrid/domain';
import type { PlaceSource, SourcePlace, SourceSuggestion } from './place-source';

const PLACES = 'https://places.googleapis.com/v1';
const GEOCODE = 'https://maps.googleapis.com/maps/api/geocode/json';
/** A search a person is typing into is answered fast or not at all: the form never waits on it. */
const ANSWER_WITHIN_MS = 4000;
const SUGGESTIONS_SHOWN = 5;
const REGION = 'administrative_area_level_1';
const COUNTRY = 'country';

interface Component {
  readonly long: string | null;
  readonly short: string | null;
  readonly types: readonly string[];
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;
const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

/** The region and the country out of a place's address components, whichever API named them. */
function placeOf(
  address: string | null,
  point: Coordinate,
  components: readonly Component[],
): SourcePlace {
  const region = components.find((part) => part.types.includes(REGION));
  const country = components.find((part) => part.types.includes(COUNTRY));
  return {
    address,
    point,
    region: { code: region?.short ?? null, name: region?.long ?? null },
    countryCode: country?.short ?? null,
  };
}

/**
 * Google Maps Platform as the place source: Places API (New) for suggestions and a suggested
 * place, the Geocoding API for the address at a point. Nothing it answers is stored beyond the
 * site's own address and pin, which the person confirms.
 */
export class GooglePlaceSource implements PlaceSource {
  constructor(private readonly key: string) {}

  private async ask(url: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
    // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is an outbound call to the map service and no typed client exists for it
    const answer = await fetch(url, {
      ...init,
      headers: { 'X-Goog-Api-Key': this.key, ...init.headers },
      signal: AbortSignal.timeout(ANSWER_WITHIN_MS),
    });
    if (!answer.ok) throw new Error(`the place source answered ${answer.status}`);
    return record(await answer.json());
  }

  async suggest(
    query: string,
    session: string,
    market: MarketCode,
  ): Promise<readonly SourceSuggestion[]> {
    const body = await this.ask(`${PLACES}/places:autocomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: query,
        sessionToken: session,
        includedRegionCodes: [market.toLowerCase()],
      }),
    });
    return list(body.suggestions)
      .flatMap((suggestion): SourceSuggestion[] => {
        const prediction = record(record(suggestion).placePrediction);
        const format = record(prediction.structuredFormat);
        const placeId = text(prediction.placeId);
        const title = text(record(format.mainText).text) ?? text(record(prediction.text).text);
        if (placeId === null || title === null) return [];
        return [{ placeId, title, line: text(record(format.secondaryText).text) ?? '' }];
      })
      .slice(0, SUGGESTIONS_SHOWN);
  }

  async place(placeId: string, session: string): Promise<SourcePlace | null> {
    const url = `${PLACES}/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(session)}`;
    const body = await this.ask(url, {
      headers: { 'X-Goog-FieldMask': 'formattedAddress,location,addressComponents' },
    });
    const location = record(body.location);
    const { latitude, longitude } = location;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    const components = list(body.addressComponents).map((part): Component => {
      const { longText, shortText, types } = record(part);
      return { long: text(longText), short: text(shortText), types: list(types).map(String) };
    });
    return placeOf(text(body.formattedAddress), { latitude, longitude }, components);
  }

  async at(point: Coordinate): Promise<SourcePlace | null> {
    // This older API reads its key from the query alone; the URL is never logged or thrown.
    const query = new URLSearchParams({
      latlng: `${point.latitude},${point.longitude}`,
      key: this.key,
    });
    const body = await this.ask(`${GEOCODE}?${query.toString()}`);
    if (body.status !== 'OK' && body.status !== 'ZERO_RESULTS') {
      throw new Error(`the place source answered ${String(body.status)}`);
    }
    const [first] = list(body.results);
    if (first === undefined) return null;
    const result = record(first);
    const components = list(result.address_components).map((part): Component => {
      const { long_name, short_name, types } = record(part);
      return { long: text(long_name), short: text(short_name), types: list(types).map(String) };
    });
    return placeOf(text(result.formatted_address), point, components);
  }
}
