import type { Place, PlaceAnswer, PlaceSuggestions } from '@heliogrid/contracts';
import { areaOfPlace, type Coordinate, type MarketPack, roundPin } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SettingsService } from '../settings/settings.public';
import { PLACE_SOURCE, type PlaceSource, type SourcePlace } from './internal/place-source';

/** A place as the company's market reads it: its area by the pack's code, and whether it is in the market. */
function placeOf(found: SourcePlace, pack: MarketPack): Place {
  const { areas, utilities } = pack.formats;
  return {
    address: found.address,
    pin: roundPin(found.point),
    area: areaOfPlace(areas, utilities, found.region),
    inMarket: found.countryCode === null ? null : found.countryCode === pack.market,
  };
}

/**
 * Finding a site's place. The map service is a third party that may be down or not configured: a
 * failed ask is answered as "not available" — a state the form draws, with typed coordinates still
 * setting the place — and logged, never thrown at a person filling a form.
 */
@Injectable()
export class StudioPlacesService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(PLACE_SOURCE) private readonly source: PlaceSource,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StudioPlacesService.name);
  }

  /** The answer of one ask, or `undefined` when the service did not give one. */
  private async asked<Answer>(
    what: string,
    ask: () => Promise<Answer>,
  ): Promise<Answer | undefined> {
    try {
      return await ask();
    } catch (error) {
      // The message alone: a request to the service can carry its key, which is never logged.
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn({ what, reason }, 'the place source did not answer');
      return undefined;
    }
  }

  async suggest(tenantId: string, query: string, session: string): Promise<PlaceSuggestions> {
    const pack = await this.settings.packOf(tenantId);
    const found = await this.asked('suggest', () =>
      this.source.suggest(query, session, pack.market),
    );
    return found === undefined
      ? { available: false, suggestions: [] }
      : { available: true, suggestions: [...found] };
  }

  async details(tenantId: string, placeId: string, session: string): Promise<PlaceAnswer> {
    const pack = await this.settings.packOf(tenantId);
    const found = await this.asked('details', () => this.source.place(placeId, session));
    return this.answerOf(found, pack);
  }

  async at(tenantId: string, point: Coordinate): Promise<PlaceAnswer> {
    const pack = await this.settings.packOf(tenantId);
    const found = await this.asked('at', () => this.source.at(point));
    return this.answerOf(found, pack);
  }

  private answerOf(found: SourcePlace | null | undefined, pack: MarketPack): PlaceAnswer {
    if (found === undefined) return { available: false, place: null };
    return { available: true, place: found === null ? null : placeOf(found, pack) };
  }
}
