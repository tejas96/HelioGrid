'use client';
import type { SceneMove, SceneMoveKind } from '@heliogrid/domain';
import { type ThemePalette, theme } from '@heliogrid/theme';
import { useFrame } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import { DoubleSide, type Group, type Material, type Texture } from 'three';
import { roofGeometries } from './roof-mesh';

/**
 * The 3D model moving into a change (`T-M05-002`, part e, plan step S18): each part that moves is
 * drawn on its own while the move plays — rising from the roof it stands on, growing from the
 * ground, shrinking away, folding up, turning, sinking, lifting or fading — then the model is
 * whole again. Under reduced motion each move is a short fade. The scene animates in its own code,
 * from the motion tokens (`.claude/rules/ui-adherence.md`, Motion).
 */

/** OneOhm's `enter` curve: a cubic bezier from (0, 0) to (1, 1), sampled by its time. */
const [X1, Y1, X2, Y2] = theme.motion.easings.enter;
const BEZIER_STEPS = 12;

/** A cubic's middle weights: three ways to pick one of the two middle points. */
const MIDDLE_WEIGHT = 3;
/** A part is never drawn flat to nothing: three.js cannot turn a zero scale back. */
const SMALLEST_SCALE = 1e-3;

function bezier(a: number, b: number, t: number): number {
  const u = 1 - t;
  return MIDDLE_WEIGHT * u * u * t * a + MIDDLE_WEIGHT * u * t * t * b + t * t * t;
}

/** The eased share at a share of the time: the curve's x solved for t, then its y. */
export function eased(time: number): number {
  if (time <= 0) return 0;
  if (time >= 1) return 1;
  let low = 0;
  let high = 1;
  for (let step = 0; step < BEZIER_STEPS; step += 1) {
    const mid = (low + high) / 2;
    if (bezier(X1, X2, mid) < time) low = mid;
    else high = mid;
  }
  return bezier(Y1, Y2, (low + high) / 2);
}

/** Under reduced motion a move only fades: in where a part arrives, out where it leaves. */
const LEAVING: ReadonlySet<SceneMoveKind> = new Set(['shrink', 'sink', 'fade_out']);
export const quietKind = (kind: SceneMoveKind): SceneMoveKind =>
  LEAVING.has(kind) ? 'fade_out' : 'fade_in';

const QUARTER_TURN = Math.PI / 2;

/** One move's group, at a share `s` of the way: scaled, turned or faded about its pivot. */
function placeAt(group: Group, move: SceneMove, s: number, materials: readonly Material[]) {
  // In the scene east is x, up is y and north is −z.
  const pivot = { x: move.pivot.east, y: move.pivot.up, z: -move.pivot.north };
  const leaving = LEAVING.has(move.kind);
  const at = leaving ? 1 - s : s;
  const lift = Math.max(at, SMALLEST_SCALE);
  group.scale.set(1, 1, 1);
  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  let opacity = 1;
  switch (move.kind) {
    case 'rise':
    case 'fold':
    case 'sink':
    case 'lift':
      group.scale.y = lift;
      group.position.y = pivot.y * (1 - lift);
      break;
    case 'grow':
    case 'shrink':
      group.scale.setScalar(lift);
      group.position.set(pivot.x * (1 - lift), pivot.y * (1 - lift), pivot.z * (1 - lift));
      break;
    case 'turn': {
      const angle = -QUARTER_TURN * (1 - at);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      group.rotation.y = angle;
      // About the pivot's upright line: the group's origin is turned round it.
      group.position.set(
        pivot.x - (cos * pivot.x + sin * pivot.z),
        0,
        pivot.z - (-sin * pivot.x + cos * pivot.z),
      );
      break;
    }
    default:
      opacity = at;
  }
  for (const material of materials) material.opacity = opacity;
}

/**
 * One moving part of the model, played from `started` (the frame clock, in seconds) over
 * `seconds`. It stays at its end once played: the model takes it back on the next render.
 */
export function RoofMove({
  move,
  started,
  seconds,
  palette,
  map,
  roughness,
}: {
  move: SceneMove;
  started: RefObject<number | null>;
  seconds: number;
  palette: ThemePalette;
  /** The picture the tops wear; `null` on the grid. */
  map: Texture | null;
  roughness: number;
}) {
  const group = useRef<Group>(null);
  const model = useMemo(() => roofGeometries(move.parts), [move.parts]);
  useEffect(
    () => () => {
      model.walls.dispose();
      model.tops.dispose();
    },
    [model],
  );
  const materials = useRef<Material[]>([]);
  const fades = move.kind === 'fade_in' || move.kind === 'fade_out';
  useFrame(({ clock, invalidate }) => {
    const node = group.current;
    if (node === null) return;
    // The first frame, before the clock is read, draws the move at its start.
    const from = started.current ?? clock.elapsedTime;
    const s = eased((clock.elapsedTime - from) / seconds);
    placeAt(node, move, s, materials.current);
    if (s < 1) invalidate();
  });
  const keep = (material: Material | null) => {
    if (material !== null && !materials.current.includes(material))
      materials.current.push(material);
  };
  return (
    <group ref={group}>
      <mesh geometry={model.walls} castShadow receiveShadow>
        <meshStandardMaterial
          ref={keep}
          color={palette['scene-wall']}
          roughness={roughness}
          transparent={fades}
        />
      </mesh>
      <mesh geometry={model.tops} castShadow receiveShadow>
        {map === null ? (
          <meshStandardMaterial
            ref={keep}
            color={palette['scene-wall']}
            roughness={roughness}
            side={DoubleSide}
            transparent={fades}
          />
        ) : (
          <meshBasicMaterial
            ref={keep}
            map={map}
            toneMapped={false}
            side={DoubleSide}
            transparent={fades}
          />
        )}
      </mesh>
    </group>
  );
}
