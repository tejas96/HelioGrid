'use client';
import {
  type PlanShown,
  type StudioPicture,
  type StudioScreen,
  useSceneDetail,
} from '@heliogrid/data/react';
import type { GroundBox, RoofScene, SceneMotion, StudioView, SunPosition } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { Grid } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { type ReactNode, type RefObject, useRef, useState } from 'react';
import { MathUtils } from 'three';
import { deviceHintsNow } from '../hooks/use-device-hints';
import { type ClearGround, StudioCameraRig, type StudioDrive } from './StudioCameraRig';
import { StudioOwnGround } from './StudioOwnGround';
import { clearGroundOf, StudioPictureGround } from './StudioPictureGround';
import { StudioPlanLines } from './StudioPlanLines';
import {
  type RoofMarksHandle,
  type RoofRise,
  type RoofTopPicture,
  StudioRoofs,
} from './StudioRoofs';
import { StudioScaleTween } from './StudioScaleTween';
import { type SceneScreen, screenOfFrame } from './scene-screen';

const RADIANS = MathUtils.DEG2RAD;
/** The plain ground where there is no picture, wide enough that its edge is never seen. */
const GROUND_M = 1_200;
/** How far the sun's light stands from the site, and the ground its shadows cover. */
const SUN_DISTANCE_M = 120;
const SHADOW_HALF_M = 60;

/** A box of ground stretched about the pin, as the picture is by the first true length. */
function scaledBox<B extends ClearGround>(box: B | null, scale: number): B | null {
  if (box === null || scale === 1) return box;
  return {
    ...box,
    west: box.west * scale,
    east: box.east * scale,
    south: box.south * scale,
    north: box.north * scale,
  };
}

/** The picture a roof's top wears, laid where the stretched picture lies. */
const scaledTop = (top: RoofTopPicture, scale: number): RoofTopPicture =>
  scaledBox(top, scale) ?? top;

/** The picture the roofs' tops wear: the sky picture stretched, or your own where it lies. */
function roofTopIn(
  kind: StudioPicture['kind'],
  sharp: RoofTopPicture | null,
  own: RoofTopPicture | null,
  scale: number,
): RoofTopPicture | null {
  if (kind === 'sky') return sharp === null ? null : scaledTop(sharp, scale);
  return kind === 'own' ? own : null;
}

/** The camera before its first view is set: the rig flies it from here. */
const CAMERA_START = { near: 0.5, far: 3_000, position: [0, 60, 60] as [number, number, number] };

/** How high the grid lies over the ground, so the two never fight. */
const GRID_LIFT_M = 0.02;
/** The light: the sky's fill and the sun's strength. */
const SKY_LIGHT = 1.1;
const SUN_LIGHT = 2.4;
/**
 * The sun's light from where the sun stands, casting soft shadows over the site. Its shadow map
 * is as sharp as the view's detail allows; a new size is a new light, as three.js keeps a map once made.
 */
