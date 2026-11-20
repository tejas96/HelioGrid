'use client';
import type { StudioPicture } from '@heliogrid/data/react';
import type { StudioView, SunPosition } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { Grid } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ReactNode, RefObject } from 'react';
import { MathUtils, Vector3 } from 'three';
import { StudioCameraRig, type StudioDrive, type StudioMarks } from './StudioCameraRig';
import { clearGroundOf, StudioPictureGround } from './StudioPictureGround';

const RADIANS = MathUtils.DEG2RAD;
/** The plain ground where there is no picture, wide enough that its edge is never seen. */
const GROUND_M = 1_200;
/** How far the sun's light stands from the site, and the ground its shadows cover. */
const SUN_DISTANCE_M = 120;
const SHADOW_HALF_M = 60;

/** The camera before its first view is set: the rig flies it from here. */
const CAMERA_START = { near: 0.5, far: 3_000, position: [0, 60, 60] as [number, number, number] };

/** Heights that keep the ground's layers apart: the grid and the pin's ring over the ground. */
const GRID_LIFT_M = 0.02;
const RING_LIFT_M = 0.03;
const PIN_LABEL_M = 0.4;
/** The pin's ring on the ground: its inner and outer radius, and its smoothness. */
const RING_INNER_M = 0.35;
const RING_OUTER_M = 0.55;
const RING_SEGMENTS = 40;
/** The light: the sky's fill, the sun's strength, and the sharpness of its shadow map. */
const SKY_LIGHT = 1.1;
const SUN_LIGHT = 2.4;
const SHADOW_MAP_PX = 2048;
const PIN_TOP = new Vector3(0, PIN_LABEL_M, 0);

/** The sun's light from where the sun stands, casting soft shadows over the site. */
function SunLight({ sun, palette }: { sun: SunPosition; palette: ThemePalette }) {
  const azimuth = sun.azimuthDegrees * RADIANS;
  const elevation = sun.elevationDegrees * RADIANS;
  const across = Math.cos(elevation) * SUN_DISTANCE_M;
  return (
    <>
      <hemisphereLight args={[palette.surface, palette['canvas-sunken'], SKY_LIGHT]} />
      <directionalLight
        position={[
          Math.sin(azimuth) * across,
          Math.sin(elevation) * SUN_DISTANCE_M,
          -Math.cos(azimuth) * across,
        ]}
        intensity={SUN_LIGHT}
        castShadow
        shadow-mapSize={[SHADOW_MAP_PX, SHADOW_MAP_PX]}
        shadow-camera-left={-SHADOW_HALF_M}
        shadow-camera-right={SHADOW_HALF_M}
        shadow-camera-top={SHADOW_HALF_M}
        shadow-camera-bottom={-SHADOW_HALF_M}
        shadow-bias={-0.0004}
      />
    </>
  );
}

/**
 * Keeps the page's pin label over the pin: each drawn frame puts it where the pin lands on the
 * screen, and hides it while the pin is behind the camera. The label is the page's own text, never
 * drawn into the scene.
 */
function PinFollower({ label }: { label: RefObject<HTMLElement | null> }) {
  const at = new Vector3();
  useFrame(({ camera, size }) => {
    const node = label.current;
    if (node === null) return;
    at.copy(PIN_TOP).project(camera);
    const behind = at.z > 1;
    node.dataset.hidden = String(behind);
    const x = ((at.x + 1) / 2) * size.width;
    const y = ((1 - at.y) / 2) * size.height;
    node.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
  });
  return null;
}

export interface StudioSceneProps {
  picture: StudioPicture;
  view: StudioView;
  sun: SunPosition;
  palette: ThemePalette;
  /** The room the bars take at the top and the foot, in CSS pixels: the view frames the rest. */
  free: { readonly top: number; readonly bottom: number };
  still: boolean;
  /** The page's pin label, which the scene keeps over the pin as the camera moves. */
  pinLabel: RefObject<HTMLElement | null>;
  /** What shows where the device cannot draw 3D. */
  fallback: ReactNode;
  /** Filled with what the page's own controls ask of the camera. */
  drive: RefObject<StudioDrive | null>;
  /** Told the scale and the turn each time the camera moves. */
  onMarks: (marks: StudioMarks) => void;
}

/**
 * The studio's one canvas (`T-M05-002a`): the site's ground with its picture, the pin, the real sun
 * for the place and the hour, and a camera that flies between the top view, the 3D view and the
 * side views. It draws only when something changes.
 */
export function StudioScene({
  picture,
  view,
  sun,
  palette,
  free,
  still,
  pinLabel,
  fallback,
  drive,
  onMarks,
}: StudioSceneProps) {
  return (
    <Canvas
      frameloop="demand"
      shadows="soft"
      dpr={[1, 2]}
      camera={CAMERA_START}
      fallback={fallback}
    >
      <color attach="background" args={[palette.canvas]} />
      {/* The far ground fades into the page; the camera rig sets how far, from its own distance. */}
      <fog attach="fog" args={[palette.canvas, CAMERA_START.far, CAMERA_START.far]} />
      <SunLight sun={sun} palette={palette} />
      {picture.kind === 'sky' ? (
        <StudioPictureGround
          pieces={picture.pieces}
          around={picture.around}
          page={palette.canvas}
        />
      ) : (
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[GROUND_M, GROUND_M]} />
          <meshBasicMaterial color={palette['canvas-sunken']} toneMapped={false} />
        </mesh>
      )}
      {picture.kind === 'none' ? (
        <Grid
          position={[0, GRID_LIFT_M, 0]}
          cellSize={1}
          sectionSize={5}
          cellThickness={0.6}
          sectionThickness={1}
          cellColor={palette['line-soft']}
          sectionColor={palette['line-strong']}
          fadeDistance={160}
          fadeStrength={1.5}
          infiniteGrid
        />
      ) : null}
      <mesh rotation-x={-Math.PI / 2} position={[0, RING_LIFT_M, 0]}>
        <ringGeometry args={[RING_INNER_M, RING_OUTER_M, RING_SEGMENTS]} />
        <meshBasicMaterial color={palette.danger} toneMapped={false} />
      </mesh>
      <PinFollower label={pinLabel} />
      <StudioCameraRig
        view={view}
        free={free}
        still={still}
        clear={clearGroundOf(picture)}
        metresPerPixel={picture.kind === 'sky' ? picture.metresPerPixel : null}
        drive={drive}
        onMarks={onMarks}
      />
    </Canvas>
  );
}
