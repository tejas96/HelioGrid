import { describe, expect, it } from 'vitest';
import type { RoofStepEvent } from '../../src/studio/roof-step-state';
import { draftViewOf, roofBarOf } from '../../src/studio/roof-step-view';
import { CLOSE, drawn, p, RECTANGLE, run, STAMP } from './roof-step-run';

/**
 * The roof step's drawing aids (`T-M05-002`, part b): the first corner that glows, the filled
 * pencil that stops, the trash, Redraw and Done just after a close, and a roof deleted.
 */
describe('the first corner glows when a tap would close', () => {
  it.each([
    // corners placed, where the pointer is → the first dot glows
    ['3 corners, pointer 0.4 m from the first', 3, p(0.4, 0), true],
    ['3 corners, pointer 0.6 m away', 3, p(0.6, 0), false],
    ['2 corners: nothing to close yet', 2, p(0.1, 0), false],
  ] as const)('%s', (_why, taps, at, closing) => {
    const { state, document } = run([...RECTANGLE.slice(0, 1 + taps), { kind: 'hover', at }]);
    expect(state.kind === 'drawing' && draftViewOf(state, document).closing).toBe(closing);
  });

  it('closing wins over every snap: the spot is the first corner, with no guide and no tag', () => {
    const { state, document } = run([...RECTANGLE.slice(0, 4), { kind: 'hover', at: p(0.3, 0.2) }]);
    const view = state.kind === 'drawing' ? draftViewOf(state, document) : null;
    expect(view?.spot).toEqual({ point: p(0, 0), snap: null, guides: [] });
    expect(view?.spotRefusal).toBeNull();
    expect(view?.angle).toBeNull();
  });

  it.each([
    // where the pointer is, after three square corners → the ghost fourth is offered
    ['on the first corner: the tap closes as drawn', p(0.3, 0.2), false],
    ['away from it', p(20, 20), true],
  ])('the ghost, pointer %s', (_why, at, ghost) => {
    const { state, document } = run([...RECTANGLE.slice(0, 4), { kind: 'hover', at }]);
    const view = state.kind === 'drawing' ? draftViewOf(state, document) : null;
    expect(view?.ghost !== null).toBe(ghost);
  });
});

describe('the roof step: stopping, the trash, the close', () => {
  const THREE = RECTANGLE.slice(0, 4);

  it('the filled pencil stops: nothing saved, and one Undo takes the corners up again', () => {
    const stoppedRun = run([...THREE, { kind: 'cancel' }]);
    expect(stoppedRun.commits).toBe(0);
    expect(stoppedRun.state.kind).toBe('idle');
    const back = run([...THREE, { kind: 'cancel' }, { kind: 'undo_corner' }]).state;
    expect(back.kind === 'drawing' && back.corners).toEqual([p(0, 0), p(8, 0), p(8, 6)]);
  });

  it('the magnet turned off after a stop: Undo takes the drawing up with it off', () => {
    const { state } = run([
      ...THREE,
      { kind: 'cancel' },
      { kind: 'magnet', magnet: false },
      { kind: 'undo_corner' },
    ]);
    expect(state.kind === 'drawing' && state.magnet).toBe(false);
  });

  it('any other act after a stop lets the corners go', () => {
    const { state } = run([
      ...THREE,
      { kind: 'cancel' },
      { kind: 'tap', at: p(30, 30), system: 'metric' },
      { kind: 'undo_corner' },
    ]);
    expect(state.kind).toBe('idle');
  });

  it('a stop with no corner leaves nothing to take up', () => {
    const { state } = run([RECTANGLE[0] as RoofStepEvent, { kind: 'cancel' }]);
    expect(state).toEqual({ kind: 'idle', roof: null, picked: null, said: null });
  });

  it.each([
    // corners before the trash → what is left
    ['one corner: the trash does nothing', 1, 1],
    ['two corners: every corner goes', 2, 0],
    ['three corners: every corner goes', 3, 0],
  ] as const)('%s', (_why, taps, left) => {
    const { state, commits } = run([...RECTANGLE.slice(0, 1 + taps), { kind: 'wipe' }]);
    expect(commits).toBe(0);
    expect(state.kind === 'drawing' && state.corners).toHaveLength(left);
  });

  it('after the trash, drawing goes on, and Undo brings every corner back', () => {
    const { state } = run([...THREE, { kind: 'wipe' }, { kind: 'undo_corner' }]);
    expect(state.kind === 'drawing' && state.corners).toEqual([p(0, 0), p(8, 0), p(8, 6)]);
  });

  it('a corner after the trash starts afresh: Undo takes that corner, not the wiped ones', () => {
    const { state } = run([
      ...THREE,
      { kind: 'wipe' },
      { kind: 'tap', at: p(20, 20), system: 'metric' },
      { kind: 'undo_corner' },
      { kind: 'undo_corner' },
    ]);
    expect(state.kind === 'drawing' && state.corners).toEqual([]);
  });

  it('a close stands the roof at once, as one change, picked: nothing asks after it', () => {
    const { state, document, commits } = run(RECTANGLE);
    expect(commits).toBe(1);
    expect(document.roofs).toHaveLength(1);
    expect(state).toEqual({ kind: 'idle', roof: 0, picked: null, said: { kind: 'closed' } });
  });

  it.each([
    // how three square corners close → corners of the roof
    ['Close shape: the ghost gives the fourth', true, 4],
    ['a tap on the first corner: as drawn, a triangle', false, 3],
  ])('%s', (_why, ghost, corners) => {
    const { document } = run([...THREE, { ...CLOSE, ghost }]);
    expect(document.roofs[0]?.corners).toHaveLength(corners);
  });
});

