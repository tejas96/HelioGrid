import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { penCrossOf } from '../../src/studio/roof-pen-cross';
import { drawing } from '../../src/studio/roof-step-draw';
import type { RoofStepState } from '../../src/studio/roof-step-state';

/**
 * The pen's cross (`T-M05-002`, part b): while a roof is drawn, two faint lines through the pen,
 * across the whole map — along the roof's long side and square to it — so a corner is lined up
 * with an earlier one by eye. It is not the magnet: it shows with the magnet on or off.
 */

const at = (east: number, north: number): GroundPoint => ({ east, north });
const drawn = (
  corners: GroundPoint[],
  pointer: GroundPoint | null,
  magnet = true,
): RoofStepState => {
  const state = drawing(magnet, corners);
  if (state.kind !== 'drawing') throw new Error('not drawing');
  return { ...state, pointer };
};
const ways = (state: RoofStepState) =>
  penCrossOf(state).map(({ way }) => [
    Number(way.east.toFixed(6)) + 0,
    Number(way.north.toFixed(6)) + 0,
  ]);

describe('the pen’s cross', () => {
  it.each([
    [
      'no corner yet: along the map',
      [],
      [
        [1, 0],
        [0, 1],
      ],
    ],
    [
      'a side drawn east: along it and square to it',
      [at(0, 0), at(10, 0)],
      [
        [1, 0],
        [0, 1],
      ],
    ],
    [
      'a side drawn at a slant: turned with it',
      [at(0, 0), at(3, 4)],
      [
        [0.6, 0.8],
        [-0.8, 0.6],
      ],
    ],
  ] as const)('%s', (_why, corners, expected) => {
    expect(ways(drawn([...corners], at(5, 5)))).toEqual(expected);
  });

  it('runs through the pen', () => {
    const cross = penCrossOf(drawn([at(0, 0), at(10, 0)], at(5, 5)));
    expect(cross.every(({ through }) => through.east === 5 && through.north === 5)).toBe(true);
  });

  it('shows with the magnet off too', () => {
    expect(penCrossOf(drawn([at(0, 0), at(10, 0)], at(5, 5), false))).toHaveLength(2);
  });

  it.each([
    ['the pen off the map', drawn([at(0, 0)], null)],
    ['not drawing', { kind: 'idle', picked: null, roof: null } as unknown as RoofStepState],
  ] as const)('none: %s', (_why, state) => {
    expect(penCrossOf(state)).toEqual([]);
  });
});

describe('a held guide near an arm stands for it', () => {
  const state = drawn([at(0, 0), at(10, 0)], at(10, 4));
  const deg = (d: number) => at(Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180));
  const withGuide = (way: GroundPoint, soft: boolean): RoofStepState =>
    state.kind !== 'drawing'
      ? state
      : {
          ...state,
          spot: {
            point: at(10, 4),
            snap: null,
            guides: [{ through: at(10, 4), way, ...(soft ? { soft: true as const } : {}) }],
          },
        };
  it.each([
    ['14.9° off the long side: that arm goes', 14.9, false, 1],
    ['15° off: that arm goes', 15, false, 1],
    ['15.1° off: both stay', 15.1, false, 2],
    ['a faint guide along the arm: both stay', 0, true, 2],
  ] as const)('%s', (_why, degrees, soft, arms) => {
    expect(penCrossOf(withGuide(deg(degrees), soft))).toHaveLength(arms);
  });
});
