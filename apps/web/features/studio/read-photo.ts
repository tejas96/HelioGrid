import { type DevicePart, type DeviceRead, NO_FACTS, photoPlan } from '@heliogrid/data';
import exifr from 'exifr';

/**
 * A photo from above read on the device (`T-M05-002d`): turned as the camera held it, cut into JPEG
 * pieces where `photoPlan` cuts it, and laid on the pin at an assumed size. Runs in the reader's
 * worker; the browser draws the pixels.
 */

/** JPEG pieces keep the picture's look at a fraction of its bytes; one piece stays well under 2 MB. */
const PIECE_QUALITY = 0.85;
/** A photo past this many pixels a side is shrunk first: no roof needs more, and memory is a phone's. */
const PHOTO_MAX_PX = 6_000;
const DATE_LENGTH = 10;

type Cut = ReturnType<typeof photoPlan>['cuts'][number];

/** A drawable turned into a JPEG piece's bytes. */
export async function jpegOf(canvas: OffscreenCanvas): Promise<Uint8Array> {
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: PIECE_QUALITY });
  return new Uint8Array(await blob.arrayBuffer());
}

/** One cut of a drawable as a JPEG piece. */
export async function pieceOf(source: CanvasImageSource, cut: Cut): Promise<DevicePart> {
  const { x0, y0, x1, y1 } = cut.window;
  const canvas = new OffscreenCanvas(x1 - x0, y1 - y0);
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('no 2d canvas in this worker');
  context.drawImage(source, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
  return {
    bytes: await jpegOf(canvas),
    contentType: 'image/jpeg',
    page: 1,
    role: 'piece',
    box: cut.box,
  };
}

/** The day a photo was taken, from its camera's own record; `null` when it carries none. */
async function takenOn(file: Blob): Promise<string | null> {
  try {
    const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate'] });
    const when: unknown = exif?.DateTimeOriginal ?? exif?.CreateDate;
    return when instanceof Date && !Number.isNaN(when.getTime())
      ? when.toISOString().slice(0, DATE_LENGTH)
      : null;
  } catch {
    return null;
  }
}

/** The photo as the camera held it, shrunk to at most `PHOTO_MAX_PX` a side. */
async function boundedBitmap(file: Blob): Promise<ImageBitmap> {
  const whole = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const longest = Math.max(whole.width, whole.height);
  if (longest <= PHOTO_MAX_PX) return whole;
  const k = PHOTO_MAX_PX / longest;
  const shrunk = await createImageBitmap(whole, {
    resizeWidth: Math.round(whole.width * k),
    resizeHeight: Math.round(whole.height * k),
    resizeQuality: 'high',
  });
  whole.close();
  return shrunk;
}

/** A drawable laid as a photo: a photo itself, or a PDF's picture page at its 1:100 guess. */
export async function laidAsPhoto(
  source: ImageBitmap | OffscreenCanvas,
  facts: Partial<typeof NO_FACTS>,
  metresPerPixel?: number,
): Promise<DeviceRead> {
  const plan = photoPlan(source.width, source.height, metresPerPixel);
  const parts: DevicePart[] = [];
  for (const cut of plan.cuts) parts.push(await pieceOf(source, cut));
  return {
    kind: 'read',
    pictureKind: 'photo',
    facts: { ...NO_FACTS, ...facts },
    parts,
    lay: plan.lay,
  };
}

export async function readPhoto(file: Blob): Promise<DeviceRead> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await boundedBitmap(file);
  } catch {
    return { kind: 'refused', refusal: 'not_a_picture' };
  }
  const read = await laidAsPhoto(bitmap, { takenOn: await takenOn(file) });
  bitmap.close();
  return read;
}
