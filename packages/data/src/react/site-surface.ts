import type { SiteDataWire } from '@heliogrid/contracts';
import {
  type Coordinate,
  type GroundPoint,
  type HeightGrid,
  roofMiddle,
  type SunChart,
  siteTimeZoneOf,
} from '@heliogrid/domain';
import { gridFromWire, sunChartOf } from '@heliogrid/domain/studio-kernel';
import type { GroundSpan, HeightLayer } from './site-layer';

const spanOf = (grid: HeightGrid): GroundSpan => ({
  west: grid.west,
  south: grid.south,
  east: grid.west + grid.cols * grid.stepM,
  north: grid.south + grid.rows * grid.stepM,
});

/** Every area's two grids, read back from the wire; a grid that does not read is left out. */
export function heightLayersOf(areas: SiteDataWire['areas']): readonly HeightLayer[] {
  return areas.flatMap((area) => {
    const sharp = gridFromWire(area.grid);
    const around = gridFromWire(area.surround);
    const layers: HeightLayer[] = [];
    if (around !== null) {
      const skip = sharp === null ? null : spanOf(sharp);
      layers.push({ grid: around, span: spanOf(around), fadeEdge: true, skip });
    }
    if (sharp !== null) {
      layers.push({ grid: sharp, span: spanOf(sharp), fadeEdge: around === null, skip: null });
    }
    return layers;
  });
}

/**
 * The sun chart for a roof (board G10): from its middle at its top, over the sharp grid that holds
 * it and the site's far horizon; `null` where no sharp grid reaches the roof.
 */
export function sunChartFor(
  layers: readonly HeightLayer[],
  data: SiteDataWire,
  corners: readonly GroundPoint[],
  topM: number,
  pin: Coordinate,
): SunChart | null {
  const middle = roofMiddle(corners);
  const holds = (span: GroundSpan) =>
    middle.east > span.west &&
    middle.east < span.east &&
    middle.north > span.south &&
    middle.north < span.north;
  const layer = layers.find((one) => one.skip === null && holds(one.span));
  if (layer === undefined) return null;
  return sunChartOf({
    grid: layer.grid,
    corners,
    topM,
    far: data.farHorizon,
    place: pin,
    timeZone: siteTimeZoneOf(data.timeZone, pin.longitude),
    nowMs: Date.now(),
  });
}
