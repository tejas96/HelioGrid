'use client';
import type { PlanShown } from '@heliogrid/data/react';
import { Line } from '@react-three/drei';
import { useMemo } from 'react';

/**
 * The plan over the ground (`T-M05-002d`, board 4.1–4.8): its lines, sharp at every zoom — the same
 * width on the screen however near the camera comes — laid where the document lays it, as see-through as its card
 * says. Its closed outlines glow while the plan rests, so a tap makes the roof. A hidden plan draws
 * nothing; a plan is a drawing aid, never in 3D.
 */

const HALF_TURN_DEG = 180;
const DEGREES = Math.PI / HALF_TURN_DEG;
const PERCENT = 100;
/** The plan lies over the ground's pictures, under every roof: its halo, then its lines, then the glow. */
const HALO_ORDER = 3;
const PLAN_ORDER = 4;
const GLOW_ORDER = 5;
/** A line's width on the screen, in CSS pixels, at every zoom; its halo and a glowing outline are wider. */
const LINE_PX = 2;
const HALO_PX = 4;
const GLOW_PX = 3;
/** On a picture each line keeps a dark halo this strong, so it reads on any roof (board 4.1–4.8). */
const HALO_SHARE = 0.55;
/** The plan lies a hair above the ground, so no picture ever covers a line. */
const LIFT_M = 0.02;

/** Every segment of these lines, two points each, in the plan's own units on the ground's plane. */
function segmentsOf(lines: PlanShown['lines']['lines']): [number, number, number][] {
  const at: [number, number, number][] = [];
  for (const { points, closed } of lines) {
    const count = points.length / 2;
    const ends = closed ? count : count - 1;
    for (let i = 0; i < ends; i++) {
      const j = (i + 1) % count;
      at.push([points[2 * i] as number, 0, -(points[2 * i + 1] as number)]);
      at.push([points[2 * j] as number, 0, -(points[2 * j + 1] as number)]);
    }
  }
  return at;
}

export function StudioPlanLines({
  plan,
  ink,
  halo,
  glow,
  glowing,
}: {
  plan: PlanShown;
  /**
   * The line's colour, its halo's and the glow's, from the theme's tokens: on a picture white lines
   * over a dark halo; on the bare grid ink lines and no halo (`halo` null).
   */
  ink: string;
  halo: string | null;
  glow: string;
  /** Its closed outlines glow: the plan rests on the house and is not locked. */
  glowing: boolean;
}) {
  const all = useMemo(() => segmentsOf(plan.lines.lines), [plan.lines]);
  const outlines = useMemo(
    () => segmentsOf(plan.lines.lines.filter((line) => line.closed)),
    [plan.lines],
  );
  const { laid } = plan;
  if (laid.hidden) return null;
  const opacity = laid.seeThrough / PERCENT;
  return (
    <group
      position={[laid.at.east, LIFT_M, -laid.at.north]}
      rotation-y={-laid.turnDeg * DEGREES}
      scale={[laid.metresPerUnit, 1, laid.metresPerUnit]}
    >
      {all.length === 0 || halo === null ? null : (
        <Line
          points={all}
          segments
          lineWidth={HALO_PX}
          color={halo}
          transparent
          opacity={opacity * HALO_SHARE}
          depthTest={false}
          toneMapped={false}
          renderOrder={HALO_ORDER}
        />
      )}
      {all.length === 0 ? null : (
        <Line
          points={all}
          segments
          lineWidth={LINE_PX}
          color={ink}
          transparent
          opacity={opacity}
          depthTest={false}
          toneMapped={false}
          renderOrder={PLAN_ORDER}
        />
      )}
      {glowing && outlines.length > 0 ? (
        <Line
          points={outlines}
          segments
          lineWidth={GLOW_PX}
          color={glow}
          transparent
          opacity={opacity}
          depthTest={false}
          toneMapped={false}
          renderOrder={GLOW_ORDER}
        />
      ) : null}
    </group>
  );
}
