import { describe, expect, it } from 'vitest';
import {
  compassWayOf,
  type LidarMoment,
  lidarFootOf,
  lidarHintOf,
  lidarStatusOf,
  lidarTopFixOf,
} from '../../src/studio/lidar-say';
import { LIDAR_START, type LidarView } from '../../src/studio/site-view';

/**
 * What LiDAR says (`T-M05-002g`, board frames 5, 10–17): one instruction under the head, one
 * message with one action at the foot, never both for the same thing.
 */

const ON: LidarView = { ...LIDAR_START, on: true };
const ROOFS: LidarView = { ...ON, move: { tab: 'roofs', picked: [] } };
const MOMENT: LidarMoment = {
  view: ON,
  scanIn: true,
  canEdit: true,
  picked: 0,
  draggedM: null,
  holding: false,
  onScan: false,
  movedM: null,
  offSpot: false,
};
const at = (more: Partial<LidarMoment>) => ({ ...MOMENT, ...more });

describe('the instruction under the head', () => {
  it.each([
    ['LiDAR opens: the first tip', {}, { kind: 'open' }],
    ['the person pressed once: it goes', { view: { ...ON, tipGone: true } }, null],
    ['roofs sit off: the foot says it, not the head', { offSpot: true }, null],
    ['the scan still loading: nothing', { scanIn: false }, null],
    ['LiDAR off: nothing', { view: LIDAR_START }, null],
    ['a reader', { canEdit: false }, { kind: 'reader' }],
    ['a reader with a roof’s card open', { canEdit: false, view: ROOFS }, null],
    ['Move with nothing picked', { view: ROOFS }, { kind: 'pick' }],
    ['a roof picked', { view: ROOFS, picked: 2 }, { kind: 'drag' }],
    [
      'a finger holds a picked roof',
      { view: ROOFS, picked: 1, holding: true },
      { kind: 'now_drag' },
    ],
    ['dragging', { view: ROOFS, picked: 1, draggedM: 1.4049 }, { kind: 'moving', metres: 1.4 }],
    ['the Map tab', { view: { ...ON, move: { tab: 'map', picked: [] } } }, { kind: 'map' }],
    [
      'the magnet holds the drag on the scan',
      { view: ROOFS, picked: 1, draggedM: 4.3, onScan: true },
      { kind: 'on_scan' },
    ],
  ] as const)('%s', (_, more, hint) => {
    expect(lidarHintOf(at(more as Partial<LidarMoment>))).toEqual(hint);
  });
});

describe('the message at the foot', () => {
  it.each([
    ['nothing to say', {}, null],
    ['roofs drawn on the leaning picture sit off: Fix', { offSpot: true }, { kind: 'off_spot' }],
    [
      'once its × put it away, it stays away',
      { offSpot: true, view: { ...ON, footShut: true } },
      null,
    ],
    ['while Move is open, Fix waits', { offSpot: true, view: ROOFS }, null],
    [
      'after a move: Moved, with Undo',
      { view: ROOFS, movedM: 1.4 },
      { kind: 'moved', metres: 1.4 },
    ],
    ['during the next drag, it steps aside', { view: ROOFS, movedM: 1.4, draggedM: 0.2 }, null],
    ['a reader is never asked to act', { canEdit: false, offSpot: true }, null],
    ['the scan not in yet', { scanIn: false, offSpot: true }, null],
  ] as const)('%s', (_, more, foot) => {
    expect(lidarFootOf(at(more as Partial<LidarMoment>))).toEqual(foot);
  });
});

describe('where the picked roofs stand', () => {
  const base = {
    picked: 1,
    fitsIn: true,
    away: false,
    heightOff: false,
    shift: null,
    scanHeightM: 9,
  };
  it.each([
    ['nothing picked', { picked: 0 }, null],
    ['the fits not in yet', { fitsIn: false }, null],
    ['on the scan, at its height', {}, { kind: 'matches' }],
    [
      'off the scan',
      { away: true, shift: { east: 3, north: 3 } },
      { kind: 'off', shift: { east: 3, north: 3 }, scanHeightM: null },
    ],
    ['at another height', { heightOff: true }, { kind: 'off', shift: null, scanHeightM: 9 }],
  ] as const)('%s', (_, more, status) => {
    expect(lidarStatusOf({ ...base, ...more })).toEqual(status);
  });
});

describe('the way a shift points', () => {
  it.each([
    [{ east: 0, north: 1 }, 'north'],
    [{ east: 3, north: 3 }, 'north_east'],
    [{ east: 1, north: 0 }, 'east'],
    [{ east: 1, north: -1 }, 'south_east'],
    [{ east: 0, north: -2 }, 'south'],
    [{ east: -1, north: -1 }, 'south_west'],
    [{ east: -1, north: 0.1 }, 'west'],
    [{ east: -1, north: 1 }, 'north_west'],
    [{ east: 0.38, north: 1 }, 'north'],
    [{ east: 0.42, north: 1 }, 'north_east'],
  ] as const)('%o points %s', (shift, way) => {
    expect(compassWayOf(shift)).toBe(way);
  });
});

describe('the top view’s Fix in LiDAR', () => {
  const base = { topView: true, straightDown: true, offSpot: true, canEdit: true, footShut: false };
  it.each([
    ['on the straight-down picture, roofs off their spot: said', {}, true],
    ['in 3D: LiDAR’s own foot says it', { topView: false }, false],
    ['on the sky picture the roofs were drawn on: nothing to see', { straightDown: false }, false],
    ['every roof on its spot', { offSpot: false }, false],
    ['a reader', { canEdit: false }, false],
    ['put away with its ×', { footShut: true }, false],
  ])('%s', (_, more, said) => {
    expect(lidarTopFixOf({ ...base, ...more })).toBe(said);
  });
});
