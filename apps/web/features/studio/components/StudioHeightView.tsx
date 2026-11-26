'use client';
import { StudioHeightSurface } from './StudioHeightSurface';
import { StudioSunlight } from './StudioSunlight';

/** What the height view draws: the map's surfaces, and sunlight on the roofs. */
export interface HeightViewShown {
  readonly surfaces: readonly Omit<Parameters<typeof StudioHeightSurface>[0], 'flat'>[] | null;
  readonly sunlight: Parameters<typeof StudioSunlight>[0] | null;
}

/** The height view as it shows: the map's surfaces with heights, or sunlight on the roofs. */
export function StudioHeightView({
  surfaces,
  sunlight,
  flat,
}: HeightViewShown & { flat: boolean }) {
  return (
    <>
      {surfaces?.map((layer, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the layers keep their order while the view is on
        <StudioHeightSurface key={index} {...layer} flat={flat} />
      ))}
      {sunlight === null ? null : <StudioSunlight {...sunlight} />}
    </>
  );
}
