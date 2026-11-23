'use client';
import type { StudioPicture } from '@heliogrid/data/react';
import { useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

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
/** Your picture lies a hair over the ground plane under it, under every roof. */
const OWN_ORDER = 2;
const HALF_TURN_DEG = 180;
const DEGREES = Math.PI / HALF_TURN_DEG;

interface Built {
  readonly texture: CanvasTexture;
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

async function builtOf(pieces: Own['pieces']): Promise<Built | null> {
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
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = ANISOTROPY;
  return { texture, west, east, south, north };
}

export function StudioOwnGround({ picture }: { picture: Own }) {
  // biome-ignore lint/plugin: the web's WebGL texture, built from the pictures in the browser, is the platform's own object
  const [built, setBuilt] = useState<Built | null>(null);
  useEffect(() => {
    let live = true;
    let made: Built | null = null;
    void builtOf(picture.pieces).then((next) => {
      made = next;
      if (live) setBuilt(next);
      else next?.texture.dispose();
    });
    return () => {
      live = false;
      made?.texture.dispose();
    };
  }, [picture.pieces]);
  if (built === null) return null;
  const { laid } = picture;
  return (
    <group
      position={[laid.at.east, 0, -laid.at.north]}
      rotation-y={-laid.turnDeg * DEGREES}
      scale={[laid.metresPerUnit, 1, laid.metresPerUnit]}
    >
      <mesh
        renderOrder={OWN_ORDER}
        rotation-x={-Math.PI / 2}
        position={[(built.west + built.east) / 2, 0, -(built.south + built.north) / 2]}
      >
        <planeGeometry args={[built.east - built.west, built.north - built.south]} />
        <meshBasicMaterial
          map={built.texture}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
