import {
  type DevicePart,
  type DeviceRead,
  dronePlan,
  droneRgbaOf,
  NO_FACTS,
} from '@heliogrid/data';
import { FILE_MAX_BYTES } from '@heliogrid/domain';
import { fromBlob, type GeoTIFFImage } from 'geotiff';
import { jpegOf } from './read-photo';

/**
 * A drone map read on the device (`T-M05-002d`): only the window round the pin is read — a 600 MB
 * map never leaves the phone — at the step `dronePlan` sets, cut into JPEG pieces. Its place, north
 * and scale come from the file. Runs in the reader's worker; geotiff.js reads the pixels.
 */

/** The GeoTIFF key value that names the metre as a projected system's unit. */
const METRE_UNIT = 9001;
const DATE_LENGTH = 10;
/** WebP pieces keep a see-through edge at a JPEG's bytes. */
const WEBP_QUALITY = 0.85;
const HALF = 2;

type Cut = Extract<ReturnType<typeof dronePlan>, { kind: 'cut' }>['cuts'][number];

/** The day the map was flown, from its own record; `null` when it carries none. */
async function flownOn(image: GeoTIFFImage): Promise<string | null> {
  const stamp: unknown = await image.fileDirectory.loadValue('DateTime').catch(() => undefined);
  if (typeof stamp !== 'string') return null;
  const day = stamp.slice(0, DATE_LENGTH).replaceAll(':', '-');
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/**
 * A piece's bytes: a JPEG when every pixel shows; with see-through edges a WebP, or — where the
 * device writes no WebP (Safari) — a PNG, at half its size when the whole would pass a file's limit.
 */
async function encoded(canvas: OffscreenCanvas, seeThrough: boolean) {
  if (!seeThrough) return { bytes: await jpegOf(canvas), contentType: 'image/jpeg' as const };
  const webp = await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY });
  if (webp.type === 'image/webp') {
    return { bytes: new Uint8Array(await webp.arrayBuffer()), contentType: 'image/webp' as const };
  }
  const png = await canvas.convertToBlob({ type: 'image/png' });
  if (png.size <= FILE_MAX_BYTES) {
    return { bytes: new Uint8Array(await png.arrayBuffer()), contentType: 'image/png' as const };
  }
  const half = new OffscreenCanvas(Math.ceil(canvas.width / HALF), Math.ceil(canvas.height / HALF));
  half.getContext('2d')?.drawImage(canvas, 0, 0, half.width, half.height);
  const small = await half.convertToBlob({ type: 'image/png' });
  return { bytes: new Uint8Array(await small.arrayBuffer()), contentType: 'image/png' as const };
}

/** One cut read from the map at its step — YCbCr and palettes turned to RGB by geotiff.js. */
async function pieceOf(image: GeoTIFFImage, cut: Cut, step: number): Promise<DevicePart> {
  const { x0, y0, x1, y1 } = cut.window;
  const width = Math.max(1, Math.round((x1 - x0) / step));
  const height = Math.max(1, Math.round((y1 - y0) / step));
  // The map's own see-through band comes too, where it has one.
  const samples = (await image.readRGB({
    window: [x0, y0, x1, y1],
    width,
    height,
    interleave: true,
    enableAlpha: true,
  })) as Uint8Array;
  const pixels = width * height;
  const { rgba, seeThrough } = droneRgbaOf(
    samples,
    samples.length / pixels,
    pixels,
    image.getGDALNoData(),
  );
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d')?.putImageData(new ImageData(rgba, width, height), 0, 0);
  return { ...(await encoded(canvas, seeThrough)), page: 1, role: 'piece', box: cut.box };
}

export async function readDrone(
  file: Blob,
  pin: { latitude: number; longitude: number },
): Promise<DeviceRead> {
  let image: GeoTIFFImage;
  try {
    image = await (await fromBlob(file)).getImage(0);
  } catch {
    return { kind: 'refused', refusal: 'broken' };
  }
  const keys = image.getGeoKeys() ?? {};
  const [originX = 0, originY = 0] = image.getOrigin();
  const [pixelX = 1, pixelY = -1] = image.getResolution();
  const plan = dronePlan(
    {
      epsg: keys.ProjectedCSTypeGeoKey ?? keys.GeographicTypeGeoKey ?? null,
      metric: keys.ProjLinearUnitsGeoKey === METRE_UNIT,
      grid: {
        width: image.getWidth(),
        height: image.getHeight(),
        originX,
        originY,
        pixelX,
        pixelY,
      },
    },
    pin,
  );
  if (plan.kind === 'refused') return plan.read;
  const parts: DevicePart[] = [];
  for (const cut of plan.cuts) parts.push(await pieceOf(image, cut, plan.step));
  return {
    kind: 'read',
    pictureKind: 'drone',
    facts: { ...NO_FACTS, ...plan.facts, takenOn: await flownOn(image) },
    parts,
    lay: plan.lay,
  };
}
