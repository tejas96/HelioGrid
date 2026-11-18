import type { Place } from '@heliogrid/contracts';

/** The two places the origin's map service knows. */
export const SANGLI: Place = {
  address: 'Swapnanagri, Vishrambag, Sangli 416415',
  pin: { latitude: 16.8367, longitude: 74.5966 },
  area: 'IN-MH',
  inMarket: true,
};
export const MUNICH: Place = {
  address: 'Marienplatz, Munich',
  pin: { latitude: 48.1374, longitude: 11.5755 },
  area: null,
  inMarket: false,
};
const PLACES: Readonly<Record<string, { title: string; line: string; place: Place }>> = {
  'place-sangli': { title: 'Swapnanagri, Vishrambag', line: 'Sangli, Maharashtra', place: SANGLI },
  'place-munich': { title: 'Marienplatz', line: 'Munich, Bavaria', place: MUNICH },
};

/** The place search: what the service knows, or a service that is down. */
export function placesAnswer(path: string, query: URLSearchParams, up: boolean): unknown {
  if (path === '/places/suggestions') {
    if (!up) return { available: false, suggestions: [] };
    const words = (query.get('query') ?? '').toLowerCase();
    const suggestions = Object.entries(PLACES)
      .filter(([, known]) => `${known.title} ${known.line}`.toLowerCase().includes(words))
      .map(([placeId, known]) => ({ placeId, title: known.title, line: known.line }));
    return { available: true, suggestions };
  }
  if (!up) return { available: false, place: null };
  if (path === '/places/details') {
    return { available: true, place: PLACES[query.get('placeId') ?? '']?.place ?? null };
  }
  const point = {
    latitude: Number(query.get('latitude')),
    longitude: Number(query.get('longitude')),
  };
  const near = Object.values(PLACES).find(
    (known) => Math.abs(known.place.pin.latitude - point.latitude) < 1,
  );
  return { available: true, place: near === undefined ? null : { ...near.place, pin: point } };
}
