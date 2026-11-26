import { type UtmRaster, utmZoneOfEpsg } from '@heliogrid/domain/studio-kernel';
import { fromArrayBuffer } from 'geotiff';

/**
 * A GeoTIFF of Google's height map read into its bands (`T-M05-002`, part g): each on the UTM grid
 * it is laid on, rows from the north. `getOrigin` and `getResolution` read the file's affine from
 * its tie point or its transformation alike. A file on any other grid is refused, never guessed.
 */
export async function bandsOf(bytes: Uint8Array): Promise<UtmRaster[]> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const tiff = await fromArrayBuffer(buffer as ArrayBuffer);
  const image = await tiff.getImage();
  const keys = (image.getGeoKeys?.() ?? {}) as { ProjectedCSTypeGeoKey?: number };
  const zone = utmZoneOfEpsg(keys.ProjectedCSTypeGeoKey ?? 0);
  if (zone === null) {
    throw new Error(`a height map on EPSG:${keys.ProjectedCSTypeGeoKey ?? 'none'}, not UTM`);
  }
  const [west, north] = image.getOrigin() as [number, number];
  const [stepEast, stepNorth] = image.getResolution() as [number, number];
  const cols = image.getWidth();
  const rows = image.getHeight();
  const noDataText = image.getGDALNoData?.();
  const noData = typeof noDataText === 'number' ? noDataText : null;
  const bands = (await image.readRasters()) as unknown as ArrayLike<number>[];
  return Array.from(bands, (values) => ({
    zone,
    west,
    north,
    stepEast,
    stepSouth: Math.abs(stepNorth),
    cols,
    rows,
    values,
    noData,
  }));
}
