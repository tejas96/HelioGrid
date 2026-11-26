import { ROOF_DATA_PORT } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { ENV } from '../../config/env';
import { FileModule } from '../file/file.public';
import { SettingsModule } from '../settings/settings.public';
import {
  AbsentBuildingOutlines,
  OverpassBuildingOutlines,
} from './internal/building-outline.overpass';
import { PvgisFarHorizon } from './internal/far-horizon.pvgis';
import { PLACE_SOURCE } from './internal/place-source';
import { AbsentPlaceSource } from './internal/place-source.absent';
import { GooglePlaceSource } from './internal/place-source.google';
import { MemoryPlaceSource } from './internal/place-source.memory';
import { AbsentRoofData } from './internal/roof-data.absent';
import { GoogleRoofData } from './internal/roof-data.google';
import { MemoryRoofData } from './internal/roof-data.memory';
import { BUILDING_OUTLINE_SOURCE, FAR_HORIZON_SOURCE } from './internal/site-surrounds';
import { MemoryBuildingOutlines, MemoryFarHorizon } from './internal/site-surrounds.memory';
import { SKY_PICTURE_SOURCE } from './internal/sky-picture-source';
import { AbsentSkyPictureSource } from './internal/sky-picture-source.absent';
import { GoogleSkyPictureSource } from './internal/sky-picture-source.google';
import { MemorySkyPictureSource } from './internal/sky-picture-source.memory';
import { PlacesController, StudioController } from './studio.controller';
import { StudioDocumentRepository } from './studio.document.repository';
import { StudioDocumentService } from './studio.document.service';
import { StudioPictureActivityRegistration } from './studio.picture.activities';
import { StudioPictureRepository } from './studio.picture.repository';
import { StudioPictureService } from './studio.picture.service';
import { StudioPictureReadRepository } from './studio.picture-read.repository';
import { StudioPlacesService } from './studio.places.service';
import { StudioRepository } from './studio.repository';
import { StudioService } from './studio.service';
import { StudioSiteDataRepository } from './studio.site-data.repository';
import { StudioSiteDataService } from './studio.site-data.service';
import { StudioSiteSources } from './studio.site-sources.service';
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
 * Where the studio's sky picture comes from. Under TEST the memory source stands in — a suite must
 * never reach a third party. Elsewhere, development included, it is Google's Static Maps on the
 * server key, and absent where there is no key: the studio then says so and opens on its grid.
 */
const skyPictureSourceProvider: Provider = {
  provide: SKY_PICTURE_SOURCE,
  useFactory: () => {
    if (ENV.NODE_ENV === 'test') return new MemorySkyPictureSource();
    const key = ENV.GOOGLE_MAPS_API_KEY;
    return key === undefined
      ? new AbsentSkyPictureSource()
      : new GoogleSkyPictureSource(key, ENV.GOOGLE_MAPS_SIGNING_SECRET);
  },
};

/**
 * Where a site's heights and roof faces come from (`T-M05-002`, part g). Under TEST the memory
 * source stands in. Elsewhere it is Google's Solar API on the server key, and absent where there
 * is no key: the studio then says so and asks how many floors.
 */
const roofDataProvider: Provider = {
  provide: ROOF_DATA_PORT,
  useFactory: () => {
    if (ENV.NODE_ENV === 'test') return new MemoryRoofData();
    const key = ENV.GOOGLE_MAPS_API_KEY;
    return key === undefined ? new AbsentRoofData() : new GoogleRoofData(key);
  },
};

/** The far hills round a site: PVGIS, free and keyless; the memory one under TEST. */
const farHorizonProvider: Provider = {
  provide: FAR_HORIZON_SOURCE,
  useFactory: () => (ENV.NODE_ENV === 'test' ? new MemoryFarHorizon() : new PvgisFarHorizon()),
};

/** The public Overpass server: development's alone, as it is not for commercial use. */
const PUBLIC_OVERPASS = 'https://overpass-api.de/api/interpreter';

/**
 * OpenStreetMap's outlines where Google has no height map: the Overpass host `OVERPASS_URL` names;
 * unset, the public server in development and none in production.
 */
const buildingOutlineProvider: Provider = {
  provide: BUILDING_OUTLINE_SOURCE,
  useFactory: () => {
    if (ENV.NODE_ENV === 'test') return new MemoryBuildingOutlines();
    const address =
      ENV.OVERPASS_URL ?? (ENV.NODE_ENV === 'development' ? PUBLIC_OVERPASS : undefined);
    return address === undefined
      ? new AbsentBuildingOutlines()
      : new OverpassBuildingOutlines(address);
  },
};

/**
 * The design studio as HelioGrid hosts it (`T-M05-001`): a lead's designs, the site details that
 * start one, the pictures of its own (`T-M05-002d`), the site's height data (`T-M05-002g`), and the
 * place search. It reaches the lead only through the CRM module's public surface.
 */
@Module({
  imports: [SettingsModule, FileModule],
  controllers: [StudioController, PlacesController],
  providers: [
    buildingOutlineProvider,
    farHorizonProvider,
    placeSourceProvider,
    roofDataProvider,
    skyPictureSourceProvider,
    StudioDocumentRepository,
    StudioDocumentService,
    StudioPictureActivityRegistration,
    StudioPictureReadRepository,
    StudioPictureRepository,
    StudioPictureService,
    StudioPlacesService,
    StudioRepository,
    StudioService,
    StudioSiteDataRepository,
    StudioSiteDataService,
    StudioSiteSources,
    StudioWritesRepository,
  ],
})
export class StudioModule {}
