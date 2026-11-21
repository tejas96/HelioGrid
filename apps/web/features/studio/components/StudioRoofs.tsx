'use client';
import type { GroundPoint, Roof, StudioView } from '@heliogrid/domain';
import type { ThemePalette } from '@heliogrid/theme';
import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo } from 'react';
import { ExtrudeGeometry, Shape, Vector3 } from 'three';

/** A roof in the top view lies flat on its picture: the marks over it sit where the picture is. */
const FLAT_M = 0;
/** Below this height a rising roof is not drawn: in the top view the picture is the roof. */
const SHOWN_FROM_M = 0.02;
/** How much of the way to its height a roof rises each second: about a quarter second's rise. */
const RISE_PER_SECOND = 12;
/** A rise this near its height has arrived: a millimetre. */
const SETTLED_M = 1e-3;
/** The ground that takes the roofs' soft shadow, in metres across. */
const SHADOW_GROUND_M = 160;
const SHADOW_LIFT_M = 0.005;
const SHADOW_STRENGTH = 0.32;
/** Walls, and a roof's top where there is no picture: matt plaster. */
const PLASTER_ROUGHNESS = 0.92;

/** Where a point of the model lands on the screen, in CSS pixels; `null` behind the camera. */
export type ScreenOf = (point: GroundPoint, onTop: boolean) => { x: number; y: number } | null;

/** The page's marks on the model: told each drawn frame where the model now lands on the screen. */
export interface RoofMarksHandle {
  place(screenOf: ScreenOf): void;
}

/**
 * The height the roofs stand at now: 0 in the top view, the storey in 3D, rising between them.
 * The marks read it, so a dot sits on the roof's top corner as the roof rises.
 */
export interface RoofRise {
  current: number;
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
function RoofBlock({ roof, palette, rise }: { roof: Roof; palette: ThemePalette; rise: RoofRise }) {
  const geometry = useMemo(
    () => new ExtrudeGeometry(outlineOf(roof.corners), { depth: 1, bevelEnabled: false }),
    [roof.corners],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group
      // The block is one metre tall: its group stretches it to the height the roofs stand at.
      ref={(group) => {
        if (group === null) return;
        group.scale.y = Math.max(rise.current, SHOWN_FROM_M);
        group.visible = rise.current >= SHOWN_FROM_M;
      }}
      name="roof"
      userData={{ rises: true }}
    >
      <mesh geometry={geometry} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        {/* The extruded shape's first group is its two caps, the second its walls. */}
        <meshStandardMaterial
          attach="material-0"
          color={palette['scene-wall']}
          roughness={PLASTER_ROUGHNESS}
        />
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
  storeyHeightM,
  rise,
  marks,
}: {
  roofs: readonly Roof[];
  view: StudioView;
  still: boolean;
  palette: ThemePalette;
  /** The market's storey height, which the roofs rise to in 3D. */
  storeyHeightM: number;
  rise: RoofRise;
  marks: RefObject<RoofMarksHandle | null>;
}) {
  const scene = useThree((three) => three.scene);
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
  const invalidate = useThree((three) => three.invalidate);
  const goal = view === 'top' ? FLAT_M : storeyHeightM;
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
        if (node.userData.rises !== true) return;
        node.scale.y = Math.max(rise.current, SHOWN_FROM_M);
        node.visible = rise.current >= SHOWN_FROM_M;
      });
      invalidate();
    }
    marks.current?.place((point, onTop) => {
      at.set(point.east, onTop ? rise.current : 0, -point.north).project(camera);
      if (at.z > 1) return null;
      return { x: ((at.x + 1) / 2) * size.width, y: ((1 - at.y) / 2) * size.height };
    });
  });

  return (
    <>
      {roofs.map((roof) => (
        <RoofBlock key={roof.id} roof={roof} palette={palette} rise={rise} />
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
