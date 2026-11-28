import type { GroundPoint } from './ground';
import { fullSpanOf, type GuideSpan } from './roof-guide-spans';
import type { Guide } from './roof-snap';
import { longSideOf } from './roof-snap-spot';
import type { RoofStepState } from './roof-step-state';

/** A held guide within this many degrees of a cross arm stands for it: the arm goes. */
export const CROSS_COVERED_DEGREES = 15;

/**
 * The pen's cross (`T-M05-002`, part b): while a roof is drawn, two faint lines through where the
 * next corner would land, across the whole map — along the roof's long side and square to it, or
 * along the map before a side is drawn — so the corner is lined up with an earlier one by eye. It
 * is not the magnet and pulls nothing: it shows with the magnet on or off.
 */
export function penCrossOf(state: RoofStepState): readonly Guide[] {
  if (state.kind !== 'drawing' || state.pointer === null) return [];
  const through = state.spot?.point ?? state.pointer;
  const along = longSideOf(state.corners) ?? { east: 1, north: 0 };
  // An arm a held guide already draws, or nearly, goes: two lines a few degrees apart through one
  // spot read as a mistake, and the guide is the exact one.
  const held = (state.spot?.guides ?? []).filter((guide) => guide.soft !== true);
  const covered = (way: GroundPoint) =>
    held.some((guide) => {
      const cos = Math.abs(way.east * guide.way.east + way.north * guide.way.north);
      return cos >= Math.cos((CROSS_COVERED_DEGREES * Math.PI) / 180);
    });
  return [along, { east: -along.north, north: along.east }]
    .filter((way) => !covered(way))
    .map((way) => ({ through, way }));
}

/** The pen's cross as drawn: each arm right across the map. */
export function penCrossSpansOf(state: RoofStepState): readonly GuideSpan[] {
  return penCrossOf(state).map(fullSpanOf);
}
