import type { BuildingAnswer, HeightMapAnswer, RoofDataPort } from '@heliogrid/contracts';

/** Where no height service is set up: the studio says so and the roofs stand at their floors. */
export class AbsentRoofData implements RoofDataPort {
  readonly setUp = false;

  async buildingAt(): Promise<BuildingAnswer | null> {
    return null;
  }

  async heightMapAt(): Promise<HeightMapAnswer | null> {
    return null;
  }
}
