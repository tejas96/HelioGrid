'use client';
import type { SkyPicturePiece } from '@heliogrid/contracts';
import type { LidarMesh } from '@heliogrid/data/react';
import type { GroundPoint, LidarLook, SiteLineUp } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from 'three';
import {
  cutOf,
  scanDepthOnlyOf,
  scanMaterialOf,
  scanShadowOf,
  scanUniformsOf,
} from './lidar-scan-look';
import { LidarPinFollower } from './StudioLidarPins';
import { StudioSunlight } from './StudioSunlight';
import type { SceneScreen } from './scene-screen';

/** What LiDAR's scan shows (`T-M05-002g`). */
export interface LidarScanShown {
  readonly mesh: LidarMesh;
  /** The straight-down photo it wears; `null` until it is in. */
  readonly photo: SkyPicturePiece | null;
  readonly look: LidarLook;
  readonly sunlight: boolean;
  /** 0 solid, to 1 the most see-through. */
  readonly seeThrough: number;
  /** Where the map is moved onto the picture: the scan moves with it. */
  readonly lineUp: SiteLineUp;
  /** The drawn roofs' outlines: the scan is left out under them, unless the whole scan is wanted. */
  readonly cut: readonly (readonly GroundPoint[])[];
  readonly cutOn: boolean;
  /** The Heights key's low and high, metres above the ground. */
  readonly key: { readonly lowM: number; readonly highM: number };
  /** The roofs' middle and how far round it the scan stands before it fades into the stage. */
  readonly middle: GroundPoint;
  readonly reachM: number;
}

const XYZ = 3;
const ONE = 1;
/** The scan fades into the stage over its last part. */
const FADE_SHARE = 0.25;
/** A see-through scan keeps this much of itself at the most. */
const SEE_THROUGH_KEEPS = 0.1;

function geometryOf(mesh: LidarMesh): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(mesh.positions, XYZ));
  geometry.setAttribute('normal', new BufferAttribute(mesh.normals, XYZ));
  geometry.setIndex(new BufferAttribute(mesh.indices, ONE));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** The photo's texture, loaded once for its image; `null` until it is drawn. */
function usePhoto(photo: SkyPicturePiece | null): Texture | null {
  const gl = useThree((three) => three.gl);
  const invalidate = useThree((three) => three.invalidate);
  // biome-ignore lint/plugin: the photo's WebGL texture, the scene's own, made once it is drawn
  const [texture, setTexture] = useState<Texture | null>(null);
  const image = photo?.image ?? null;
  useEffect(() => {
    if (image === null) return;
    let live = true;
    const loaded = new TextureLoader().load(image, () => {
      if (!live) return;
      setTexture(loaded);
      invalidate();
    });
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = gl.capabilities.getMaxAnisotropy();
    return () => {
      live = false;
      loaded.dispose();
      setTexture(null);
    };
  }, [image, gl, invalidate]);
  return texture;
}

/**
 * LiDAR's scan in the studio's 3D view (`T-M05-002g`, step 5): Google's height map as one lit mesh,
 * the straight-down photo on its tops and the studio's plaster on its walls, Heights in the key's
 * colours, real shadows from the studio's own sun, fading into the dark stage, and left out under
 * the drawn roofs so the studio's own model stands clean among the scanned neighbours. It moves
 * with the map's line-up. Frames are drawn on demand: a change asks for one.
 */
