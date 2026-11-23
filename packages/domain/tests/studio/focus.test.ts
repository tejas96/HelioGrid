import { describe, expect, it } from 'vitest';
import { FOCUS_JOBS, type FocusFacts, type FocusParts, focusOf } from '../../src/studio/focus';

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
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'filled',
        magnet: 'shown',
        undoRedo: 'undo',
        wipe: 'shown',
        layers: 'hidden',
        zoom: 'hidden',
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
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        magnet: 'hidden',
        undoRedo: 'hidden',
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
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        magnet: 'hidden',
        undoRedo: 'hidden',
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
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        magnet: 'hidden',
        undoRedo: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        otherHandles: 'hidden',
        bottomBar: 'status',
      },
    ],
    // Type the size: the card's job keeps the zoom and moves the foot to the slim pill; on a phone
    // the compass steps aside for the keyboard.
    [
      'typing',
      'top',
      false,
      {
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        magnet: 'hidden',
        undoRedo: 'hidden',
        layers: 'hidden',
        otherHandles: 'hidden',
        lengthLabels: 'draft',
        bottomBar: 'drawing',
      },
    ],
    [
      'typing',
      'top',
      true,
      {
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        magnet: 'hidden',
        undoRedo: 'hidden',
        layers: 'hidden',
        otherHandles: 'hidden',
        compass: 'hidden',
        lengthLabels: 'draft',
        bottomBar: 'drawing',
      },
    ],
    [
      'sizing',
      'top',
      false,
      {
        stepSwitcher: 'hidden',
        pictureChip: 'credit',
        pencil: 'hidden',
        magnet: 'hidden',
        undoRedo: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        otherHandles: 'hidden',
        bottomBar: 'status',
      },
    ],
    [
      'picture',
      'top',
      true,
      {
        stepSwitcher: 'mark',
        pictureChip: 'credit',
        otherHandles: 'hidden',
        bottomBar: 'drawing',
      },
    ],
    [
      'looking',
      '3d',
      true,
      {
        magnet: 'hidden',
        sideViews: 'shown',
        compass: 'shown',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
      },
    ],
    [
      'sheet',
      '3d',
      true,
      {
        stepSwitcher: 'mark',
        pictureChip: 'credit',
        magnet: 'hidden',
        layers: 'switch',
        sideViews: 'shown',
        compass: 'shown',
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
        stepSwitcher: 'mark',
        pictureChip: 'credit',
        magnet: 'hidden',
        layers: 'switch',
        sideViews: 'shown',
        compass: 'shown',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
        bottomBar: 'hidden',
      },
    ],
    // Roofs and the material picker: a sheet across a phone's foot, a panel at a desktop's right.
    ['roofs', 'top', false, {}],
    [
      'roofs',
      'top',
      true,
      {
        pencil: 'hidden',
        undoRedo: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        bottomBar: 'hidden',
      },
    ],
    [
      'roofs',
      '3d',
      true,
      {
        pencil: 'hidden',
        magnet: 'hidden',
        undoRedo: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
        bottomBar: 'hidden',
      },
    ],
  ] as const)('%s in %s, phone %s', (job, view, phone, differs: Partial<FocusParts>) => {
    expect(partsOf({ job, view, phone })).toEqual({ ...partsOf({}), ...differs });
  });

  it('the credit line never hides, whatever the job', () => {
    for (const job of FOCUS_JOBS) {
      for (const view of ['top', '3d'] as const) {
        expect(['shown', 'credit']).toContain(partsOf({ job, view }).pictureChip);
      }
    }
  });
});

describe('focus mode: the edge cases', () => {
  it.each([
    [
      'a save that fails while drawing shows its mark alone',
      { job: 'drawing', saveFailed: true },
      'mark',
    ],
    ['a roof sheet in 3D keeps the mark, saved or not', { job: 'sheet', view: '3d' }, 'mark'],
    ['a failed save while looking keeps the whole pill', { saveFailed: true }, 'shown'],
    ['no failed save: the pill steps aside', { job: 'drawing' }, 'hidden'],
  ] as const)('%s', (_why, facts, stepSwitcher) => {
    expect(partsOf(facts).stepSwitcher).toBe(stepSwitcher);
  });

  it('a reader never enters a job and holds no edit control', () => {
    const reader = partsOf({ job: 'drawing', canEdit: false });
    expect(reader).toMatchObject({
      stepSwitcher: 'shown',
      magnet: 'hidden',
      wipe: 'hidden',
      undoRedo: 'hidden',
      otherHandles: 'hidden',
      bottomBar: 'main',
    });
  });

  it.each([
    ['with a roof it opens Roofs', true, 'shown'],
    ['with no roof there is nothing to open', false, 'hidden'],
  ] as const)('a reader’s pencil: %s', (_why, hasRoof, pencil) => {
    expect(partsOf({ canEdit: false, hasRoof }).pencil).toBe(pencil);
  });

  it('a reader’s Roofs on a phone takes the tools’ and the bar’s place, as an editor’s does', () => {
    expect(partsOf({ job: 'roofs', canEdit: false, phone: true })).toMatchObject({
      pencil: 'hidden',
      layers: 'hidden',
      bottomBar: 'hidden',
    });
  });

  it('before a roof stands, 3D offers no side views', () => {
    expect(partsOf({ view: '3d', hasRoof: false }).sideViews).toBe('hidden');
  });
});
