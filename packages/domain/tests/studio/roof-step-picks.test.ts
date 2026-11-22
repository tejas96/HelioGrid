import { describe, expect, it } from 'vitest';
import { dragBeforeOf, handlesRoofOf, heldCircleOf } from '../../src/studio/roof-step-view';
import { CLOSE, drawn, p, RECTANGLE, run } from './roof-step-run';

describe('a corner drag that keeps a set length shows its circle (T-M05-002)', () => {
  it('runs round the far end of the set edge, at its length', () => {
    const sized = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'type', entry: { main: '8', inches: '', measured: false } },
      { kind: 'set', system: 'metric' },
    ]).document;
    // Corner 1 ends the set edge 0: its drag keeps 8 m round corner 0.
    const { state } = run(
      [
        {
          kind: 'grab',
          grip: { kind: 'corner', roof: 0, corner: 1 },
          at: p(8, 0),
          system: 'metric',
          magnet: true,
        },
        { kind: 'drag', at: p(7, 2) },
      ],
      sized,
    );
    expect(heldCircleOf(state)).toEqual({ centre: p(0, 0), metres: expect.closeTo(8, 6) });
    expect(heldCircleOf(run([], sized).state)).toBeNull();
    // An allowed corner drag draws no shape behind it; a turn draws where it started.
    expect(dragBeforeOf(state)).toBeNull();
    const turning = run(
      [
        {
          kind: 'grab',
          grip: { kind: 'turn', roof: 0 },
          at: p(9, 3),
          system: 'metric',
          magnet: true,
        },
        { kind: 'drag', at: p(9, 5) },
      ],
      sized,
    ).state;
    expect(dragBeforeOf(turning)).toEqual(sized.roofs[0]?.corners);
  });
});

describe('the picked roof: its + dots and handles show, the others keep their corners (T-M05-002)', () => {
  const two = run(
    [
      { kind: 'draw', magnet: true },
      { kind: 'tap', at: p(20, 0), system: 'metric' },
      { kind: 'tap', at: p(26, 0), system: 'metric' },
      { kind: 'tap', at: p(26, 5), system: 'metric' },
      { kind: 'tap', at: p(20, 5), system: 'metric' },
      { ...CLOSE, id: 'roof-2' },
    ],
    drawn,
  );

  it('the roof just closed is picked; a tap inside another picks it; open ground picks none', () => {
    expect(handlesRoofOf(two.state, two.document)).toBe(1);
    const tapped = run([{ kind: 'tap', at: p(4, 3), system: 'metric' }], two.document);
    expect(handlesRoofOf(tapped.state, two.document)).toBe(0);
    const away = run([{ kind: 'tap', at: p(50, 50), system: 'metric' }], two.document);
    expect(handlesRoofOf(away.state, two.document)).toBeNull();
  });

  it('a roof Undo took away is picked no more: the lone roof left shows them', () => {
    // The second roof was picked when it closed; the design without it is the first alone.
    expect(handlesRoofOf(two.state, drawn)).toBe(0);
  });

  it('Cancel and a tap with a corner picked keep the roof picked', () => {
    const picked = run(
      [
        { kind: 'tap', at: p(4, 3), system: 'metric' },
        { kind: 'pick_corner', corner: { roof: 0, corner: 1 } },
        { kind: 'tap', at: p(50, 50), system: 'metric' },
      ],
      two.document,
    );
    expect(handlesRoofOf(picked.state, two.document)).toBe(0);
    const cancelled = run(
      [{ kind: 'tap', at: p(4, 3), system: 'metric' }, { kind: 'cancel' }],
      two.document,
    );
    expect(handlesRoofOf(cancelled.state, two.document)).toBe(0);
  });

  it('a lone roof always shows them; a drag keeps its roof picked after it ends', () => {
    expect(handlesRoofOf(run([], drawn).state, drawn)).toBe(0);
    const moved = run(
      [
        {
          kind: 'grab',
          grip: { kind: 'corner', roof: 0, corner: 2 },
          at: p(8, 6),
          system: 'metric',
          magnet: true,
        },
        { kind: 'drag', at: p(8.5, 6.5) },
        { kind: 'release' },
      ],
      two.document,
    );
    expect(handlesRoofOf(moved.state, moved.document)).toBe(0);
  });
});

describe('Undo and Redo: the bar names them, the roof stays picked (T-M05-002)', () => {
  it.each([
    [true, 'undone'],
    [false, 'redone'],
  ] as const)('undone %s: %s', (undone, kind) => {
    const { state } = run(
      [
        { kind: 'tap', at: p(4, 3), system: 'metric' },
        { kind: 'history', undone },
      ],
      drawn,
    );
    expect(state).toEqual({ kind: 'idle', roof: 0, picked: null, said: { kind } });
  });
});

describe('a removed corner says where it stood, to shrink away there (T-M05-002)', () => {
  it('the × on a picked corner', () => {
    const { state } = run(
      [{ kind: 'pick_corner', corner: { roof: 0, corner: 2 } }, { kind: 'remove_corner' }],
      drawn,
    );
    expect(state.kind === 'idle' && state.said).toEqual({ kind: 'corner_removed', at: p(8, 6) });
  });
});
