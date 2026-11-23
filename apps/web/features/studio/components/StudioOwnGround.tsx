'use client';
import type { StudioPicture } from '@heliogrid/data/react';
import { useEffect, useState } from 'react';
import { CanvasTexture, Matrix3, SRGBColorSpace } from 'three';
import type { RoofTopPicture } from './StudioRoofs';

/**
 * Your photo or drone map on the ground (`T-M05-002d`, board 2.1, 3.1, 5.2): its pieces drawn on one
 * canvas at their own pixels, each where its box says, and laid where the document lays it — its
 * origin at `at`, turned clockwise from north, a unit `metresPerUnit` metres. It lies under the model
 * in 3D, as the sky picture does, and holds its own light.
 */

type Own = Extract<StudioPicture, { kind: 'own' }>;

/** The texture is at most this many pixels a side: what every phone's graphics take. */
const TEXTURE_MAX_PX = 4096;
const ANISOTROPY = 8;
/**
 * Your picture lies over the ground plane and the grid (2 cm up), and under the roofs' shadow (4 cm
 * up): the grid shows only round it, and the roofs stand on it and cast their shadow over it.
 */
const OWN_LIFT_M = 0.03;
const OWN_ORDER = 2;
const HALF_TURN_DEG = 180;
const DEGREES = Math.PI / HALF_TURN_DEG;

interface Built {
  readonly texture: CanvasTexture;
  /** The same picture on the walls' plaster: a roof's top never shows a see-through edge as black. */
  readonly top: CanvasTexture;
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

/** Each piece decoded from its short-lived link; one that does not load is left out. */
async function imageOf(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  // The store answers the studio's own origin: the canvas stays readable for the texture.
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  return image;
}

function textureOf(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = ANISOTROPY;
  return texture;
}

async function builtOf(pieces: Own['pieces'], plaster: string): Promise<Built | null> {
  const decoded = await Promise.allSettled(pieces.map((piece) => imageOf(piece.image)));
  const kept = pieces.flatMap((piece, i) => {
    const result = decoded[i];
    return result?.status === 'fulfilled' ? [{ piece, image: result.value }] : [];
  });
  const first = kept[0];
  if (first === undefined) return null;
  const west = Math.min(...kept.map(({ piece }) => piece.west));
  const east = Math.max(...kept.map(({ piece }) => piece.east));
  const south = Math.min(...kept.map(({ piece }) => piece.south));
  const north = Math.max(...kept.map(({ piece }) => piece.north));
  // One unit of the picture in pixels, from the first piece's own, kept under the texture's limit.
  const own = first.image.naturalWidth / (first.piece.east - first.piece.west);
  const perUnit = Math.min(own, TEXTURE_MAX_PX / Math.max(east - west, north - south));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((east - west) * perUnit);
  canvas.height = Math.round((north - south) * perUnit);
  const context = canvas.getContext('2d');
  if (context === null) return null;
  context.imageSmoothingQuality = 'high';
  for (const { piece, image } of kept) {
    context.drawImage(
      image,
      Math.round((piece.west - west) * perUnit),
      Math.round((north - piece.north) * perUnit),
      Math.round((piece.east - piece.west) * perUnit),
      Math.round((piece.north - piece.south) * perUnit),
    );
  }
  const texture = textureOf(canvas);
  // The roofs' tops take the picture at half its pixels: a roof is a small part of it.
  const onPlaster = document.createElement('canvas');
  onPlaster.width = Math.max(1, Math.round(canvas.width / 2));
  onPlaster.height = Math.max(1, Math.round(canvas.height / 2));
  const paint = onPlaster.getContext('2d');
  if (paint === null) return null;
  paint.fillStyle = plaster;
  paint.fillRect(0, 0, onPlaster.width, onPlaster.height);
  paint.drawImage(canvas, 0, 0, onPlaster.width, onPlaster.height);
  return { texture, top: textureOf(onPlaster), west, east, south, north };
}

/**
 * The roofs' tops wear your picture where it lies (board 5.2): a cap's east and north turned back
 * by the picture's turn, out of metres into its units, and into the texture's box.
 */
function roofTopOf(built: Built, laid: Own['laid']): RoofTopPicture {
  const turn = laid.turnDeg * DEGREES;
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  const across = (built.east - built.west) * laid.metresPerUnit;
  const along = (built.north - built.south) * laid.metresPerUnit;
  const { east, north } = laid.at;
  const uv = new Matrix3().set(
    c / across,
    -s / across,
    (-c * east + s * north) / across - built.west / (built.east - built.west),
    s / along,
    c / along,
    (-s * east - c * north) / along - built.south / (built.north - built.south),
    0,
    0,
    1,
  );
  return { texture: built.top, west: 0, east: 0, south: 0, north: 0, uv };
}

export function StudioOwnGround({
  picture,
  onTop,
  plaster,
}: {
  picture: Own;
  /** The walls' colour, under the roofs' tops where the picture is see-through. */
  plaster: string;
  /** The picture the roofs' tops wear, once it is drawn; `null` while it is not. */
  onTop: (top: RoofTopPicture | null) => void;
}) {
  // biome-ignore lint/plugin: the web's WebGL texture, built from the pictures in the browser, is the platform's own object
  const [built, setBuilt] = useState<Built | null>(null);
  useEffect(() => {
    let live = true;
    let made: Built | null = null;
    const dispose = (gone: Built | null) => {
      gone?.texture.dispose();
      gone?.top.dispose();
    };
    void builtOf(picture.pieces, plaster).then((next) => {
      made = next;
      if (live) setBuilt(next);
      else dispose(next);
    });
    return () => {
      live = false;
      dispose(made);
    };
  }, [picture.pieces, plaster]);
  const { laid } = picture;
  useEffect(() => {
    onTop(built === null ? null : roofTopOf(built, laid));
    return () => onTop(null);
  }, [built, laid, onTop]);
  if (built === null) return null;
  return (
    <group
      position={[laid.at.east, 0, -laid.at.north]}
      rotation-y={-laid.turnDeg * DEGREES}
      scale={[laid.metresPerUnit, 1, laid.metresPerUnit]}
    >
      <mesh
        renderOrder={OWN_ORDER}
        rotation-x={-Math.PI / 2}
        position={[(built.west + built.east) / 2, OWN_LIFT_M, -(built.south + built.north) / 2]}
      >
        <planeGeometry args={[built.east - built.west, built.north - built.south]} />
        <meshBasicMaterial
          map={built.texture}
          // A drone map's ragged edge is cut away, so the ground under it shows, never black; cut,
          // not blended, so the picture stays under the roofs, drawn in the same pass as them; it
          // writes depth, so the grid under it (2 cm up) never draws over it.
          alphaTest={0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
