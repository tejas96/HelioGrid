import type { StudioScreen } from '@heliogrid/data/react';
import type { ThemePalette } from '@heliogrid/theme';
import { useMemo, useRef } from 'react';
import type { LidarScanShown } from '../components/StudioLidarScan';
import type { SunlightPatch } from '../components/StudioSunlight';

const SUN_KEY = ['scene-sun-1', 'scene-sun-2', 'scene-sun-3', 'scene-sun-4'] as const;

/**
 * The canvas's part in LiDAR (`T-M05-002g`): the scan as the scene shows it — `null` until its mesh
 * is built, or while LiDAR is off — the roofs' sunlight while Sunlight shows, and the view's turn
 * as the scene last told it, which Move's arrows read so they move the way they point on the screen.
 */
export function useCanvasLidar(studio: StudioScreen, palette: ThemePalette) {
  const { lidar, site } = studio;
  const { view, mesh } = lidar;
  const roofs = studio.shown?.roofs;
  const levels = studio.scene.levels;
  const cut = useMemo(() => (roofs ?? []).map((roof) => roof.corners), [roofs]);
  const scan: LidarScanShown | null =
    !view.on || studio.view === 'top' || mesh === null
      ? null
      : {
          mesh,
          photo: lidar.photo?.[0] ?? null,
          look: view.look,
          sunlight: view.sunlight,
          seeThrough: view.seeThrough,
          lineUp: lidar.lineUp,
          cut,
          // Lining the map up brings the whole scan back, to set against the roofs.
          cutOn: view.move?.tab !== 'map',
          key: site.key ?? { lowM: 0, highM: 1 },
        };
  const colours = useMemo(() => SUN_KEY.map((name) => palette[name]), [palette]);
  const { sunlight } = site;
  const patches = useMemo(
    (): SunlightPatch[] =>
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
  const turn = useRef(0);
  return {
    /** What the scene draws of LiDAR, but for its pins. */
    layer: {
      on: view.on && studio.view !== 'top',
      picked: lidar.picked.flatMap((index) => {
        const corners = roofs?.[index]?.corners;
        const topM = levels[index]?.topM;
        return corners === undefined || topM === undefined ? [] : [{ corners, topM }];
      }),
      scan,
      sunlight:
        view.on && view.sunlight && sunlight !== null ? { patches, colours, opacity: 1 } : null,
    },
    turnOf: () => turn.current,
    /** Hands each turn on to `then` once it is noted. */
    told: (then: (turn: number) => void) => (now: number) => {
      turn.current = now;
      then(now);
    },
  };
}
