import { describe, expect, it } from 'vitest';
import { type FocusFacts, focusOf } from '../../src/studio/focus';

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
      undo: 'hidden',
      redo: 'hidden',
      otherHandles: 'hidden',
      bottomBar: 'main',
    });
  });

  it.each([
    ['with a roof it opens Roofs', true, 'shown'],
    ['with no roof there is nothing to open', false, 'hidden'],
  ] as const)('a reader’s Roofs: %s; they never draw', (_why, hasRoof, roofs) => {
    expect(partsOf({ canEdit: false, hasRoof })).toMatchObject({ roofs, pencil: 'hidden' });
  });

  it.each([
    ['with no roof, Roofs has nothing to open: only the pencil', false, 'hidden'],
    ['once a roof stands, Roofs comes beside the pencil', true, 'shown'],
  ] as const)('an editor: %s', (_why, hasRoof, roofs) => {
    expect(partsOf({ hasRoof })).toMatchObject({ roofs, pencil: 'shown' });
    expect(partsOf({ hasRoof, view: '3d' })).toMatchObject({ roofs, pencil: 'shown' });
  });

  it('a reader’s Roofs on a phone takes the tools’ and the bar’s place, as an editor’s does', () => {
    expect(partsOf({ job: 'roofs', canEdit: false, phone: true })).toMatchObject({
      pencil: 'hidden',
      layers: 'hidden',
      bottomBar: 'hidden',
    });
  });
});
