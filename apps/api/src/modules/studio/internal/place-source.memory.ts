import type { Coordinate } from '@heliogrid/domain';
import type { PlaceSource, SourcePlace, SourceSuggestion } from './place-source';

interface KnownPlace extends SourcePlace {
  readonly placeId: string;
  readonly title: string;
  readonly line: string;
}

/** Two points are one place within about a kilometre: enough to say where a typed point is. */
const NEAR_DEGREES = 0.01;

/**
 * The map service under test and on a machine with no key: it knows the few places it was built
 * with, answers nothing else, and can be told to be down — so a suite never reaches a third party
 * and the screen's "search is not available" path has its proof.
 */
export class MemoryPlaceSource implements PlaceSource {
  private down = false;
  private readonly known: readonly KnownPlace[] = [
    {
      placeId: 'memory-sangli',
      title: 'Swapnanagri, Vishrambag',
      line: 'Sangli, Maharashtra 416415',
      address: 'Swapnanagri, Vishrambag, Sangli, Maharashtra 416415',
      point: { latitude: 16.8367, longitude: 74.5966 },
      region: { code: 'MH', name: 'Maharashtra' },
      countryCode: 'IN',
    },
    {
      placeId: 'memory-panaji',
      title: 'Altinho, Panaji',
      line: 'Goa 403001',
      address: 'Altinho, Panaji, Goa 403001',
      point: { latitude: 15.4909, longitude: 73.8278 },
      region: { code: 'GA', name: 'Goa' },
      countryCode: 'IN',
    },
    {
      placeId: 'memory-munich',
      title: 'Marienplatz',
      line: 'Munich, Bavaria 80331',
      address: 'Marienplatz, Munich, Bavaria 80331',
      point: { latitude: 48.1374, longitude: 11.5755 },
      region: { code: 'BY', name: 'Bavaria' },
      countryCode: 'DE',
    },
  ];

  /** The service stops answering, or answers again. */
  goDown(down: boolean): void {
    this.down = down;
  }

  private answering(): void {
    if (this.down) throw new Error('the place source did not answer');
  }

  async suggest(query: string): Promise<readonly SourceSuggestion[]> {
    this.answering();
    const words = query.trim().toLowerCase();
    return this.known
      .filter((place) => `${place.title} ${place.line}`.toLowerCase().includes(words))
      .map(({ placeId, title, line }) => ({ placeId, title, line }));
  }

  async place(placeId: string): Promise<SourcePlace | null> {
    this.answering();
    return this.known.find((place) => place.placeId === placeId) ?? null;
  }

  async at(point: Coordinate): Promise<SourcePlace | null> {
    this.answering();
    const near = this.known.find(
      (place) =>
        Math.abs(place.point.latitude - point.latitude) < NEAR_DEGREES &&
        Math.abs(place.point.longitude - point.longitude) < NEAR_DEGREES,
    );
    return near === undefined ? null : { ...near, point };
  }
}