function SunLight({
  sun,
  palette,
  shadowMapPx,
}: {
  sun: SunPosition;
  palette: ThemePalette;
  shadowMapPx: number;
}) {
  const azimuth = sun.azimuthDegrees * RADIANS;
  const elevation = sun.elevationDegrees * RADIANS;
  const across = Math.cos(elevation) * SUN_DISTANCE_M;
  return (
    <>
      <hemisphereLight args={[palette['scene-sky'], palette['scene-ground'], SKY_LIGHT]} />
      <directionalLight
        position={[
          Math.sin(azimuth) * across,
          Math.sin(elevation) * SUN_DISTANCE_M,
          -Math.cos(azimuth) * across,
        ]}
        intensity={SUN_LIGHT}
        castShadow
        shadow-mapSize={[shadowMapPx, shadowMapPx]}
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
 * Keeps the page's pin marker on the pin: each drawn frame puts its tip where the pin lands on the
 * screen, and hides it while the pin is behind the camera. The marker is the page's own, never
 * drawn into the scene.
 */
function PinFollower({
  label,
  screen,
}: {
  label: RefObject<HTMLElement | null>;
  screen: SceneScreen;
}) {
  useFrame(({ camera, size }) => {
    const node = label.current;
    if (node === null) return;
    // The pin's point on the ground, where the marker's tip stands, in the frame being drawn.
    const at = screenOfFrame(screen, camera, size)(0, 0, 0);
    node.dataset.hidden = String(at === null);
    if (at !== null)
      node.style.transform = `translate(-50%, -100%) translate(${at.x}px, ${at.y}px)`;
  });
  return null;
}

/** Hands each drawn frame's gap to the view's detail, which steps down while frames run slow. */
function FrameClock({ onFrame }: { onFrame: (gapMs: number) => void }) {
  useFrame((_, delta) => onFrame(delta * MS_PER_S));
  return null;
}
const MS_PER_S = 1_000;

export interface StudioSceneProps {
  picture: StudioPicture;
  view: StudioView;
  sun: SunPosition;
  palette: ThemePalette;
  /** The room the bars take at the top and the foot, in CSS pixels: the view frames the rest. */
  free: { readonly top: number; readonly bottom: number };
  still: boolean;
  /** The view stays still as the bars change (drawing, Roofs, the picker) while `clear` is in sight. */
  heldView: StudioScreen['heldView'];
  /** The page's pin marker, which the scene keeps on the pin as the camera moves. */
  pinLabel: RefObject<HTMLElement | null>;
  /** What shows where the device cannot draw 3D. */
  fallback: ReactNode;
  /** Filled with what the page's own controls ask of the camera. */
  drive: RefObject<StudioDrive | null>;
  /** Told the view's turn from north up, in radians, each time it changes. */
  onTurn: (turn: number) => void;
  /** The 3D model of the roofs: the design's, or the preview of what is in hand. */
  roofScene: RoofScene;
  /** How the model moves into the last change. */
  roofMotion: (SceneMotion & { readonly id: number }) | null;
  /** How much the picture is stretched about the pin to its true size. */
  /** `null` until the design is read: its stored stretch then lands, never grown into. */
  pictureScale: number | null;
  /** The roofs' ground, which the view frames; `null` before a roof. */
  fit: GroundBox | null;
  /** A roof closed: the camera frames the roofs once for each new value. */
  frameOn: object | null;
  /** The height the roofs stand at now, shared with the page's marks. */
  rise: RoofRise;
  /** The page's marks on the roofs, told each frame where the model lands. */
  roofMarks: RefObject<RoofMarksHandle | null>;
  /** The plan over the ground (`T-M05-002d`), drawn in the top view alone; `null` with none. */
  plan: PlanShown | null;
  /** Its closed outlines glow: it rests, unlocked, and a tap makes a roof. */
  planGlows: boolean;
  /** Where a scene point lands on the screen: every mark on the model is placed through it. */
  screen: SceneScreen;
}

/**
 * The studio's one canvas (`T-M05-002a`): the site's ground with its picture, the pin, the real sun
 * for the place and the hour, and a camera that flies between the top view, the 3D view and the
 * side views. It draws only when something changes, and as much detail as the device keeps smooth.
 */
export function StudioScene({
  picture,
  view,
  sun,
  palette,
  free,
  still,
  heldView,
  pinLabel,
  fallback,
  drive,
  onTurn,
  roofScene,
  roofMotion,
  pictureScale: readScale,
  fit,
  frameOn,
  rise,
  roofMarks,
  plan,
  planGlows,
  screen,
}: StudioSceneProps) {
  // biome-ignore lint/plugin: the web's WebGL picture of the ground, handed on to the roofs' tops
  const [sharp, setSharp] = useState<RoofTopPicture | null>(null);
  // biome-ignore lint/plugin: your picture's WebGL texture, handed on to the roofs' tops as the sky's is
  const [ownTop, setOwnTop] = useState<RoofTopPicture | null>(null);
  const pictureScale = readScale ?? 1;
  // The share of its new size the model stands at while the first length grows it: 1 at rest.
  const sizing = useRef(1);
  // A weak device draws less detail and the same numbers (G034).
  const detail = useSceneDetail(deviceHintsNow());
  const { look } = detail;
  return (
    <Canvas
      frameloop="demand"
      shadows={look.softShadows ? 'soft' : 'basic'}
      dpr={[1, look.maxPixelRatio]}
      camera={CAMERA_START}
      fallback={fallback}
      data-scene-detail={detail.detail}
    >
      <FrameClock onFrame={detail.frameDrawn} />
      <color attach="background" args={[palette.canvas]} />
      {/* The far ground fades into the page; the camera rig sets how far, from its own distance. */}
      <fog attach="fog" args={[palette.canvas, CAMERA_START.far, CAMERA_START.far]} />
      <SunLight key={look.shadowMapPx} sun={sun} palette={palette} shadowMapPx={look.shadowMapPx} />
      <StudioScaleTween scale={readScale} still={still} factor={sizing}>
        {picture.kind === 'sky' ? (
          // The first true length stretches the picture about the pin with every roof on it.
          <group scale={[pictureScale, 1, pictureScale]}>
            <StudioPictureGround
              pieces={picture.pieces}
              around={picture.around}
              page={palette.canvas}
              onSharp={setSharp}
            />
          </group>
        ) : (
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[GROUND_M, GROUND_M]} />
            <meshBasicMaterial color={palette['canvas-sunken']} toneMapped={false} />
          </mesh>
        )}
        {picture.kind === 'own' ? (
          <StudioOwnGround picture={picture} plaster={palette['scene-wall']} onTop={setOwnTop} />
        ) : null}
        {plan !== null && view === 'top' ? (
          <StudioPlanLines
            plan={plan}
            ink={picture.kind === 'none' ? palette['text-primary'] : palette['scene-mark']}
            halo={picture.kind === 'none' ? null : palette['scene-shade']}
            glow={palette['scene-line']}
            glowing={planGlows}
          />
        ) : null}
        {/* No picture: the grid is the ground. Your own picture lies on it, and it shows round it. */}
        {picture.kind === 'none' || picture.kind === 'own' ? (
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
        <PinFollower label={pinLabel} screen={screen} />
        <StudioRoofs
          scene={roofScene}
          view={view}
          still={still}
          palette={palette}
          top={roofTopIn(picture.kind, sharp, ownTop, pictureScale)}
          rise={rise}
          sizing={sizing}
          marks={roofMarks}
          screen={screen}
          motion={roofMotion}
        />
      </StudioScaleTween>
      <StudioCameraRig
        view={view}
        free={free}
        still={still}
        heldView={heldView}
        clear={scaledBox(clearGroundOf(picture), pictureScale)}
        metresPerPixel={picture.kind === 'sky' ? picture.metresPerPixel * pictureScale : null}
        drive={drive}
        onTurn={onTurn}
        fit={fit}
        frameOn={frameOn}
      />
    </Canvas>
  );
}
