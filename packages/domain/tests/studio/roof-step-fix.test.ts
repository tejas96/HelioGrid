import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import { ROOF_STEP_START } from '../../src/studio/roof-step-state';
import { roofBarOf } from '../../src/studio/roof-step-view';
import { drawn, p, run } from './roof-step-run';

describe('the roof step: fixing the shape', () => {
  it('a corner drag is one change, with the magnet’s name', () => {
    const { commits, state } = run(
      [
        {
          kind: 'grab',
          grip: { kind: 'corner', roof: 0, corner: 2 },
          at: p(8, 6),
          system: 'metric',
        },
        { kind: 'drag', at: p(9.5, 7) },
        { kind: 'drag', at: p(8.3, 6.2) },
        { kind: 'release' },
      ],
      drawn,
    );
    expect(commits).toBe(1);
    expect(state).toMatchObject({
      said: { kind: 'corner_moved', snap: { kind: 'square_corner' } },
    });
  });

  it('a drag that crosses goes back: nothing changes, the bar says why', () => {
    const { commits, state, document } = run(
      [
        {
          kind: 'grab',
          grip: { kind: 'corner', roof: 0, corner: 2 },
          at: p(8, 6),
          system: 'metric',
        },
        { kind: 'drag', at: p(4, -3) },
        { kind: 'release' },
      ],
      drawn,
    );
    expect(commits).toBe(0);
    expect(document).toBe(drawn);
    expect(roofBarOf(state, document, false, 'metric')).toMatchObject({
      said: { kind: 'went_back', fault: 'would_cross' },
      bad: true,
    });
  });

  it('+ dragged out adds a corner where it is let go: one change', () => {
    const { commits, document } = run(
      [
        { kind: 'grab', grip: { kind: 'plus', roof: 0, edge: 1 }, at: p(8, 3), system: 'metric' },
        { kind: 'drag', at: p(10, 3) },
        { kind: 'release' },
      ],
      drawn,
    );
    expect(commits).toBe(1);
    expect(document.roofs[0]?.corners[2]).toEqual(p(10, 3));
  });

  it('a corner picked, then × removes it; a triangle keeps its three', () => {
    const removed = run(
      [{ kind: 'pick_corner', corner: { roof: 0, corner: 3 } }, { kind: 'remove_corner' }],
      drawn,
    );
    expect(removed.commits).toBe(1);
    expect(removed.document.roofs[0]?.corners).toHaveLength(3);
    const kept = run(
      [{ kind: 'pick_corner', corner: { roof: 0, corner: 0 } }, { kind: 'remove_corner' }],
      removed.document,
    );
    expect(kept.commits).toBe(0);
    expect(kept.state).toMatchObject({ said: { kind: 'refused', refusal: 'keeps_three' } });
  });

  it('the turn handle turns the roof about its middle; the bar names the angle', () => {
    const { state, commits } = run(
      [
        { kind: 'grab', grip: { kind: 'turn', roof: 0 }, at: p(8, 3), system: 'metric' },
        { kind: 'drag', at: p(4 + 4 * Math.cos(0.244), 3 + 4 * Math.sin(0.244)) },
        { kind: 'release' },
      ],
      drawn,
    );
    expect(commits).toBe(1);
    expect(state).toMatchObject({ said: { kind: 'roof_turned', degrees: 14 } });
  });

  it('the bar after a roof: the area, its tier, and the reason it went back', () => {
    expect(roofBarOf(ROOF_STEP_START, drawn, false, 'metric')).toEqual({
      kind: 'roofs',
      area: 48,
      tier: 'derived',
      said: null,
      bad: false,
      sizing: false,
      live: null,
    });
    expect(roofBarOf(ROOF_STEP_START, EMPTY_STUDIO_DOCUMENT, true, 'metric')).toEqual({
      kind: 'start',
      noPicture: true,
    });
  });

  it('a handle pressed and let go where it was changes nothing: no Undo step', () => {
    const { commits, state } = run(
      [
        { kind: 'grab', grip: { kind: 'move', roof: 0 }, at: p(4, 3), system: 'metric' },
        { kind: 'release' },
      ],
      drawn,
    );
    expect(commits).toBe(0);
    expect(state).toEqual({ kind: 'idle', roof: 0, picked: null, said: null });
  });
});

describe('the roof step: a length in the box is kept by the next act', () => {
  const typed = (main: string) =>
    [
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'type', entry: { main, inches: '', measured: false } },
    ] as const;

  it.each([
    ['a tap outside', { kind: 'tap', at: p(30, 30), system: 'metric' }],
    ['another length', { kind: 'pick_length', roof: 0, edge: 1, system: 'metric' }],
    [
      'a corner taken',
      { kind: 'grab', grip: { kind: 'corner', roof: 0, corner: 2 }, at: p(8, 6), system: 'metric' },
    ],
  ] as const)('%s keeps the typed length as one change', (_name, next) => {
    const { commits, document } = run([...typed('8.4'), next], drawn);
    expect(commits).toBe(1);
    expect(document.roofs[0]?.edges[0]).toBe('typed');
  });

  it('a length far off the picture asks first: the tap outside keeps the box open', () => {
    const { commits, state } = run(
      [...typed('20'), { kind: 'tap', at: p(30, 30), system: 'metric' }],
      drawn,
    );
    expect(commits).toBe(0);
    expect(state.kind === 'sizing' && state.asking).toBe(true);
  });
});
