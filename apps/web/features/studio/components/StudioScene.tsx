'use client';
import {
  type PlanShown,
  type StudioPicture,
  type StudioScreen,
  useSceneDetail,
} from '@heliogrid/data/react';
import type { RoofScene, SceneMotion, StudioView, SunPosition } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { Canvas, useFrame } from '@react-three/fiber';
import { type ReactNode, type RefObject, useMemo, useRef, useState } from 'react';
import { deviceHintsNow } from '../hooks/use-device-hints';
import type { SunSkyShown } from '../hooks/use-sun-sky';
import type { SceneFit } from './camera-poses';
import type { RoofTopPicture } from './photo-reader';
import { type ClearGround, StudioCameraRig, type StudioDrive } from './StudioCameraRig';
import { type LidarLayerShown, StudioLidarLayer } from './StudioLidarScan';
import { clearGroundOf } from './StudioPictureGround';
import { StudioPlanLines } from './StudioPlanLines';
import { type RoofMarksHandle, type RoofRise, StudioRoofs } from './StudioRoofs';
import { StudioScaleTween } from './StudioScaleTween';
import { StudioGround } from './StudioSceneGround';
import { StudioSiteShade } from './StudioSiteShade';
import {
  calmSkyOf,
  StudioCalmSky,
  StudioSunLight,
  StudioSunSky,
  shadowRoomOf,
  useSunPath,
} from './StudioSunSky';
import { type SceneScreen, screenOfFrame } from './scene-screen';

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

/** A picture is chosen and its texture not drawn yet: the roofs that will wear it wait, plain. */
const pictureComing = (
  kind: StudioPicture['kind'],
  sharp: RoofTopPicture | null,
  own: RoofTopPicture | null,
) => (kind === 'sky' && sharp === null) || (kind === 'own' && own === null);

/**
 * The colour behind the scene and the haze's: dark while LiDAR is on or the picture comes, the
 * page straight down, the calm sky's horizon in every other view.
 */
function stageOf(palette: ThemePalette, dark: boolean, top: boolean): string {
  if (dark) return palette['scene-shade'];
  return top ? palette.canvas : `#${calmSkyOf(palette).horizon.getHexString()}`;
}

/** The camera before its first view is set: the rig flies it from here. */
const CAMERA_START = { near: 0.5, far: 3_000, position: [0, 60, 60] as [number, number, number] };

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
  fit: SceneFit | null;
  /** A roof closed: the camera frames the roofs once for each new value. */
  frameOn: object | null;
  /** An arrow on the model is held: the camera holds still until it is let go. */
  arrowHeld: boolean;
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
  /**
   * LiDAR (`T-M05-002g`): on, its scan (`null` until built) and the roofs' sunlight; the stage
   * goes dark and the flat picture steps aside for the scan.
   */
  lidar: LidarLayerShown;
  /** The sun bar's sky and the day's path (part g); `null` while the bar is closed. */
  sunSky: SunSkyShown | null;
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
  arrowHeld,
  rise,
  roofMarks,
  plan,
  planGlows,
  screen,
  lidar,
  sunSky,
}: StudioSceneProps) {
  // biome-ignore lint/plugin: the web's WebGL picture of the ground, handed on to the roofs' tops
  const [sharp, setSharp] = useState<RoofTopPicture | null>(null);
  // biome-ignore lint/plugin: your picture's WebGL texture, handed on to the roofs' tops as the sky's is
  const [ownTop, setOwnTop] = useState<RoofTopPicture | null>(null);
  const pictureScale = readScale ?? 1;
  // One picture for the roofs while nothing about it changes: a new one rebuilds every roof.
  const roofTop = useMemo(
    () => roofTopIn(picture.kind, sharp, ownTop, pictureScale),
    [picture.kind, sharp, ownTop, pictureScale],
  );
  // The share of its new size the model stands at while the first length grows it: 1 at rest.
  const sizing = useRef(1);
  // A weak device draws less detail and the same numbers (G034).
  const detail = useSceneDetail(deviceHintsNow());
  const { look } = detail;
  // LiDAR's dark stage, in every mode (owner ruling 2026-11-26): the scan reads against it. While
  // the picture comes the stage is dark too, so the head's white marks read over it; out of the top
  // view the calm sky stands over the ground, and the far ground fades into its horizon.
  const waiting = pictureComing(picture.kind, sharp, ownTop) || picture.kind === 'waiting';
  const skyShown = view !== 'top' && !lidar.on;
  const stage = useMemo(
    () => stageOf(palette, lidar.on || waiting, view === 'top'),
    [palette, lidar.on, waiting, view],
  );
  const sunPath = useSunPath(fit, sunSky);
  const clear = scaledBox(clearGroundOf(picture), pictureScale);
  const shadowRoom = useMemo(
    () => shadowRoomOf(roofScene, pictureScale),
    [roofScene, pictureScale],
  );
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
      <color attach="background" args={[stage]} />
      {/* The far ground fades into the page; the camera rig sets how far, from its own distance. */}
      <fog attach="fog" args={[stage, CAMERA_START.far, CAMERA_START.far]} />
      <StudioSunLight
        key={look.shadowMapPx}
        sun={sun}
        palette={palette}
        shadowMapPx={look.shadowMapPx}
        room={shadowRoom}
        sunOpen={sunSky !== null}
        lidar={lidar.on}
      />
      {skyShown ? <StudioCalmSky palette={palette} /> : null}
      {sunSky === null ? null : (
        <>
          <StudioSunSky
            {...sunSky}
            {...sunPath.room}
            frame={sunPath.frame}
            free={free}
            clear={clear}
            palette={palette}
          />
          {/* LiDAR's scan casts its own shadows: the height map's are not cast twice. */}
          {lidar.on ? null : <StudioSiteShade {...sunSky.shade} />}
        </>
      )}
      <StudioScaleTween scale={readScale} still={still} factor={sizing}>
        <StudioGround
          picture={picture}
          pictureScale={pictureScale}
          palette={palette}
          hidden={lidar.on}
          onSharp={setSharp}
          onOwnTop={setOwnTop}
        />
        {plan !== null && view === 'top' ? (
          <StudioPlanLines
            plan={plan}
            ink={picture.kind === 'none' ? palette['text-primary'] : palette['scene-mark']}
            halo={picture.kind === 'none' ? null : palette['scene-shade']}
            glow={palette['scene-line']}
            glowing={planGlows}
          />
        ) : null}
        <PinFollower label={pinLabel} screen={screen} />
        <StudioRoofs
          scene={roofScene}
          view={view}
          still={still}
          palette={palette}
          top={roofTop}
          pictureComing={pictureComing(picture.kind, sharp, ownTop)}
          rise={rise}
          sizing={sizing}
          marks={roofMarks}
          screen={screen}
          motion={roofMotion}
        />
      </StudioScaleTween>
      <StudioLidarLayer {...lidar} screen={screen} palette={palette} />
      <StudioCameraRig
        view={view}
        free={free}
        still={still}
        heldView={heldView}
        clear={clear}
        metresPerPixel={picture.kind === 'sky' ? picture.metresPerPixel * pictureScale : null}
        drive={drive}
        onTurn={onTurn}
        fit={fit}
        frameOn={frameOn}
        arrowHeld={arrowHeld}
        lidar={lidar.on}
        sun={sunPath.frame}
      />
    </Canvas>
  );
}
