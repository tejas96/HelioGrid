import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import { stepRefused } from '../../src/studio/roof-entry';
import { edgeLengths } from '../../src/studio/roof-shape';
import type { RoofStepEvent } from '../../src/studio/roof-step-state';
import { roofBarOf, roofStepShown } from '../../src/studio/roof-step-view';
import { CLOSE, drawn, p, RECTANGLE, run, STAMP } from './roof-step-run';

describe('the roof step: drawing', () => {
  it('four corners and close: one roof, one change, the picture’s date kept', () => {
    const { state, document, commits } = run(RECTANGLE);
    expect(commits).toBe(1);
    expect(document.roofs).toHaveLength(1);
    expect(document.drawnOn).toEqual(STAMP);
    expect(state).toEqual({ kind: 'idle', roof: 0, picked: null, said: { kind: 'closed' } });
  });

  it('three square corners and close: the ghost makes the fourth', () => {
    const { document } = run([
      RECTANGLE[0],
      RECTANGLE[1],
      RECTANGLE[2],
      RECTANGLE[3],
      CLOSE,
    ] as RoofStepEvent[]);
    expect(document.roofs[0]?.corners).toHaveLength(4);
  });

  it('a second roof keeps the first roof’s picture date', () => {
    const shed = [
      { kind: 'draw', magnet: true },
      { kind: 'tap', at: p(8, 0), system: 'metric' },
      { kind: 'tap', at: p(12, 0), system: 'metric' },
      { kind: 'tap', at: p(12, 6), system: 'metric' },
      { ...CLOSE, stamp: { source: 'google', takenOn: '2026-01-01' } },
    ] as RoofStepEvent[];
    const { document } = run(shed, drawn);
    expect(document.roofs).toHaveLength(2);
    expect(document.drawnOn).toEqual(STAMP);
  });

  it.each([
    // the magnet while the third corner is tapped → where it lands
    ['on: pulled square', true, p(8, 6)],
    ['turned off mid-draw, or Alt held: where it was tapped', false, p(8.15, 6)],
  ])('%s', (_why, magnet, third) => {
    const { state } = run([
      { kind: 'draw', magnet: true },
      { kind: 'tap', at: p(0, 0), system: 'metric' },
      { kind: 'tap', at: p(8, 0), system: 'metric' },
      { kind: 'magnet', magnet },
      { kind: 'tap', at: p(8.15, 6), system: 'metric' },
    ]);
    expect(state.kind === 'drawing' ? state.corners[2] : null).toEqual(third);
  });

  it('a refusal stays until the pointer moves on', () => {
    const crossing = [
      ...RECTANGLE.slice(0, 4),
      { kind: 'tap', at: p(4, -3), system: 'metric' },
    ] as RoofStepEvent[];
    const refused = run(crossing).state;
    expect(refused.kind === 'drawing' ? refused.refused : null).toBe('would_cross');
    const moved = run([...crossing, { kind: 'hover', at: p(0, 6) }]).state;
    expect(moved.kind === 'drawing' ? moved.refused : 'none').toBeNull();
  });

  it('Alt pressed over a still pointer: the spot lets go of its snap at once', () => {
    const at = p(8.15, 6);
    const pointed = [...RECTANGLE.slice(0, 3), { kind: 'hover', at }] as RoofStepEvent[];
    const snapped = run(pointed).state;
    expect(snapped.kind === 'drawing' ? snapped.spot?.snap?.kind : null).toBe('square');
    const free = run([...pointed, { kind: 'magnet', magnet: false }]).state;
    expect(free.kind === 'drawing' ? free.spot : null).toEqual({
      point: at,
      snap: null,
      guides: [],
    });
  });

  it('Draw again while drawing keeps the corners placed', () => {
    const { state } = run([...RECTANGLE.slice(0, 3), { kind: 'draw', magnet: true }]);
    expect(state.kind === 'drawing' ? state.corners : null).toHaveLength(2);
  });

  it('Cancel drops the draft: nothing changes', () => {
    const { document, commits, state } = run([...RECTANGLE.slice(0, 4), { kind: 'cancel' }]);
    expect(commits).toBe(0);
    expect(document).toBe(EMPTY_STUDIO_DOCUMENT);
    expect(state.kind).toBe('idle');
  });

  it('Undo while drawing takes the last corner off', () => {
    const { state } = run([...RECTANGLE.slice(0, 4), { kind: 'undo_corner' }]);
    expect(state.kind === 'drawing' && state.corners).toEqual([p(0, 0), p(8, 0)]);
  });

  it('a refused tap says why and places nothing', () => {
    const { state } = run([
      ...RECTANGLE.slice(0, 4),
      { kind: 'tap', at: p(4, -3), system: 'metric' },
    ]);
    expect(state.kind === 'drawing' && state.refused).toBe('would_cross');
    expect(state.kind === 'drawing' && state.corners).toHaveLength(3);
  });

  it('the bar while drawing: corners so far, the last edge, Close shape from three', () => {
    const { state, document } = run(RECTANGLE.slice(0, 3));
    expect(roofBarOf(state, document, false, 'metric')).toEqual({
      kind: 'drawing',
      corners: 2,
      lastEdge: 8,
      ghost: false,
      refused: null,
      canClose: false,
      magnet: true,
      hint: false,
      canWipe: true,
      canUndo: true,
    });
  });

  it.each([
    // events after Draw → the hint, the trash, Undo
    ['no corner yet: the hint alone', 0, true, false, false],
    ['one corner: Undo, no trash (Undo already clears it)', 1, false, false, true],
    ['two corners: the trash shows', 2, false, true, true],
  ] as const)('%s', (_why, taps, hint, canWipe, canUndo) => {
    const { state, document } = run(RECTANGLE.slice(0, 1 + taps));
    expect(roofBarOf(state, document, false, 'metric')).toMatchObject({ hint, canWipe, canUndo });
  });
});

