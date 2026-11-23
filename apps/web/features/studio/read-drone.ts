import { type DevicePart, type DeviceRead, dronePlan, NO_FACTS } from '@heliogrid/data';
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
const RGB = 3;
const RGBA = 4;
const OPAQUE = 255;

type Cut = Extract<ReturnType<typeof dronePlan>, { kind: 'cut' }>['cuts'][number];

/** The day the map was flown, from its own record; `null` when it carries none. */
async function flownOn(image: GeoTIFFImage): Promise<string | null> {
  const stamp: unknown = await image.fileDirectory.loadValue('DateTime').catch(() => undefined);
  if (typeof stamp !== 'string') return null;
  const day = stamp.slice(0, DATE_LENGTH).replaceAll(':', '-');
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/** One cut read from the map at its step — YCbCr and palettes turned to RGB by geotiff.js. */
async function pieceOf(image: GeoTIFFImage, cut: Cut, step: number): Promise<DevicePart> {
  const { x0, y0, x1, y1 } = cut.window;
  const width = Math.max(1, Math.round((x1 - x0) / step));
  const height = Math.max(1, Math.round((y1 - y0) / step));
  const rgb = (await image.readRGB({
    window: [x0, y0, x1, y1],
    width,
    height,
    interleave: true,
  })) as Uint8Array;
  const rgba = new Uint8ClampedArray(width * height * RGBA);
  for (let i = 0, j = 0; i < rgb.length; i += RGB, j += RGBA) {
    rgba.set(rgb.subarray(i, i + RGB), j);
    rgba[j + RGB] = OPAQUE;
  }
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d')?.putImageData(new ImageData(rgba, width, height), 0, 0);
  return { bytes: await jpegOf(canvas), page: 1, role: 'piece', box: cut.box };
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
