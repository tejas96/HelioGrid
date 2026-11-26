import type { GroundPoint, PhotoReader, Rgb } from '@heliogrid/domain';
import { type CanvasTexture, type Matrix3, Vector3 } from 'three';

/**
 * The picture under the roofs as the web reads it (`T-M05-002`, part e, roof looks): where it lies
 * on the ground, and its colour at a set of ground points. Which roof wears it and which colour a
 * reading lands on is domain's (`roof-dress.ts`); only the pixels are this platform's.
 */

/** The sky picture as the ground lays it: one texture over a box of ground, in metres from the pin. */
export interface RoofTopPicture {
  readonly texture: CanvasTexture;
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
  /**
   * Your own picture, turned and sized where the document lays it: a cap's east and north mapped
   * onto the texture by this matrix in place of the box (`T-M05-002d`, board 5.2).
   */
  readonly uv?: Matrix3;
}

/** Where a ground point lies on the picture's texture, 0 to 1 each way; `v` runs up from its foot. */
function placeOn(picture: RoofTopPicture): (point: GroundPoint) => readonly [number, number] {
  const { uv } = picture;
  if (uv !== undefined) {
    return (point) => {
      const at = new Vector3(point.east, point.north, 1).applyMatrix3(uv);
      return [at.x, at.y];
    };
  }
  return (point) => [
    (point.east - picture.west) / (picture.east - picture.west),
    (point.north - picture.south) / (picture.north - picture.south),
  ];
}

const onPicture = ([u, v]: readonly [number, number]) => u >= 0 && u <= 1 && v >= 0 && v <= 1;

/** A picture's pixels, read once for each picture drawn, at no more than this many a side. */
const READ_MOST_PX = 1024;
const PIXELS = new WeakMap<object, ImageData | null>();

/**
 * The picture's pixels, from a small copy: a 4096 px picture read whole would hold 64 MB beside
 * its texture, which a phone's web view cannot spare. A roof's colour needs no finer grain.
 */
function pixelsOf(picture: RoofTopPicture): ImageData | null {
  const image = picture.texture.image as HTMLCanvasElement | undefined;
  if (image === undefined || image.width === 0 || image.height === 0) return null;
  if (PIXELS.has(image)) return PIXELS.get(image) ?? null;
  const shrink = Math.min(1, READ_MOST_PX / Math.max(image.width, image.height));
  let read: ImageData | null = null;
  try {
    const copy = document.createElement('canvas');
    copy.width = Math.max(1, Math.round(image.width * shrink));
    copy.height = Math.max(1, Math.round(image.height * shrink));
    const context = copy.getContext('2d');
    context?.drawImage(image, 0, 0, copy.width, copy.height);
    read = context?.getImageData(0, 0, copy.width, copy.height) ?? null;
  } catch {
    // A picture the page may not read (another origin, a lost context) gives no colour.
    read = null;
  }
  PIXELS.set(image, read);
  return read;
}

const CHANNELS = 4;
const ALPHA = 3;
/** A pixel this opaque is picture; a faded edge or a tile that failed to load is not. */
const OPAQUE = 255;

/** The middle of each channel: a shade, a tank or a dirty corner moves it least. */
function medianOf(values: number[]): number {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] ?? 0;
}

/** Where a texture place lands in the pixels; a canvas texture is drawn flipped, its first row the top. */
function pixelAt(pixels: ImageData, [u, v]: readonly [number, number]): number {
  const x = Math.min(Math.floor(u * pixels.width), pixels.width - 1);
  const y = Math.min(Math.floor((1 - v) * pixels.height), pixels.height - 1);
  return (y * pixels.width + x) * CHANNELS;
}

export function photoReaderOf(picture: RoofTopPicture): PhotoReader {
  const place = placeOn(picture);
  const pixels = pixelsOf(picture);
  // The picture is under a point where it lies and is drawn whole: never its faded edge or a hole.
  const opaque = (at: readonly [number, number]) =>
    pixels === null || (pixels.data[pixelAt(pixels, at) + ALPHA] ?? 0) >= OPAQUE;
  return {
    covers: (point) => {
      const at = place(point);
      return onPicture(at) && opaque(at);
    },
    read: (points): Rgb | null => {
      if (pixels === null) return null;
      const channels: [number[], number[], number[]] = [[], [], []];
      for (const point of points) {
        const at = place(point);
        if (!onPicture(at)) continue;
        const index = pixelAt(pixels, at);
        if ((pixels.data[index + ALPHA] ?? 0) < OPAQUE) continue;
        channels.forEach((list, channel) => {
          list.push(pixels.data[index + channel] ?? 0);
        });
      }
      if (channels[0].length === 0) return null;
      return { r: medianOf(channels[0]), g: medianOf(channels[1]), b: medianOf(channels[2]) };
    },
  };
}
