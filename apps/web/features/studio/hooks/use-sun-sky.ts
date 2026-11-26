import type { StudioScreen } from '@heliogrid/data/react';
import { useFormat } from '@heliogrid/ui';
import { useMemo } from 'react';
import type { StudioSiteShade } from '../components/StudioSiteShade';
import type { StudioSunSky } from '../components/StudioSunSky';

export type SunSkyShown = Omit<
  Parameters<typeof StudioSunSky>[0],
  'palette' | 'centre' | 'radiusM'
> & {
  readonly shade: Parameters<typeof StudioSiteShade>[0];
};

/** The path marks every second hour, every third on a phone, as the day line does. */
const HOURS_WIDE = 2;
const HOURS_PHONE = 3;

/**
 * The web's half of the sun's scene: the picked sun, the day's path and its hours with their
 * times formatted for the market (the scene draws no words of its own); `null` while the bar is
 * closed.
 */
export function useSunSky(studio: StudioScreen, phone: boolean): SunSkyShown | null {
  const format = useFormat();
  const { view } = studio.sunBar;
  // The casters are built again only when the roofs or the grids change, never as the sun moves.
  const roofs = studio.shown?.roofs;
  const levels = studio.scene.levels;
  const cuts = useMemo(
    () =>
      (roofs ?? []).map((roof, index) => ({
        outline: roof.corners,
        topM: levels[index]?.topM ?? 0,
      })),
    [roofs, levels],
  );
  const { layers, lineUp } = studio.site;
  const grids = useMemo(
    () => layers.filter((layer) => layer.skip === null).map((layer) => layer.grid),
    [layers],
  );
  if (view === null) return null;
  const every = phone ? HOURS_PHONE : HOURS_WIDE;
  return {
    shade: { grids, cuts, lineUp },
    sun: view.sun,
    path: view.path,
    hours: view.hours
      .filter((hour) => hour.at.hour % every === 0)
      .map((hour) => ({ sun: hour, label: format.time(hour.at.hhmm) })),
  };
}
