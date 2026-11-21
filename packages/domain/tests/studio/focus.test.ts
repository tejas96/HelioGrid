import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import { type FocusFacts, type FocusParts, focusJobOf, focusOf } from '../../src/studio/focus';
import { ALL_HELPERS } from '../../src/studio/roof-draw';
import type { RoofGrip, RoofStepState } from '../../src/studio/roof-step-state';

const FACTS: FocusFacts = {
  job: 'looking',
  view: 'top',
  phone: true,
  canEdit: true,
  hasRoof: true,
  saveFailed: false,
};
const partsOf = (facts: Partial<FocusFacts>) => focusOf({ ...FACTS, ...facts });

describe('focus mode: each job keeps only the parts it uses (T-M05-002, part b)', () => {
  it.each([
    // job, view, phone → the parts that differ from looking in the top view
    ['looking', 'top', true, {}],
    [
      'drawing',
      'top',
      true,
      {
        topBar: 'hidden',
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'filled',
        helperBar: 'shown',
        addRoof: 'hidden',
        layers: 'hidden',
        otherHandles: 'hidden',
        lengthLabels: 'draft',
        bottomBar: 'drawing',
      },
    ],
    [
      'dragging',
      'top',
      false,
      {
        topBar: 'hidden',
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        helperBar: 'shown',
        undoRedo: 'hidden',
        addRoof: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        otherHandles: 'hidden',
        bottomBar: 'status',
      },
    ],
    [
      'sizing',
      'top',
      true,
      {
        topBar: 'hidden',
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        undoRedo: 'hidden',
        addRoof: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        compass: 'hidden',
        otherHandles: 'hidden',
        bottomBar: 'status',
      },
    ],
    [
      'moving',
      'top',
      true,
      {
        topBar: 'hidden',
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        undoRedo: 'hidden',
        addRoof: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        otherHandles: 'hidden',
        bottomBar: 'status',
      },
    ],
    [
      'sizing',
      'top',
      false,
      {
        topBar: 'hidden',
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        undoRedo: 'hidden',
        addRoof: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        otherHandles: 'hidden',
        bottomBar: 'status',
      },
    ],
    [
      'looking',
      '3d',
      true,
      {
        pencil: 'hidden',
        addRoof: 'hidden',
        sideViews: 'shown',
        compass: 'north',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
      },
    ],
    [
      'sheet',
      '3d',
      true,
      {
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        addRoof: 'hidden',
        layers: 'switch',
        sideViews: 'shown',
        compass: 'north',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
        bottomBar: 'hidden',
      },
    ],
    [
      'sheet',
      'south',
      false,
      {
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        addRoof: 'hidden',
        layers: 'switch',
        sideViews: 'shown',
        compass: 'north',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
        bottomBar: 'hidden',
      },
    ],
  ] as const)('%s in %s, phone %s', (job, view, phone, differs: Partial<FocusParts>) => {
    expect(partsOf({ job, view, phone })).toEqual({ ...partsOf({}), ...differs });
  });

  it('the credit line never hides, whatever the job', () => {
    for (const job of ['looking', 'drawing', 'dragging', 'moving', 'sizing', 'sheet'] as const) {
      for (const view of ['top', '3d'] as const) {
        expect(['shown', 'credit']).toContain(partsOf({ job, view }).pictureChip);
      }
    }
  });
});

describe('focus mode: the edge cases', () => {
  it.each([
    [
      'a save that fails while drawing shows its pill',
      { job: 'drawing', saveFailed: true },
      'error',
    ],
    ['a failed save while looking keeps the whole bar', { saveFailed: true }, 'shown'],
    ['no failed save: the bar steps aside', { job: 'drawing' }, 'hidden'],
  ] as const)('%s', (_why, facts, topBar) => {
    expect(partsOf(facts).topBar).toBe(topBar);
  });

  it.each([
    [true, 'shown'],
    [false, 'hidden'],
  ] as const)('the + for another roof shows once a roof stands: %s → %s', (hasRoof, addRoof) => {
    expect(partsOf({ hasRoof }).addRoof).toBe(addRoof);
  });

  it('a reader never enters a job and holds no edit control', () => {
    const reader = partsOf({ job: 'drawing', canEdit: false });
    expect(reader).toMatchObject({
      topBar: 'shown',
      stepSwitcher: 'shown',
      pencil: 'hidden',
      helperBar: 'hidden',
      undoRedo: 'hidden',
      addRoof: 'hidden',
      otherHandles: 'hidden',
      bottomBar: 'main',
    });
  });

  it('before a roof stands, 3D offers no side views', () => {
    expect(partsOf({ view: '3d', hasRoof: false }).sideViews).toBe('hidden');
  });
});

describe('the job a drag holds: a corner the helpers guide, or a whole roof they do not', () => {
  const dragging = (grip: RoofGrip): RoofStepState => ({
    kind: 'dragging',
    grip,
    base: EMPTY_STUDIO_DOCUMENT,
    from: { east: 0, north: 0 },
    drag: { document: EMPTY_STUDIO_DOCUMENT, snap: null, fault: null },
    degrees: 0,
  });
  it.each([
    ['a corner', dragging({ kind: 'corner', roof: 0, corner: 1 }), 'dragging'],
    ['a + pulled out', dragging({ kind: 'plus', roof: 0, edge: 1 }), 'dragging'],
    ['the move handle', dragging({ kind: 'move', roof: 0 }), 'moving'],
    ['the turn handle', dragging({ kind: 'turn', roof: 0 }), 'moving'],
    ['nothing in hand', { kind: 'idle', picked: null, said: null } as const, 'looking'],
    [
      'a roof being drawn',
      {
        kind: 'drawing',
        corners: [],
        pointer: null,
        spot: null,
        refused: null,
        helpers: ALL_HELPERS,
      } as const,
      'drawing',
    ],
  ])('%s: %s', (_why, step, job) => {
    expect(focusJobOf(step)).toBe(job);
  });
});
