import type { PlaceSource } from './place-source';

/** No map service is configured: every ask is refused, which the service answers as "not available". */
export class AbsentPlaceSource implements PlaceSource {
  private refuse(): never {
    throw new Error('no place source is configured');
  }

  async suggest(): Promise<never> {
    return this.refuse();
  }

  async place(): Promise<never> {
    return this.refuse();
  }

  async at(): Promise<never> {
    return this.refuse();
  }
}
