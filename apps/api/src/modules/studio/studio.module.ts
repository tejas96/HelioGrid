import { Module, type Provider } from '@nestjs/common';
import { ENV } from '../../config/env';
import { SettingsModule } from '../settings/settings.public';
import { PLACE_SOURCE } from './internal/place-source';
import { AbsentPlaceSource } from './internal/place-source.absent';
import { GooglePlaceSource } from './internal/place-source.google';
import { MemoryPlaceSource } from './internal/place-source.memory';
import { PlacesController, StudioController } from './studio.controller';
import { StudioPlacesService } from './studio.places.service';
import { StudioRepository } from './studio.repository';
import { StudioService } from './studio.service';
import { StudioWritesRepository } from './studio.writes.repository';

/**
 * The map service a site's place is found with. Under TEST the memory source stands in — a suite
 * must never reach a third party. Elsewhere it is Google where the server key is set, and absent
 * where it is not: the search then answers that it is not available.
 */
const placeSourceProvider: Provider = {
  provide: PLACE_SOURCE,
  useFactory: () => {
    if (ENV.NODE_ENV === 'test') return new MemoryPlaceSource();
    const key = ENV.GOOGLE_MAPS_API_KEY;
    return key === undefined ? new AbsentPlaceSource() : new GooglePlaceSource(key);
  },
};

/**
 * The design studio as HelioGrid hosts it (`T-M05-001`): a lead's designs, the site details that
 * start one, and the place search. It reaches the lead only through the CRM module's public surface.
 */
@Module({
  imports: [SettingsModule],
  controllers: [StudioController, PlacesController],
  providers: [
    placeSourceProvider,
    StudioPlacesService,
    StudioRepository,
    StudioService,
    StudioWritesRepository,
  ],
})
export class StudioModule {}