describe('the roof step: one true length (the 7-tap path)', () => {
  it('4 corners, close, one length typed and set: two changes, the picture sized', () => {
    const { document, commits, state } = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'type', entry: { main: '8.2', inches: '', measured: false } },
      { kind: 'set', system: 'metric' },
    ]);
    expect(commits).toBe(2);
    expect(document.pictureScale).toBeCloseTo(8.2 / 8);
    expect(edgeLengths(document.roofs[0]?.corners ?? [])[0]).toBeCloseTo(8.2);
    expect(state).toEqual({ kind: 'idle', roof: 0, picked: null, said: { kind: 'sized' } });
  });

  it('the box previews live and × puts the old length back', () => {
    const typing = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'type', entry: { main: '9', inches: '', measured: false } },
    ]);
    const shown = roofStepShown(typing.state, typing.document, 'metric');
    expect(edgeLengths(shown.roofs[0]?.corners ?? [])[0]).toBeCloseTo(9);
    const { document, commits } = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'cancel' },
    ]);
    expect(commits).toBe(1);
    expect(document).toEqual(drawn);
  });

  it('a length opened and left untouched, then a tap outside: nothing set, the picture not sized', () => {
    // Only Set says "this is its true length"; a look and a tap away keeps the first length unused.
    for (const away of [
      { kind: 'tap', at: p(30, 30), system: 'metric' },
      { kind: 'pick_length', roof: 0, edge: 1, system: 'metric' },
    ] as const) {
      const { document, commits, state } = run([
        ...RECTANGLE,
        { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
        away,
      ]);
      expect(commits).toBe(1);
      expect(document).toEqual(drawn);
      expect(state.kind === 'idle' ? state.said : state.kind).not.toEqual({ kind: 'sized' });
    }
  });

  it('steps of 5 cm or 1 inch; many steps then Set are one change', () => {
    const { document, commits } = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'step', by: 1, system: 'metric' },
      { kind: 'step', by: 1, system: 'metric' },
      { kind: 'set', system: 'metric' },
    ]);
    expect(commits).toBe(2);
    expect(edgeLengths(document.roofs[0]?.corners ?? [])[0]).toBeCloseTo(8.1);
    const feet = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'imperial' },
      { kind: 'step', by: -1, system: 'imperial' },
    ]);
    expect(feet.state.kind === 'sizing' && feet.state.entry).toEqual({
      main: '26',
      inches: '2',
      measured: false,
    });
  });

  it('a step under 0.3 m is refused: the button dims', () => {
    const { state } = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'set', system: 'metric' },
      { kind: 'pick_length', roof: 0, edge: 1, system: 'metric' },
      { kind: 'type', entry: { main: '0.32', inches: '', measured: false } },
    ]);
    if (state.kind !== 'sizing') throw new Error('not sizing');
    expect(stepRefused(state, -1, 'metric')).toBe(true);
    expect(stepRefused(state, 1, 'metric')).toBe(false);
  });

  it('a later length far off the picture asks once; Use applies it', () => {
    const sized = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'set', system: 'metric' },
    ]).document;
    const asked = run(
      [
        { kind: 'pick_length', roof: 0, edge: 1, system: 'metric' },
        { kind: 'type', entry: { main: '12', inches: '', measured: false } },
        { kind: 'set', system: 'metric' },
      ],
      sized,
    );
    expect(asked.commits).toBe(0);
    expect(asked.state.kind === 'sizing' && asked.state.asking).toBe(true);
    const used = run(
      [
        { kind: 'pick_length', roof: 0, edge: 1, system: 'metric' },
        { kind: 'type', entry: { main: '12', inches: '', measured: false } },
        { kind: 'set', system: 'metric' },
        { kind: 'confirm', use: true, system: 'metric' },
      ],
      sized,
    );
    expect(used.commits).toBe(1);
    expect(edgeLengths(used.document.roofs[0]?.corners ?? [])[1]).toBeCloseTo(12);
  });

  it('measured on site: the edge is measured, the bar says so', () => {
    const { document, state } = run([
      ...RECTANGLE,
      { kind: 'pick_length', roof: 0, edge: 0, system: 'metric' },
      { kind: 'set', system: 'metric' },
      { kind: 'pick_length', roof: 0, edge: 1, system: 'metric' },
      { kind: 'type', entry: { main: '6.05', inches: '', measured: true } },
      { kind: 'set', system: 'metric' },
    ]);
    expect(document.roofs[0]?.edges[1]).toBe('measured');
    expect(state).toMatchObject({ said: { kind: 'set', metres: 6.05, measured: true } });
  });
});
