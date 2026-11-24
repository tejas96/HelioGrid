import {
  EMPTY_STUDIO_DOCUMENT,
  historyAfter,
  historyOf,
  historyUndone,
  type RoofStepEvent,
  type RoofStepState,
  type StudioDocument,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { historyStep, type StudioBackFacts, studioBack } from '../../src/react/studio-undo-back';

const IDLE: RoofStepState = { kind: 'idle', roof: null, picked: null, said: null };
const DRAWING: RoofStepState = {
  kind: 'drawing',
  corners: [],
  pointer: null,
  spot: null,
  refused: null,
  magnet: true,
  wiped: null,
};
const PICKED: RoofStepState = { ...IDLE, roof: 0, picked: { roof: 0, corner: 1 } };

/** The facts with nothing open; each row opens what it names. */
function run(open: Partial<StudioBackFacts>) {
  const done: string[] = [];
  const facts: StudioBackFacts = {
    panelOpen: false,
    closePanel: () => done.push('panel'),
    picturesOpen: false,
    closePictures: () => done.push('pictures'),
    sheetOpen: false,
    closeSheet: () => done.push('sheet'),
    step: IDLE,
    act: (event: RoofStepEvent) => done.push(event.kind),
    ...open,
  };
  return { handled: studioBack(facts), done };
}

describe('the system back closes the top thing open first (T-M05-002)', () => {
  it.each([
    // what is open → handled here, what closed
    [
      'what the pencil opened, over the pictures and a sheet',
      { panelOpen: true, picturesOpen: true, sheetOpen: true },
      true,
      ['panel'],
    ],
    [
      'the pictures, over a sheet and a draft',
      { picturesOpen: true, sheetOpen: true, step: DRAWING },
      true,
      ['pictures'],
    ],
    ['a roof’s sheet, over a draft', { sheetOpen: true, step: DRAWING }, true, ['sheet']],
    ['a drawing in hand', { step: DRAWING }, true, ['cancel']],
    ['a picked corner', { step: PICKED }, true, ['pick_corner']],
    ['nothing: the way back leaves', {}, false, []],
  ] as const)('%s', (_why, open, handled, done) => {
    expect(run(open)).toEqual({ handled, done });
  });
});

describe('Undo and Redo name the change they take back or make again (T-M05-002)', () => {
  const empty = EMPTY_STUDIO_DOCUMENT;
  const roof = {
    id: 'r',
    corners: [
      { east: 0, north: 0 },
      { east: 8, north: 0 },
      { east: 8, north: 6 },
    ],
    edges: ['traced', 'traced', 'traced'],
    tracedOn: 'sky',
    height: null,
  } as const;
  const one: StudioDocument = { ...empty, roofs: [roof] };
  it.each([
    // the history, Undo or Redo → the change named
    ['Undo of a roof drawn', historyAfter(historyOf(empty), one), true, 'roof_added'],
    ['Redo of it', historyUndone(historyAfter(historyOf(empty), one)), false, 'roof_added'],
    ['Undo of a roof deleted', historyAfter(historyOf(one), empty), true, 'roof_deleted'],
  ] as const)('%s', (_why, history, undone, change) => {
    expect(historyStep(history, undone).change).toBe(change);
  });
});
