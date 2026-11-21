'use client';
import type { GroundBox } from '@heliogrid/domain';
import { BufferAttribute, BufferGeometry, Color, PlaneGeometry, SRGBColorSpace } from 'three';

/** The ground beyond the picture, wide enough that its edge is lost in the haze. */
const SURROUND_M = 4_000;
/** A corner's east, north and height. */
const XYZ = 3;
/** How far inside its reach the picture fades into the ground around it, in metres. */
const EDGE_FADE_M = 30;
/** The ground's own colour is the mean of the first tile shrunk to this many pixels a side. */
const EDGE_SAMPLE_PX = 8;
const CHANNEL_MAX = 255;
const PIXEL_BYTES = 4;
/** How far the ground beyond the picture leans from the picture's own colour to the page's. */
const SURROUND_TO_PAGE = 0.5;

/** The plain ground under every tile: it shows where a tile has not come, and past the picture. */
export function plainGround(): PlaneGeometry {
  return new PlaneGeometry(SURROUND_M, SURROUND_M);
}

/** The picture's own colour, leaning to the page's: the calm ground the picture runs on into. */
export function surroundOf(picture: ImageBitmap, page: string): Color | null {
  const small = document.createElement('canvas');
  small.width = EDGE_SAMPLE_PX;
  small.height = EDGE_SAMPLE_PX;
  const context = small.getContext('2d');
  if (context === null) return null;
  context.drawImage(picture, 0, 0, EDGE_SAMPLE_PX, EDGE_SAMPLE_PX);
  const pixels = context.getImageData(0, 0, EDGE_SAMPLE_PX, EDGE_SAMPLE_PX).data;
  const sum = [0, 0, 0];
  for (let at = 0; at < pixels.length; at += PIXEL_BYTES) {
    sum.forEach((total, channel) => {
      sum[channel] = total + (pixels[at + channel] ?? 0);
    });
  }
  const count = pixels.length / PIXEL_BYTES;
  const [red = 0, green = 0, blue = 0] = sum.map((total) => total / count / CHANNEL_MAX);
  return new Color()
    .setRGB(red, green, blue, SRGBColorSpace)
    .lerp(new Color(page), SURROUND_TO_PAGE);
}

/**
 * The ground's soft edge, lying over the tiles: solid past the picture's reach, and fading to
 * nothing over the last metres inside it, so the picture runs on into the ground around it and no
 * tile's cut edge ever shows.
 */
export function edgeFrame(reach: GroundBox): BufferGeometry {
  const half = SURROUND_M / 2;
  const rings = [
    { west: -half, east: half, south: -half, north: half, solid: 1 },
    { ...reach, solid: 1 },
    {
      west: reach.west + EDGE_FADE_M,
      east: reach.east - EDGE_FADE_M,
      south: reach.south + EDGE_FADE_M,
      north: reach.north - EDGE_FADE_M,
      solid: 0,
    },
  ];
  const corners = rings.flatMap((ring) => [
    [ring.west, ring.south, ring.solid],
    [ring.east, ring.south, ring.solid],
    [ring.east, ring.north, ring.solid],
    [ring.west, ring.north, ring.solid],
  ]);
  const cornersPerRing = 4;
  const faces: number[] = [];
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let side = 0; side < cornersPerRing; side += 1) {
      const outer = ring * cornersPerRing + side;
      const outerNext = ring * cornersPerRing + ((side + 1) % cornersPerRing);
      const inner = outer + cornersPerRing;
      const innerNext = outerNext + cornersPerRing;
      faces.push(outer, outerNext, innerNext, outer, innerNext, inner);
    }
  }
  const frame = new BufferGeometry();
  frame.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(corners.flatMap(([x = 0, y = 0]) => [x, y, 0])), XYZ),
  );
  frame.setAttribute(
    'color',
    new BufferAttribute(
      new Float32Array(corners.flatMap(([, , solid = 0]) => [1, 1, 1, solid])),
      PIXEL_BYTES,
    ),
  );
  frame.setIndex(faces);
  return frame;
}

/**
 * The ground the picture shows whole, in metres from the pin as the picture lies: its reach less
 * the soft edge. The camera never shows past it.
 */
export function clearGroundOf(reach: GroundBox): GroundBox {
  return {
    west: reach.west + EDGE_FADE_M,
    east: reach.east - EDGE_FADE_M,
    south: reach.south + EDGE_FADE_M,
    north: reach.north - EDGE_FADE_M,
  };
}
