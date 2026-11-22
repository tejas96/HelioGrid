import { describe, expect, it } from 'vitest';
import { sizeCardOnArrival } from '../../src/studio/roof-type';
import { p, run } from './roof-step-run';

describe('Draw on the grid: each corner on a whole metre (T-M05-002c)', () => {
  it('a tap lands on the nearest metre; Alt (the magnet off) draws free', () => {
    const snapped = run([
      { kind: 'draw', magnet: true, grid: true },
      { kind: 'tap', at: p(0.4, -0.3), system: 'metric' },
      { kind: 'tap', at: p(5.6, 0.2), system: 'metric' },
    ]).state;
    expect(snapped.kind === 'drawing' && snapped.corners).toEqual([p(0, 0), p(6, 0)]);
    const free = run([
      { kind: 'draw', magnet: false, grid: true },
      { kind: 'tap', at: p(0.4, -0.3), system: 'metric' },
    ]).state;
    expect(free.kind === 'drawing' && free.corners).toEqual([p(0.4, -0.3)]);
  });

  it('a drawing stopped and taken up again by Undo keeps the grid', () => {
    const { state } = run([
      { kind: 'draw', magnet: true, grid: true },
      { kind: 'tap', at: p(0.4, 0), system: 'metric' },
      { kind: 'cancel' },
      { kind: 'undo_corner' },
      { kind: 'tap', at: p(4.6, 0.2), system: 'metric' },
    ]);
    expect(state.kind === 'drawing' && state.corners).toEqual([p(0, 0), p(5, 0)]);
  });
});

describe('the size card opens by itself once, as the design opens (T-M05-002c)', () => {
  const READY = {
    loaded: true,
    roofs: 0,
    pictureAnswered: true,
    noPicture: true,
    editingSettled: true,
    editable: true,
    top: true,
  };
  it.each([
    ['no picture, no roof, an editor, the top view', {}, 'open'],
    ['the document still loading', { loaded: false }, 'wait'],
    ['the sky picture still on its way', { pictureAnswered: false }, 'wait'],
    ['the edit turn still on its way', { editingSettled: false }, 'wait'],
    ['a sky picture', { noPicture: false }, 'never'],
    ['a roof already there', { roofs: 1 }, 'never'],
    ['a reader', { editable: false }, 'never'],
    ['the 3D view', { top: false }, 'never'],
  ] as const)('%s: %s', (_, change, answer) => {
    expect(sizeCardOnArrival({ ...READY, ...change })).toBe(answer);
  });
});

describe('on the bare grid the metre guides a corner, not the magnet (T-M05-002c)', () => {
  it.each([
    // A side 2° off the grid line follows it; the corner square off it lands on a metre.
    [p(30, 1), p(29.6, 9.2), [p(0, 0), p(30, 0), p(30, 9)]],
    // A side 20° off is the person's own: it keeps its slope, each corner on a whole metre.
    [p(10, 3.6), p(8.7, 7.9), [p(0, 0), p(10, 4), p(9, 8)]],
  ])('taps %j, %j', (second, third, corners) => {
    const { state } = run([
      { kind: 'draw', magnet: true, grid: true },
      { kind: 'tap', at: p(0, 0), system: 'metric' },
      { kind: 'tap', at: second, system: 'metric' },
      { kind: 'tap', at: third, system: 'metric' },
    ]);
    expect(state.kind === 'drawing' && state.corners).toEqual(corners);
  });
});

describe('on the grid a side tapped nearly level stays level (T-M05-002c)', () => {
  // Two taps a little off level fall either side of a half metre: rounding alone tilted the side
  // by a metre, and no ghost corner came. The magnet holds it level first, then the metre.
  it('the second corner holds the first corner’s line, then lands on a whole metre', () => {
    const { state } = run([
      { kind: 'draw', magnet: true, grid: true },
      { kind: 'tap', at: p(0.4, 0.45), system: 'metric' },
      { kind: 'tap', at: p(8.2, 0.62), system: 'metric' },
      { kind: 'tap', at: p(8.3, 6.1), system: 'metric' },
    ]);
    expect(state.kind === 'drawing' && state.corners).toEqual([p(0, 0), p(8, 0), p(8, 6)]);
  });
});
