'use client';
import type { SkyPicturePiece } from '@heliogrid/contracts';
import type { StudioPicture } from '@heliogrid/data/react';
import { useEffect, useState } from 'react';
import {
  CanvasTexture,
  Color,
  CustomBlending,
  OneMinusSrcAlphaFactor,
  SRGBColorSpace,
  SrcAlphaFactor,
} from 'three';
import type { ClearGround } from './StudioCameraRig';

/** The texture side the GPU takes on every device we serve. */
const TEXTURE_MAX_PX = 4_096;
/** A pixel's red, green, blue and alpha. */
const PIXEL_BYTES = 4;
/** The share of each side over which the picture fades into the ground around it. */
const FADE_EDGE = 0.09;
/** The edge colour is the mean of the outer ring of the picture shrunk to this many pixels a side. */
const EDGE_SAMPLE_PX = 8;
const CHANNEL_MAX = 255;
/** How far the ground beyond the picture leans from the picture's edge colour to the page's. */
const SURROUND_TO_PAGE = 0.5;
/** Tiles laid edge to edge cover their box to within rounding: below this share, one is missing. */
const WHOLE_SHARE = 0.999;
/** How sharp the picture stays when seen at a slant. */
const ANISOTROPY = 8;
/**
 * The order the ground's three layers are drawn in, before anything else in the scene: the plain
 * ground, the softer picture, the sharp one. They lie flat on the ground and are laid by this order
 * alone, never by depth: a kilometre up a centimetre of depth is a step or two, and a phone's
 * graphics chip let the plain ground flash through the picture while the camera moved.
 */
const LAYER_ORDER = { ground: -3, around: -2, sharp: -1 } as const;
/** The ground beyond the picture, wide enough that its edge is lost in the haze. */
const SURROUND_M = 1_200;