describe('the roof step: deleting a roof', () => {
  it('the trash on a picked roof: it goes, as one change, and the bar says so', () => {
    const { state, document, commits } = run(
      [{ kind: 'tap', at: p(4, 3), system: 'metric' }, { kind: 'delete_roof' }],
      drawn,
    );
    expect(commits).toBe(1);
    expect(document.roofs).toEqual([]);
    expect(document.drawnOn).toBeNull();
    expect(state).toEqual({
      kind: 'idle',
      roof: null,
      picked: null,
      said: { kind: 'roof_deleted' },
    });
    expect(roofBarOf(state, document, false, 'metric')).toEqual({
      kind: 'start',
      noPicture: false,
      said: { kind: 'roof_deleted' },
    });
  });

  const twoRoofs = () =>
    run(
      [
        { kind: 'draw', magnet: true },
        { kind: 'tap', at: p(8, 0), system: 'metric' },
        { kind: 'tap', at: p(12, 0), system: 'metric' },
        { kind: 'tap', at: p(12, 6), system: 'metric' },
        CLOSE,
      ],
      drawn,
    ).document;

  it.each([
    // the design, the act before → roofs left
    ['one roof stands: it is the one picked, and goes', 'one', [], 0],
    [
      'two roofs, none picked: the trash does nothing',
      'two',
      [{ kind: 'tap', at: p(30, 30), system: 'metric' }],
      2,
    ],
  ] as const)('%s', (_why, design, before, left) => {
    const from = design === 'one' ? drawn : twoRoofs();
    const { document } = run(
      [...(before as readonly RoofStepEvent[]), { kind: 'delete_roof' }],
      from,
    );
    expect(document.roofs).toHaveLength(left);
  });

  it('deleting roof 1 of 2 keeps roof 2 and the picture date', () => {
    const two = run(
      [
        { kind: 'draw', magnet: true },
        { kind: 'tap', at: p(8, 0), system: 'metric' },
        { kind: 'tap', at: p(12, 0), system: 'metric' },
        { kind: 'tap', at: p(12, 6), system: 'metric' },
        CLOSE,
      ],
      drawn,
    ).document;
    const { document } = run(
      [{ kind: 'tap', at: p(4, 3), system: 'metric' }, { kind: 'delete_roof' }],
      two,
    );
    expect(document.roofs).toHaveLength(1);
    expect(document.roofs[0]?.corners[0]).toEqual(p(8, 0));
    expect(document.drawnOn).toEqual(STAMP);
  });
});
