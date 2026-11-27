import type { StudioScreen } from '@heliogrid/data/react';
import type { RefObject } from 'react';

/**
 * Which part holds the foot, where the camera's room ends: LiDAR's Move, else the material picker,
 * else Roofs, else a roof's sheet, else the sun bar, else LiDAR's foot or the bar. The room is
 * measured again when one takes another's place.
 */
export function footHolderOf(
  studio: StudioScreen,
): 'move' | 'picker' | 'roofs' | 'sheet' | 'sun' | 'lidar' | 'bar' {
  const lidar = studio.lidar.view.on && studio.view !== 'top';
  // Move works on the scan: while it is not in (failed, offline, coming) LiDAR's own foot says why
  // and offers Try again, or a Move left open would hold the foot and draw nothing.
  if (lidar && studio.lidar.view.move !== null && studio.lidar.scan === 'in') return 'move';
  if (studio.materialPicker !== null) return 'picker';
  if (studio.panel.open === 'roofs') return 'roofs';
  if (studio.roofSheet !== null) return 'sheet';
  // The sun bar holds the foot as a panel does; a sheet opened over it takes the place.
  if (studio.sunBar.view !== null) return 'sun';
  return lidar ? 'lidar' : 'bar';
}

/**
 * A roof's sheet with its roof to frame asks the camera to fly to it. Roofs and the picker only
 * move the view's middle up by their measured room: the person's own view is kept.
 */
export function panelFrames(
  holder: ReturnType<typeof footHolderOf>,
  studio: StudioScreen,
): boolean {
  return holder === 'sheet' && studio.sheetFrame !== null;
}

/** The foot's measure handed to the part that holds it, and `null` to the others. */
export function footRefsOf(
  holder: ReturnType<typeof footHolderOf>,
  foot: RefObject<HTMLDivElement | null>,
) {
  const of = (part: typeof holder) => (holder === part ? foot : null);
  return {
    sheet: of('sheet'),
    roofs: of('roofs'),
    sun: of('sun'),
    bar: of('bar'),
    move: of('move'),
    lidar: of('lidar'),
  };
}
