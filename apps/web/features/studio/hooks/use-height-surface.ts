import type { StudioScreen } from '@heliogrid/data/react';
import type { ThemePalette } from '@heliogrid/theme';
import { useMemo, useRef } from 'react';
import type { StudioHeightSurface } from '../components/StudioHeightSurface';
import type { HeightViewShown } from '../components/StudioHeightView';

type SurfaceProps = Omit<Parameters<typeof StudioHeightSurface>[0], 'flat'>;
/** Each grid's surface, drawn together: the metre grids first, the sharp ones over them. */
export type HeightSurfaces = readonly SurfaceProps[];

const HEIGHT_KEY = [
  'scene-height-1',
  'scene-height-2',
  'scene-height-3',
  'scene-height-4',
  'scene-height-5',
] as const;

/**
 * The web's half of the height view (`T-M05-002`, part g): the surface the studio hands over, in
 * the theme's colours and as see-through as the person set it; `null` while the view is off.
 */
export function useHeightSurface(
  studio: StudioScreen,
  palette: ThemePalette,
): HeightSurfaces | null {
  const colours = useMemo(() => HEIGHT_KEY.map((name) => palette[name]), [palette]);
  const { surface, view } = studio.site;
  if (surface === null) return null;
  return surface.layers.map((layer) => ({
    ...layer,
    colours,
    lowM: surface.key.lowM,
    highM: surface.key.highM,
    near: surface.near,
    lineUp: surface.lineUp,
    opacity: view.seeThrough,
  }));
}

const SUN_KEY = ['scene-sun-1', 'scene-sun-2', 'scene-sun-3', 'scene-sun-4'] as const;

/** Sunlight on each roof, at the top it stands at; `null` while the view does not show it. */
function useSunlightShown(studio: StudioScreen, palette: ThemePalette) {
  const colours = useMemo(() => SUN_KEY.map((name) => palette[name]), [palette]);
  const { sunlight, view } = studio.site;
  const roofs = studio.shown?.roofs;
  const levels = studio.scene.levels;
  const patches = useMemo(
    () =>
      sunlight === null
        ? []
        : (roofs ?? []).flatMap((roof, index) => {
            const read = sunlight[roof.id];
            return read === undefined
              ? []
              : [{ sunlight: read, topM: levels[index]?.topM ?? 0, corners: roof.corners }];
          }),
    [sunlight, roofs, levels],
  );
  return sunlight === null ? null : { patches, colours, opacity: view.seeThrough };
}

/**
 * The canvas's part in the height view: the surface, and the view's turn as the scene last told
 * it, which the line-up's arrows read so they move the map the way they point on the screen.
 */
export function useCanvasHeights(studio: StudioScreen, palette: ThemePalette) {
  const surface: HeightViewShown = {
    surfaces: useHeightSurface(studio, palette),
    sunlight: useSunlightShown(studio, palette),
  };
  const turn = useRef(0);
  return {
    surface,
    turnOf: () => turn.current,
    /** Hands each turn on to `then` once it is noted. */
    told: (then: (turn: number) => void) => (now: number) => {
      turn.current = now;
      then(now);
    },
  };
}
