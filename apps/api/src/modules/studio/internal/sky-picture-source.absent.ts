import type { SkyPictureSource, SourcePicture } from './sky-picture-source';

/** Where no provider is set up: the studio says so and opens on its grid. */
export class AbsentSkyPictureSource implements SkyPictureSource {
  readonly setUp = false;

  async pictureAt(): Promise<SourcePicture | null> {
    return null;
  }
}
