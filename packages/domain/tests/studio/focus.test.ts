import { describe, expect, it } from 'vitest';
import { type FocusFacts, type FocusParts, focusOf } from '../../src/studio/focus';
import { FOCUS_JOBS } from '../../src/studio/focus-job';

const FACTS: FocusFacts = {
  job: 'looking',
  view: 'top',
  phone: true,
  canEdit: true,
  hasRoof: true,
  saveFailed: false,
  slots: { undo: true, redo: true },
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
        roofs: 'hidden',
        magnet: 'shown',
        undo: 'shown',
        redo: 'hidden',
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
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
        compass: 'shown',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
      },
    ],
    // A roof's sheet on a phone is a sheet across the foot, as Roofs is: the tools step aside
    // (board 6.1); the north arrow stays. It stays open in either view.
    [
      'sheet',
      'top',
      true,
      {
        magnet: 'hidden',
        pencil: 'hidden',
        roofs: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
        bottomBar: 'hidden',
      },
    ],
    [
      'sheet',
      '3d',
      true,
      {
        stepSwitcher: 'mark',
        pictureChip: 'credit',
        pencil: 'hidden',
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
        layers: 'hidden',
        zoom: 'hidden',
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
        compass: 'shown',
        otherHandles: 'hidden',
        lengthLabels: 'hidden',
        bottomBar: 'hidden',
      },
    ],
    // Roofs and the material picker open from the foot on every screen, in the bar's place: across
    // a phone's foot with the tools stepping aside; between a desktop's tool columns.
    ['roofs', 'top', false, { bottomBar: 'hidden' }],
    ['sheet', 'top', false, { bottomBar: 'hidden' }],
    [
      'roofs',
      'top',
      true,
      {
        magnet: 'hidden',
        pencil: 'hidden',
        roofs: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
        roofs: 'hidden',
        magnet: 'hidden',
        undo: 'hidden',
        redo: 'hidden',
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