/** The picture laid on one canvas, in metres east and north of the pin, and the ground around it. */
interface GroundPicture {
  readonly texture: CanvasTexture;
  readonly edge: Color;
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

async function imageOf(source: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

/**
 * The ground beyond the picture: the picture's own colour at its edge, leaning to the page's, so
 * the picture runs on into a calm ground that the haze takes into the page.
 */
function surroundOf(canvas: HTMLCanvasElement, page: string): Color | null {
  const small = document.createElement('canvas');
  small.width = EDGE_SAMPLE_PX;
  small.height = EDGE_SAMPLE_PX;
  const context = small.getContext('2d');
  if (context === null) return null;
  context.drawImage(canvas, 0, 0, EDGE_SAMPLE_PX, EDGE_SAMPLE_PX);
  const pixels = context.getImageData(0, 0, EDGE_SAMPLE_PX, EDGE_SAMPLE_PX).data;
  const last = EDGE_SAMPLE_PX - 1;
  const sum = [0, 0, 0];
  let count = 0;
  for (let y = 0; y <= last; y += 1) {
    for (let x = 0; x <= last; x += 1) {
      if (x !== 0 && x !== last && y !== 0 && y !== last) continue;
      const at = (y * EDGE_SAMPLE_PX + x) * PIXEL_BYTES;
      sum.forEach((total, channel) => {
        sum[channel] = total + (pixels[at + channel] ?? 0);
      });
      count += 1;
    }
  }
  const [red = 0, green = 0, blue = 0] = sum.map((total) => total / count / CHANNEL_MAX);
  return new Color()
    .setRGB(red, green, blue, SRGBColorSpace)
    .lerp(new Color(page), SURROUND_TO_PAGE);
}

/**
 * The picture's sides fade into what lies under them: into the ground's colour (`edge`), or, when
 * `seeThrough`, to see-through — so the sharp picture runs on into the softer one under it.
 */
function fadeEdges(
  context: CanvasRenderingContext2D,
  edge: string,
  width: number,
  height: number,
  seeThrough: boolean,
) {
  const across = Math.round(width * FADE_EDGE);
  const along = Math.round(height * FADE_EDGE);
  const clear = edge.replace('rgb(', 'rgba(').replace(')', ', 0)');
  // To see-through: each strip takes away what it covers, most at the outer edge.
  if (seeThrough) context.globalCompositeOperation = 'destination-out';
  const strips = [
    { from: [0, 0], to: [across, 0], box: [0, 0, across, height] },
    { from: [width, 0], to: [width - across, 0], box: [width - across, 0, across, height] },
    { from: [0, 0], to: [0, along], box: [0, 0, width, along] },
    { from: [0, height], to: [0, height - along], box: [0, height - along, width, along] },
  ] as const;
  for (const { from, to, box } of strips) {
    const fade = context.createLinearGradient(from[0], from[1], to[0], to[1]);
    fade.addColorStop(0, edge);
    fade.addColorStop(1, clear);
    context.fillStyle = fade;
    context.fillRect(box[0], box[1], box[2], box[3]);
  }
  context.globalCompositeOperation = 'source-over';
}

/**
 * The pieces drawn onto one canvas at the provider's own pixels — never stretched or sharpened,
 * which would also darken the provider's marks in the photograph — as one texture: one draw call
 * however many pieces the provider sent. `over`: the picture lies over a softer one, so its holes
 * and its outer part are see-through; else they take the ground's colour.
 */
async function groundPictureOf(
  pieces: readonly SkyPicturePiece[],
  page: string,
  over: boolean,
): Promise<GroundPicture | null> {
  // A piece that does not decode is left out: the rest of the picture still lies on the ground.
  const decoded = await Promise.allSettled(pieces.map((piece) => imageOf(piece.image)));
  const kept = pieces.flatMap((piece, at) => {
    const result = decoded[at];
    return result?.status === 'fulfilled' ? [{ piece, image: result.value }] : [];
  });
  const [firstKept] = kept;
  if (firstKept === undefined) return null;
  const { piece: first, image: firstImage } = firstKept;
  const west = Math.min(...pieces.map((piece) => piece.west));
  const east = Math.max(...pieces.map((piece) => piece.east));
  const south = Math.min(...pieces.map((piece) => piece.south));
  const north = Math.max(...pieces.map((piece) => piece.north));
  // The pieces are tiles of one grid: each lies at a whole column and row, at whole pixels — never
  // at a part of a pixel, where every pixel of it would be blended with its neighbour once more.
  const tileMetres = { across: first.east - first.west, along: first.north - first.south };
  const columns = Math.round((east - west) / tileMetres.across);
  const rows = Math.round((north - south) / tileMetres.along);
  const tilePx = Math.min(
    firstImage.naturalWidth,
    Math.floor(TEXTURE_MAX_PX / Math.max(columns, rows)),
  );
  const width = columns * tilePx;
  const height = rows * tilePx;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context === null) return null;
  context.imageSmoothingQuality = 'high';
  for (const { piece, image } of kept) {
    const column = Math.round((piece.west - west) / tileMetres.across);
    const row = Math.round((north - piece.north) / tileMetres.along);
    context.drawImage(image, column * tilePx, row * tilePx, tilePx, tilePx);
  }
  const surround = surroundOf(canvas, page);
  if (surround === null) return null;
  const edge = surround.getStyle();
  if (!over) {
    // A piece that did not decode leaves a hole: it reads as the ground around the picture.
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = edge;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
  }
  fadeEdges(context, edge, width, height, over);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = ANISOTROPY;
  return { texture, edge: surround, west, east, south, north };
}

/**
 * Whether the pieces cover their whole bounding box: a tile the provider left out leaves a hole that
 * the camera's limits must not count as picture. The pieces are tiles, which never overlap.
 */
function whole(pieces: readonly SkyPicturePiece[]): boolean {
  if (pieces.length === 0) return false;
  const west = Math.min(...pieces.map((piece) => piece.west));
  const east = Math.max(...pieces.map((piece) => piece.east));
  const south = Math.min(...pieces.map((piece) => piece.south));
  const north = Math.max(...pieces.map((piece) => piece.north));
  const covered = pieces.reduce(
    (sum, piece) => sum + (piece.east - piece.west) * (piece.north - piece.south),
    0,
  );
  return covered >= (east - west) * (north - south) * WHOLE_SHARE;
}

/**
 * The ground the picture shows whole, in metres from the pin: the softer picture round the sharp
 * one where there is one, else the sharp one — less its faded edges.
 */
export function clearGroundOf(picture: StudioPicture): ClearGround | null {
  if (picture.kind !== 'sky') return null;
  const outer = whole(picture.around) ? picture.around : picture.pieces;
  const west = Math.min(...outer.map((piece) => piece.west));
  const east = Math.max(...outer.map((piece) => piece.east));
  const south = Math.min(...outer.map((piece) => piece.south));
  const north = Math.max(...outer.map((piece) => piece.north));
  const across = (east - west) * FADE_EDGE;
  const along = (north - south) * FADE_EDGE;
  return { west: west + across, east: east - across, south: south + along, north: north - along };
}

/** One layer of picture, built in the browser and given back when its pieces change or it leaves. */
function useGroundPicture(
  pieces: readonly SkyPicturePiece[],
  page: string,
  over: boolean,
): GroundPicture | null {
  // biome-ignore lint/plugin: the web's WebGL texture, built from the pictures in the browser, is the platform's own object
  const [ground, setGround] = useState<GroundPicture | null>(null);
  useEffect(() => {
    if (pieces.length === 0) {
      setGround(null);
      return;
    }
    let live = true;
    let made: GroundPicture | null = null;
    void groundPictureOf(pieces, page, over).then((built) => {
      made = built;
      if (live) setGround(built);
      else built?.texture.dispose();
    });
    return () => {
      live = false;
      made?.texture.dispose();
    };
  }, [pieces, page, over]);
  return ground;
}

/** One layer laid flat on the ground at its place, a hair over the one under it. */
function GroundLayer({ ground, order }: { ground: GroundPicture; order: number }) {
  return (
    <mesh
      renderOrder={order}
      rotation-x={-Math.PI / 2}
      position={[(ground.west + ground.east) / 2, 0, -(ground.south + ground.north) / 2]}
    >
      <planeGeometry args={[ground.east - ground.west, ground.north - ground.south]} />
      {/* Drawn with the solid parts, in its order: its faded edge blends over the layer under it,
          and it writes no depth, so whatever stands on the ground is drawn over it. */}
      <meshBasicMaterial
        map={ground.texture}
        toneMapped={false}
        blending={CustomBlending}
        blendSrc={SrcAlphaFactor}
        blendDst={OneMinusSrcAlphaFactor}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * The sky picture on the site's ground, at its place in metres from the pin: the softer picture
 * round it, the sharp one over it fading into it, and the ground beyond both. A photograph holds its
 * own light, so it is drawn as it is — its true colours, untouched by the scene's light or tone.
 */
export function StudioPictureGround({
  pieces,
  around,
  page,
}: {
  pieces: readonly SkyPicturePiece[];
  /** The softer picture round the sharp one; empty where there is none. */
  around: readonly SkyPicturePiece[];
  /** The page's colour, which the ground beyond the picture leans to. */
  page: string;
}) {
  const ringed = around.length > 0;
  const outer = useGroundPicture(around, page, false);
  const sharp = useGroundPicture(pieces, page, ringed);
  const under = ringed ? outer : sharp;
  if (sharp === null && under === null) return null;
  return (
    <>
      {under === null ? null : (
        <mesh rotation-x={-Math.PI / 2} renderOrder={LAYER_ORDER.ground}>
          <planeGeometry args={[SURROUND_M, SURROUND_M]} />
          <meshBasicMaterial
            color={under.edge}
            toneMapped={false}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
      {ringed && outer !== null ? <GroundLayer ground={outer} order={LAYER_ORDER.around} /> : null}
      {sharp === null ? null : <GroundLayer ground={sharp} order={LAYER_ORDER.sharp} />}
    </>
  );
}