export function StudioLidarScan({
  shown,
  palette,
}: {
  shown: LidarScanShown;
  palette: ThemePalette;
}) {
  const invalidate = useThree((three) => three.invalidate);
  const uniforms = useMemo(() => scanUniformsOf(palette), [palette]);
  const material = useMemo(() => scanMaterialOf(uniforms), [uniforms]);
  const shadow = useMemo(() => scanShadowOf(uniforms), [uniforms]);
  const twin = useMemo(() => scanDepthOnlyOf(uniforms), [uniforms]);
  const geometry = useMemo(() => geometryOf(shown.mesh), [shown.mesh]);
  const cutCanvas = useMemo(() => document.createElement('canvas'), []);
  const cutTexture = useMemo(() => new CanvasTexture(cutCanvas), [cutCanvas]);
  const photo = usePhoto(shown.photo);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useEffect(
    () => () => {
      material.dispose();
      shadow.dispose();
      twin.dispose();
      cutTexture.dispose();
      uniforms.uRamp.value.dispose();
    },
    [material, shadow, twin, cutTexture, uniforms],
  );

  // The cut covers the scan's own ground, where the drawn roofs stand in the world.
  const box = geometry.boundingBox;
  const { lineUp, cut } = shown;
  const cutKey = JSON.stringify(cut);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the cut is drawn again when an outline moves, by value
  useEffect(() => {
    if (box === null) return;
    const ground = {
      west: box.min.x + lineUp.east,
      east: box.max.x + lineUp.east,
      south: -box.max.z + lineUp.north,
      north: -box.min.z + lineUp.north,
    };
    cutOf(cut, ground, cutCanvas, palette['scene-mark']);
    cutTexture.needsUpdate = true;
    uniforms.uCut.value = cutTexture;
    uniforms.uCutBox.value.set(ground.west, ground.south, ground.east, ground.north);
    invalidate();
  }, [
    box,
    cutKey,
    lineUp.east,
    lineUp.north,
    cutCanvas,
    cutTexture,
    uniforms,
    invalidate,
    palette,
  ]);

  const { look, sunlight, seeThrough, key, middle, reachM, cutOn } = shown;
  const { lift } = lineUp;
  const piece = shown.photo;
  useEffect(() => {
    uniforms.uLook.value = look === 'heights' ? 1 : 0;
    uniforms.uSunOn.value = sunlight ? 1 : 0;
    uniforms.uCutOn.value = cutOn ? 1 : 0;
    // The pad lies at the model's ground, wherever the person lifted the map.
    uniforms.uFloor.value = -lift;
    uniforms.uKey.value.set(key.lowM, key.highM);
    uniforms.uMiddle.value.set(middle.east, middle.north);
    uniforms.uFade.value.set(reachM * (1 - FADE_SHARE), reachM);
    uniforms.uPhoto.value = photo;
    uniforms.uPhotoOn.value = photo === null ? 0 : 1;
    if (piece !== null)
      uniforms.uPhotoBox.value.set(piece.west, piece.south, piece.east, piece.north);
    const see = seeThrough > 0;
    material.transparent = see;
    material.opacity = 1 - (1 - SEE_THROUGH_KEEPS) * seeThrough;
    material.depthWrite = !see;
    material.needsUpdate = true;
    invalidate();
  }, [
    uniforms,
    material,
    look,
    sunlight,
    cutOn,
    key,
    middle,
    reachM,
    photo,
    piece,
    seeThrough,
    lift,
    invalidate,
  ]);

  return (
    <group position={[lineUp.east, lineUp.lift, -lineUp.north]}>
      {seeThrough > 0 ? <mesh geometry={geometry} material={twin} renderOrder={1} /> : null}
      <mesh
        geometry={geometry}
        material={material}
        customDepthMaterial={shadow}
        castShadow
        receiveShadow
        renderOrder={2}
      />
    </group>
  );
}

/**
 * LiDAR in the scene (`T-M05-002g`): on, the stage goes dark and the flat picture steps aside for
 * the scan (`null` until built); the roofs' sunlight while Sunlight shows; the pins on the roofs.
 */
export interface LidarLayerShown {
  readonly on: boolean;
  readonly scan: LidarScanShown | null;
  readonly sunlight: Parameters<typeof StudioSunlight>[0] | null;
  /** The pins on the drawn roofs, which the page draws and each frame places. */
  readonly pins: Omit<Parameters<typeof LidarPinFollower>[0], 'screen'>;
  /** The picked roofs' outlines at their tops: their roof lines stand thick. */
  readonly picked: readonly { readonly corners: readonly GroundPoint[]; readonly topM: number }[];
}

/** A picked roof's line stands this far over its top, and this wide in CSS pixels. */
const PICKED_LIFT_M = 0.08;
const PICKED_LINE_PX = 4;

export function StudioLidarLayer({
  on,
  scan,
  sunlight,
  pins,
  picked,
  screen,
  palette,
}: LidarLayerShown & { readonly screen: SceneScreen; readonly palette: ThemePalette }) {
  if (!on) return null;
  return (
    <>
      {scan === null ? null : <StudioLidarScan shown={scan} palette={palette} />}
      {sunlight === null ? null : <StudioSunlight {...sunlight} />}
      <LidarPinFollower {...pins} screen={screen} />
      {picked.map(({ corners, topM }) => (
        <Line
          key={corners.map((c) => `${c.east},${c.north}`).join(';')}
          points={[...corners, corners[0] ?? { east: 0, north: 0 }].map(
            (c) => [c.east, topM + PICKED_LIFT_M, -c.north] as [number, number, number],
          )}
          color={palette['scene-line']}
          lineWidth={PICKED_LINE_PX}
        />
      ))}
    </>
  );
}
