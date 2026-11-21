import type {
  SkyPictureSource,
  SourceFacts,
  SourcePicture,
  SourceTile,
} from './sky-picture-source';

/** Where no provider is set up: the studio says so and opens on its grid. */
export class AbsentSkyPictureSource implements SkyPictureSource {
  readonly setUp = false;

  async pictureAt(): Promise<SourcePicture | null> {
    return null;
  }

  async factsAt(): Promise<SourceFacts | null> {
    return null;
  }

  async tile(): Promise<SourceTile | null> {
    return null;
  }
}
