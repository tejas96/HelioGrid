'use client';
import type { GroundPoint, Roof, StudioView } from '@heliogrid/domain';
import { type ThemePalette, theme } from '@heliogrid/theme';
import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo } from 'react';
import { type CanvasTexture, ExtrudeGeometry, Shape, type Texture, Vector3 } from 'three';

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
const SHADOW_LIFT_M = 0.005;
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
}

/**
 * The picture a roof's top wears: the ground's own texture, laid by ground metres. A cap's corners
 * carry their east and north as their texture places, so one stretch and shift lay the picture on
 * the roof exactly where it lies on the ground.
 */
function topOf(picture: RoofTopPicture): Texture {
  const top = picture.texture.clone();
  const across = picture.east - picture.west;
  const along = picture.north - picture.south;
  top.repeat.set(1 / across, 1 / along);
  top.offset.set(-picture.west / across, -picture.south / along);
  top.needsUpdate = true;
  return top;
}

/** A roof block's height in metres at the rise now; below a hair it is not drawn. */
function standAt(
  node: { scale: { y: number }; visible: boolean; userData: { metres?: number } },
  rise: number,
) {
  const metres = (node.userData.metres ?? 0) * rise;
  node.scale.y = Math.max(metres, SHOWN_FROM_M);
  node.visible = metres >= SHOWN_FROM_M;
}

function outlineOf(corners: readonly GroundPoint[]): Shape {
  const shape = new Shape();
  corners.forEach((corner, i) => {
    if (i === 0) shape.moveTo(corner.east, corner.north);
    else shape.lineTo(corner.east, corner.north);
  });
  shape.closePath();
  return shape;
}

/**
 * One roof standing on the ground: plaster walls and a plaster top. In the top view it lies flat
 * and the picture shows through; the picture on its top in 3D comes with the roof's close.
 */
function RoofBlock({
  roof,
  metres,
  top,
  palette,
  rise,
}: {
  roof: Roof;
  /** The roof's height: its own, or the market's storey height. */
  metres: number;
  /** The picture its top wears; `null` on the grid, where the top is plaster. */
  top: RoofTopPicture | null;
  palette: ThemePalette;
  rise: RoofRise;
}) {
  const geometry = useMemo(
    () => new ExtrudeGeometry(outlineOf(roof.corners), { depth: 1, bevelEnabled: false }),
    [roof.corners],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const map = useMemo(() => (top === null ? null : topOf(top)), [top]);
  useEffect(() => () => map?.dispose(), [map]);
  return (
    <group
      // The block is one metre tall: its group stretches it to the roof's height at the rise now.
      ref={(group) => {
        if (group !== null) standAt(group, rise.current);
      }}
      name="roof"
      userData={{ rises: true, metres }}
    >
      <mesh geometry={geometry} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        {/* The extruded shape's first group is its two caps, the second its walls. */}
        {map === null ? (
          <meshStandardMaterial
            attach="material-0"
            color={palette['scene-wall']}
            roughness={PLASTER_ROUGHNESS}
          />
        ) : (
          <meshBasicMaterial attach="material-0" map={map} toneMapped={false} />
        )}
        <meshStandardMaterial
          attach="material-1"
          color={palette['scene-wall']}
          roughness={PLASTER_ROUGHNESS}
        />
      </mesh>
    </group>
  );
}

/**
 * The design's roofs in the scene (`T-M05-002`, part b): in the top view they lie flat, so the
 * picture shows and the page's marks draw them; in 3D they rise to the storey height, with walls,
 * the picture on their tops and a soft shadow. Each drawn frame tells the marks where the model
 * lands. Nothing draws unless something changes.
 */
export function StudioRoofs({
  roofs,
  view,
  still,
  palette,
  heights,
  storeyHeightM,
  top,
  rise,
  sizing,
  marks,
}: {
  roofs: readonly Roof[];
  view: StudioView;
  still: boolean;
  palette: ThemePalette;
  /** Each roof's height in metres, in the order of `roofs`. */
  heights: readonly number[];
  /** The market's storey height: a roof with no height of its own stands at it. */
  storeyHeightM: number;
  /** The sky picture the roofs' tops wear; `null` on the grid. */
  top: RoofTopPicture | null;
  rise: RoofRise;
  /** The share of its new size the model stands at while the first length grows it. */
  sizing: RefObject<number>;
  marks: RefObject<RoofMarksHandle | null>;
}) {
  const scene = useThree((three) => three.scene);
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
  const invalidate = useThree((three) => three.invalidate);
  const goal = view === 'top' ? FLAT : STANDING;
  // A view picked starts the rise or the fall; the frames carry it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new goal asks for one more frame
  useEffect(() => invalidate(), [goal, invalidate]);

  const at = useMemo(() => new Vector3(), []);
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
    marks.current?.place((point, heightM) => {
      // A mark on a roof's top stands at that roof's height, as far risen as the roof.
      const grown = sizing.current;
      at.set(point.east * grown, rise.current * heightM, -point.north * grown).project(camera);
      if (at.z > 1) return null;
      return { x: ((at.x + 1) / 2) * size.width, y: ((1 - at.y) / 2) * size.height };
    });
  });

  return (
    <>
      {roofs.map((roof, index) => (
        <RoofBlock
          key={roof.id}
          roof={roof}
          metres={heights[index] ?? storeyHeightM}
          top={top}
          palette={palette}
          rise={rise}
        />
      ))}
      {roofs.length > 0 ? (
        <mesh rotation-x={-Math.PI / 2} position-y={SHADOW_LIFT_M} receiveShadow>
          <planeGeometry args={[SHADOW_GROUND_M, SHADOW_GROUND_M]} />
          <shadowMaterial opacity={SHADOW_STRENGTH} />
        </mesh>
      ) : null}
    </>
  );
}
