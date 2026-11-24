'use client';
import type { GroundPoint, RoofScene, SceneMotion, StudioView } from '@heliogrid/domain';
import { type ThemePalette, theme } from '@heliogrid/theme';
import { useFrame, useThree } from '@react-three/fiber';
import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { type CanvasTexture, DoubleSide, type Matrix3, type Texture } from 'three';
import { roofGeometries } from './roof-mesh';
import { quietKind, RoofMove } from './StudioRoofMotion';
import { type SceneScreen, screenOfFrame } from './scene-screen';

/** A roof in the top view lies flat on its picture: the marks over it sit where the picture is. */
const FLAT = 0;
/** In 3D every roof stands at its whole height. */
const STANDING = 1;
/** Below this height a rising roof is not drawn: in the top view the picture is the roof. */
const SHOWN_FROM_M = 0.02;
/**
 * How much of the way to its height a roof rises each second: nineteen-twentieths of the way in
 * the emphasised duration — the walls rising from the ground the first time in 3D.
 */
/** A rise that closes its gap at a steady rate is nineteen-twentieths there after three time constants. */
const TIME_CONSTANTS_TO_RISEN = 3;
const MS_PER_SECOND = 1000;
const RISE_PER_SECOND =
  (TIME_CONSTANTS_TO_RISEN * MS_PER_SECOND) / theme.motion.durations.emphasised;
/** A rise this near its end has arrived: a thousandth of the way. */
const SETTLED_M = 1e-3;
/** The ground that takes the roofs' soft shadow, in metres across. */
const SHADOW_GROUND_M = 160;
/** Over your own picture (`StudioOwnGround`), so a roof's shadow falls on it too. */
const SHADOW_LIFT_M = 0.04;
const SHADOW_STRENGTH = 0.32;
/** Walls, and a roof's top where there is no picture: matt plaster. */
const PLASTER_ROUGHNESS = 0.92;

/** Where a point of the model lands on the screen, in CSS pixels; `null` behind the camera. */
export type ScreenOf = (point: GroundPoint, heightM: number) => { x: number; y: number } | null;

/** The page's marks on the model: told each drawn frame where the model now lands on the screen. */
export interface RoofMarksHandle {
  place(screenOf: ScreenOf): void;
  /** A tap on the map, at a point on the page: a length that gave way on an edge there shows. */
  revealAt(x: number, y: number): void;
}

/**
 * How far the roofs have risen, as a share of each one's own height: 0 in the top view, 1 in 3D,
 * rising between them. The marks read it, so a mark sits on the roof's top as the roof rises.
 */
export interface RoofRise {
  current: number;
}

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

/**
 * The picture a roof's top wears: the ground's own texture, laid by ground metres. A cap's corners
 * carry their east and north as their texture places, so one stretch and shift lay the picture on
 * the roof exactly where it lies on the ground.
 */
function topOf(picture: RoofTopPicture): Texture {
  const top = picture.texture.clone();
  if (picture.uv !== undefined) {
    top.matrixAutoUpdate = false;
    top.matrix.copy(picture.uv);
    top.needsUpdate = true;
    return top;
  }
  const across = picture.east - picture.west;
  const along = picture.north - picture.south;
  top.repeat.set(1 / across, 1 / along);
  top.offset.set(-picture.west / across, -picture.south / along);
  top.needsUpdate = true;
  return top;
}

/** The model's height at the rise now: one stretch for every roof; below a hair it is not drawn. */
function standAt(
  node: { scale: { y: number }; visible: boolean; userData: { metres?: number } },
  rise: number,
) {
  const risen = (node.userData.metres ?? 0) * rise;
  node.scale.y = Math.max(rise, SHOWN_FROM_M);
  node.visible = risen >= SHOWN_FROM_M;
}

/**
 * Every roof of the design as two meshes (`T-M05-002`, part e): the walls, parapets and posts in
 * plaster, and the tops and sloped faces wearing the ground's picture. Each height is counted from
 * the ground, so one stretch of the group raises the whole model and nothing on a roof is stretched.
 */
function RoofModel({
  scene,
  map,
  palette,
  rise,
  highest,
  children,
}: {
  scene: RoofScene;
  /** The whole model's highest point: while parts move on their own, the group still stands. */
  highest: number;
  /** The picture the tops wear; `null` on the grid, where a top is plaster. */
  map: Texture | null;
  palette: ThemePalette;
  rise: RoofRise;
  /** The parts moving into a change, drawn in the same risen group. */
  children?: ReactNode;
}) {
  const model = useMemo(() => roofGeometries(scene), [scene]);
  useEffect(
    () => () => {
      model.walls.dispose();
      model.tops.dispose();
    },
    [model],
  );
  return (
    <group
      ref={(group) => {
        if (group !== null) standAt(group, rise.current);
      }}
      name="roofs"
      userData={{ rises: true, metres: Math.max(model.topM, highest) }}
    >
      <mesh geometry={model.walls} castShadow receiveShadow>
        <meshStandardMaterial color={palette['scene-wall']} roughness={PLASTER_ROUGHNESS} />
      </mesh>
      <mesh geometry={model.tops} castShadow receiveShadow>
        {/* A sloped face and an open shed's sheet are seen from under them too. */}
        {map === null ? (
          <meshStandardMaterial
            color={palette['scene-wall']}
            roughness={PLASTER_ROUGHNESS}
            side={DoubleSide}
          />
        ) : (
          <meshBasicMaterial map={map} toneMapped={false} side={DoubleSide} />
        )}
      </mesh>
      {children}
    </group>
  );
}

