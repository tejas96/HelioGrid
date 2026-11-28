import { describe, expect, it } from 'vitest';
import { type FocusFacts, focusOf } from '../../src/studio/focus';
import { FOCUS_JOBS } from '../../src/studio/focus-job';

const FACTS: FocusFacts = {
  job: 'looking',
  view: 'top',
  phone: true,
  canEdit: true,
  hasRoof: true,
  slots: { undo: true, redo: true },
  lidar: false,
  saveAsks: false,
};
const partsOf = (facts: Partial<FocusFacts>) => focusOf({ ...FACTS, ...facts });

describe('LiDAR keeps only what it needs (T-M05-002g, board frames 5 and 16)', () => {
  const lidar = {
    stepSwitcher: 'hidden',
    pictureChip: 'hidden',
    pencil: 'hidden',
    roofs: 'hidden',
    magnet: 'hidden',
    wipe: 'hidden',
    undo: 'shown',
    redo: 'shown',
    // Neither the 2D switch nor the LiDAR button: its own × leaves LiDAR.
    layers: 'hidden',
    zoom: 'hidden',
    compass: 'shown',
    otherHandles: 'hidden',
    lengthLabels: 'hidden',
    bottomBar: 'hidden',
    lidar: 'hidden',
    sun: 'shown',
    closeThreeD: 'hidden',
  } as const;

  it.each([
    ['looking, on a phone', { job: 'looking', phone: true }, lidar],
    ['a job left open under it', { job: 'sheet', phone: false }, lidar],
    [
      'saving needs the person: its mark comes back',
      { saveAsks: true },
      { ...lidar, stepSwitcher: 'mark' },
    ],
    [
      'before anything changed: no Undo or Redo',
      { slots: { undo: false, redo: false } },
      { ...lidar, undo: 'hidden', redo: 'hidden' },
    ],
    [
      'a reader: Undo and Redo never come',
      { canEdit: false },
      { ...lidar, undo: 'hidden', redo: 'hidden' },
    ],
  ] as const)('%s', (_, facts, parts) => {
    expect(partsOf({ ...facts, view: '3d', lidar: true })).toEqual(parts);
  });

  it('a save mark that is fine stays away; one that needs the person shows off LiDAR too', () => {
    expect(partsOf({ view: '3d', lidar: true }).stepSwitcher).toBe('hidden');
    expect(partsOf({ job: 'drawing', saveAsks: true }).stepSwitcher).toBe('mark');
  });

  it('the LiDAR button waits for a roof, and steps aside in a job', () => {
    expect(partsOf({ hasRoof: false }).lidar).toBe('hidden');
    expect(partsOf({}).lidar).toBe('shown');
    expect(partsOf({ view: '3d' }).lidar).toBe('shown');
    expect(partsOf({ job: 'drawing' }).lidar).toBe('hidden');
  });
});

describe('the 3D view’s head (T-M05-002g)', () => {
  it('the 3D head keeps the save mark and the compass alone, whatever the job (T-M05-002g)', () => {
    for (const job of FOCUS_JOBS) {
      const parts = partsOf({ job, view: '3d' });
      expect([parts.pictureChip, parts.stepSwitcher, parts.compass]).toEqual([
        'hidden',
        'mark',
        'shown',
      ]);
    }
  });
});
