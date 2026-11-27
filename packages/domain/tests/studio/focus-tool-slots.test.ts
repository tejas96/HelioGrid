import { describe, expect, it } from 'vitest';
import { type FocusFacts, focusOf } from '../../src/studio/focus';
import { historyAfter, historyOf, historyRedone, historyUndone } from '../../src/studio/history';
import { cornerUndone, drawing } from '../../src/studio/roof-step-draw';
import { ROOF_STEP_START, type RoofStepState } from '../../src/studio/roof-step-state';
import {
  historySeenAfter,
  NOTHING_SEEN,
  undoSlotsOf as slotsOf,
} from '../../src/studio/undo-slots';

// The tools by job (the studio tools board, round 4): a tool shows only once it can act, and a place
// it has taken stays for the session, so nothing slides under a finger.
const FACTS: FocusFacts = {
  job: 'looking',
  view: 'top',
  phone: true,
  canEdit: true,
  hasRoof: true,
  saveFailed: false,
  slots: { undo: true, redo: true },
  lidar: false,
  saveAsks: false,
};
const partsOf = (facts: Partial<FocusFacts>) => focusOf({ ...FACTS, ...facts });
const P = (x: number, y: number) => ({ x, y }) as never;
const opened = historyOf('a');
// What a session that held only this history has seen.
const undoSlotsOf = (step: RoofStepState, history: Parameters<typeof historySeenAfter>[1]) =>
  slotsOf(step, historySeenAfter(NOTHING_SEEN, history));

describe('Undo and Redo come once they can act, and keep their place', () => {
  it('a design just opened has neither', () => {
    expect(undoSlotsOf(ROOF_STEP_START, opened)).toEqual({ undo: false, redo: false });
  });

  it('the first change brings Undo; Redo waits for the first undo', () => {
    expect(undoSlotsOf(ROOF_STEP_START, historyAfter(opened, 'b'))).toEqual({
      undo: true,
      redo: false,
    });
  });

  it('after an undo Redo has come, and stays once all is redone or a new change is made', () => {
    const undone = historyUndone(historyAfter(opened, 'b'));
    expect(undoSlotsOf(ROOF_STEP_START, undone)).toEqual({ undo: true, redo: true });
    expect(undoSlotsOf(ROOF_STEP_START, historyRedone(undone))).toEqual({ undo: true, redo: true });
    expect(undoSlotsOf(ROOF_STEP_START, historyAfter(undone, 'c'))).toEqual({
      undo: true,
      redo: true,
    });
  });

  it('everything undone keeps Undo: it dims in its place', () => {
    const back = historyUndone(historyAfter(opened, 'b'));
    expect(back.past).toEqual([]);
    expect(undoSlotsOf(ROOF_STEP_START, back).undo).toBe(true);
  });

  it('an undo with nothing to undo is no undo: Redo does not come', () => {
    expect(undoSlotsOf(ROOF_STEP_START, historyUndone(opened)).redo).toBe(false);
  });

  it('a stopped drawing left behind brings Undo', () => {
    const left = {
      ...ROOF_STEP_START,
      left: { corners: [P(0, 0)], magnet: true },
    } as RoofStepState;
    expect(undoSlotsOf(left, opened).undo).toBe(true);
  });
});

describe('while drawing, Undo follows the corners and then keeps its place', () => {
  const start = drawing(true);
  const one = { ...start, corners: [P(0, 0)] } as RoofStepState;

  it('before the first corner: no Undo, and never Redo', () => {
    expect(undoSlotsOf(start, historyUndone(historyAfter(opened, 'b')))).toEqual({
      undo: false,
      redo: false,
    });
  });

  it('the first corner brings Undo', () => {
    expect(undoSlotsOf(one, opened).undo).toBe(true);
  });

  it('the only corner undone keeps Undo, dim, until the drawing ends', () => {
    const back = cornerUndone(one).state;
    expect(back.kind === 'drawing' && back.corners.length).toBe(0);
    expect(undoSlotsOf(back, opened).undo).toBe(true);
  });

  it('corners wiped by the trash keep Undo: it brings them back', () => {
    const wiped = { ...start, wiped: [P(0, 0), P(1, 0)] } as RoofStepState;
    expect(undoSlotsOf(wiped, opened).undo).toBe(true);
  });

  it('between faces drawn by hand, Undo and Redo walk the history', () => {
    const between = { ...start, faces: 0 } as RoofStepState;
    const walked = historyUndone(historyAfter(opened, 'b'));
    expect(undoSlotsOf(between, walked)).toEqual({ undo: true, redo: true });
  });
});