/** A motion and the model it moves into, with its id: the screen plays each id once. */
type RoofSceneMotion = SceneMotion & { readonly id: number };

/**
 * The motion playing now: a new one starts in 3D (in the top view the roofs lie flat, and
 * nothing moves), runs its time from the frame it is first drawn, and ends — the model whole
 * again — once played.
 */
function usePlayed(
  motion: RoofSceneMotion | null,
  model: RoofScene,
  view: StudioView,
  still: boolean,
  invalidate: () => void,
) {
  // The model the motion moves into: a later model, with no motion of its own, ends it at once.
  const into = useRef<RoofScene | null>(null);
  // biome-ignore lint/plugin: the motion playing is the 3D scene's own animation, as its frame clock is
  const [playing, setPlaying] = useState<RoofSceneMotion | null>(null);
  const started = useRef<number | null>(null);
  const seconds =
    (still ? theme.motion.durations.fade : theme.motion.durations.emphasised) / MS_PER_SECOND;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new motion is its id
  useEffect(() => {
    if (motion === null || view === 'top') return;
    started.current = null;
    into.current = model;
    setPlaying(motion);
    invalidate();
  }, [motion?.id]);
  useEffect(() => {
    if (into.current !== null && model !== into.current) {
      into.current = null;
      setPlaying(null);
    }
  }, [model]);
  useFrame(({ clock }) => {
    if (playing === null) return;
    if (started.current === null) started.current = clock.elapsedTime;
    // Played: one state change takes the moving parts back into the model. Until then each frame
    // asks for the next: the scene draws only when asked.
    if (clock.elapsedTime - started.current >= seconds) setPlaying(null);
    else invalidate();
  });
  return { motion: playing, started, seconds };
}

/**
 * The design's roofs in the scene (`T-M05-002`, part b): in the top view they lie flat, so the
 * picture shows and the page's marks draw them; in 3D they rise to their heights, with walls,
 * the picture on their tops and a soft shadow. Each drawn frame tells the marks where the model
 * lands. Nothing draws unless something changes.
 */
export function StudioRoofs({
  scene: model,
  view,
  still,
  palette,
  top,
  rise,
  sizing,
  marks,
  screen,
  motion,
}: {
  /** The 3D model of the design drawn: the kernel's solids and faces. */
  scene: RoofScene;
  view: StudioView;
  still: boolean;
  palette: ThemePalette;
  /** The sky picture the roofs' tops wear; `null` on the grid. */
  top: RoofTopPicture | null;
  rise: RoofRise;
  /** The share of its new size the model stands at while the first length grows it. */
  sizing: RefObject<number>;
  marks: RefObject<RoofMarksHandle | null>;
  /** Where a scene point lands on the screen, for the camera as it stands in this frame. */
  screen: SceneScreen;
  /** How the model moves into the last change; each is played once, in 3D. */
  motion: RoofSceneMotion | null;
}) {
  const scene = useThree((three) => three.scene);
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
  const invalidate = useThree((three) => three.invalidate);
  const goal = view === 'top' ? FLAT : STANDING;
  // A view picked starts the rise or the fall; the frames carry it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new goal asks for one more frame
  useEffect(() => invalidate(), [goal, invalidate]);

  useFrame((_, delta) => {
    const now = rise.current;
    if (now !== goal) {
      const step = still ? 1 : Math.min(1, delta * RISE_PER_SECOND);
      const next = now + (goal - now) * step;
      rise.current = Math.abs(goal - next) < SETTLED_M ? goal : next;
      scene.traverse((node) => {
        if (node.userData.rises === true) standAt(node, rise.current);
      });
      invalidate();
    }
    // The marks land where this frame draws the model: the camera as its controls just left it.
    const project = screenOfFrame(screen, camera, size);
    marks.current?.place((point, heightM) => {
      // A mark on a roof's top stands at that roof's height, as far risen as the roof.
      const grown = sizing.current;
      return project(point.east * grown, rise.current * heightM, -point.north * grown);
    });
  });

  const map = useMemo(() => (top === null ? null : topOf(top)), [top]);
  useEffect(() => () => map?.dispose(), [map]);
  const playing = usePlayed(motion, model, view, still, invalidate);
  const highest = Math.max(0, ...model.levels.map((level) => level.topM));
  return (
    <>
      <RoofModel
        scene={playing.motion?.still ?? model}
        highest={highest}
        map={map}
        palette={palette}
        rise={rise}
      >
        {playing.motion?.moves.map((move, index) => (
          <RoofMove
            // biome-ignore lint/suspicious/noArrayIndexKey: a motion's moves are fixed while it plays
            key={`${playing.motion?.id}-${index}`}
            move={still ? { ...move, kind: quietKind(move.kind) } : move}
            started={playing.started}
            seconds={playing.seconds}
            palette={palette}
            map={map}
            roughness={PLASTER_ROUGHNESS}
          />
        ))}
      </RoofModel>
      {model.levels.length > 0 ? (
        <mesh rotation-x={-Math.PI / 2} position-y={SHADOW_LIFT_M} receiveShadow>
          <planeGeometry args={[SHADOW_GROUND_M, SHADOW_GROUND_M]} />
          <shadowMaterial opacity={SHADOW_STRENGTH} />
        </mesh>
      ) : null}
    </>
  );
}