describe('the parts follow the slots', () => {
  it('no slot: neither Undo nor Redo shows while looking', () => {
    const parts = partsOf({ slots: { undo: false, redo: false } });
    expect([parts.undo, parts.redo]).toEqual(['hidden', 'hidden']);
  });

  it('Undo alone before anything was undone', () => {
    const parts = partsOf({ slots: { undo: true, redo: false } });
    expect([parts.undo, parts.redo]).toEqual(['shown', 'hidden']);
  });

  it('drawing never shows Redo, whatever its slot', () => {
    expect(partsOf({ job: 'drawing' }).redo).toBe('hidden');
  });

  it('a reader has neither', () => {
    const parts = partsOf({ canEdit: false });
    expect([parts.undo, parts.redo]).toEqual(['hidden', 'hidden']);
  });

  it('before a roof stands the view menu shows and the 3D switch waits', () => {
    expect(partsOf({ hasRoof: false }).layers).toBe('menu');
    expect(partsOf({ hasRoof: true }).layers).toBe('shown');
  });

  it('a job that hides the layers still hides them before a roof', () => {
    expect(partsOf({ hasRoof: false, job: 'drawing' }).layers).toBe('hidden');
  });
});

describe('a menu: at the foot on a phone, beside its button on a wider screen', () => {
  it.each([
    ['phone: the tools and the bar step aside', true, 'hidden', 'hidden'],
    ['wider screen: nothing else moves', false, 'shown', 'main'],
  ] as const)('%s', (_why, phone, pencil, bottomBar) => {
    const parts = partsOf({ job: 'menu', phone });
    expect([parts.pencil, parts.bottomBar]).toEqual([pencil, bottomBar]);
  });

  it('a reader opens it too, and still holds no edit tool', () => {
    const parts = partsOf({ job: 'menu', phone: false, canEdit: false });
    expect([parts.pencil, parts.undo, parts.layers]).toEqual(['hidden', 'hidden', 'shown']);
  });
});

describe('a panel at a phone’s foot takes every tool’s place', () => {
  it.each([['roofs'], ['sheet'], ['menu']] as const)('%s: no tool, the magnet included', (job) => {
    const parts = partsOf({ job, phone: true });
    expect([parts.magnet, parts.wipe, parts.pencil, parts.layers, parts.zoom]).toEqual([
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
    ]);
  });
});

describe('the slots outlive a history read again (Open theirs)', () => {
  it('a fresh history after a change and an undo forgets neither', () => {
    const seen = historySeenAfter(NOTHING_SEEN, historyUndone(historyAfter(opened, 'b')));
    const reread = historySeenAfter(seen, historyOf('theirs'));
    expect(slotsOf(ROOF_STEP_START, reread)).toEqual({ undo: true, redo: true });
  });

  it('nothing seen and a fresh history: neither', () => {
    expect(slotsOf(ROOF_STEP_START, historySeenAfter(NOTHING_SEEN, historyOf('a')))).toEqual({
      undo: false,
      redo: false,
    });
  });

  it('what was seen stays the same object while nothing new is seen', () => {
    const seen = historySeenAfter(NOTHING_SEEN, historyAfter(opened, 'b'));
    expect(historySeenAfter(seen, historyAfter(opened, 'c'))).toBe(seen);
  });
});
