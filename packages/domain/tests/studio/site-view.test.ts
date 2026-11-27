import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type StudioDocument } from '../../src/studio/document';
import {
  heightKeyOf,
  LIDAR_START,
  type LidarEvent,
  type LidarView,
  lidarViewAfter,
  linedUp,
  lineUpAtEdge,
  lineUpCleared,
  lineUpDragged,
  lineUpLifted,
  lineUpNudged,
  lineUpOf,
  SEE_THROUGH_MAP_START,
} from '../../src/studio/site-view';

/**
 * The height view's line-up and key (`T-M05-002`, part g, board G23, G7): 10 cm steps, ±3 m up and
 * down, ±5 m each way, arrows that follow the screen; Back to automatic; the key's two ends.
 */

const design: StudioDocument = { ...EMPTY_STUDIO_DOCUMENT, roofs: [] };

describe('lining the map up by hand', () => {
  it.each([
    ['a lift kept to 10 cm', 0.34, 0.3],
    ['3 m is the most', 3.4, 3],
    ['−3 m the least', -9, -3],
  ])('%s', (_, lift, kept) => {
    expect(lineUpOf(lineUpLifted(design, lift)).lift).toBeCloseTo(kept, 9);
  });

  it('an arrow moves the map 10 cm the way it points on the screen, whatever the camera’s turn', () => {
    const east = lineUpNudged(design, { east: 3, north: 0 });
    expect(lineUpOf(east)).toEqual({ east: 0.1, north: 0, lift: 0 });
    const turned = lineUpNudged(east, { east: 0, north: -1 });
    expect(lineUpOf(turned).north).toBeCloseTo(-0.1, 9);
  });

  it('5 m is as far as the map moves', () => {
    let moved = design;
    for (let i = 0; i < 60; i += 1) moved = lineUpNudged(moved, { east: 1, north: 0 });
    expect(lineUpOf(moved).east).toBeCloseTo(5, 9);
  });

  it('back to automatic, or a line-up back at zero, leaves no line-up stored', () => {
    expect(lineUpCleared(lineUpLifted(design, 1)).site?.lineUp).toBeUndefined();
    expect(lineUpLifted(lineUpLifted(design, 1), 0).site?.lineUp).toBeUndefined();
  });
});

describe('the height view’s key', () => {
  it('runs from the low to the high of the map near the roofs, a pit and a mast left out', () => {
    const heights = [...Array.from({ length: 98 }, (_, i) => (i % 10) * 0.7), -4, 40];
    expect(heightKeyOf(heights)).toEqual({ lowM: 0, highM: 7 });
  });

  it('no height: no key', () => {
    expect(heightKeyOf([Number.NaN])).toBeNull();
  });
});

describe('a point of the map, where the line-up moved it', () => {
  it.each([
    ['no line-up leaves it', { east: 0, north: 0, lift: 0 }, { east: 5, north: 2 }],
    ['east and north move it so', { east: 0.3, north: -0.2, lift: 1 }, { east: 5.3, north: 1.8 }],
  ])('%s', (_, lineUp, moved) => {
    const point = linedUp({ east: 5, north: 2 }, lineUp);
    expect(point.east).toBeCloseTo(moved.east, 9);
    expect(point.north).toBeCloseTo(moved.north, 9);
  });
});

describe('the studio lines the map up by itself; the person moves on from there (step 1)', () => {
  const automatic = { east: 0.75, north: -0.5, lift: 0 };

  it('with no line-up of the person’s, the automatic one is in force', () => {
    expect(lineUpOf(design, automatic)).toEqual(automatic);
    expect(lineUpOf(design, null)).toEqual({ east: 0, north: 0, lift: 0 });
  });

  it('an arrow starts from the automatic place, and back there stores nothing', () => {
    const nudged = lineUpNudged(design, { east: 1, north: 0 }, automatic);
    expect(lineUpOf(nudged, automatic).east).toBeCloseTo(0.9, 9);
    const back = lineUpNudged(nudged, { east: -1, north: 0 }, automatic);
    expect(lineUpOf(back, automatic).east).toBeCloseTo(0.8, 9);
    expect(lineUpCleared(back).site?.lineUp).toBeUndefined();
  });

  it('a person’s line-up wins over the automatic one, back at zero included', () => {
    const zero = lineUpDragged(design, { east: 0, north: 0 }, automatic);
    expect(zero.site?.lineUp).toEqual({ east: 0, north: 0, lift: 0 });
    expect(lineUpOf(zero, automatic)).toEqual({ east: 0, north: 0, lift: 0 });
  });

  it('a drag that ends where the map lies changes nothing: no Undo step', () => {
    const moved = lineUpDragged(design, { east: 1, north: 1 });
    expect(lineUpDragged(moved, { east: 1.02, north: 0.98 })).toBe(moved);
    expect(lineUpDragged(design, { east: 0, north: 0 })).toBe(design);
  });

  it.each([
    ['a drag kept to 10 cm', { east: 1.234, north: -2.06 }, { east: 1.2, north: -2.1 }],
    ['and to 5 m each way', { east: 7, north: -9 }, { east: 5, north: -5 }],
  ])('%s', (_, to, kept) => {
    const moved = lineUpOf(lineUpDragged(design, to));
    expect(moved.east).toBeCloseTo(kept.east, 9);
    expect(moved.north).toBeCloseTo(kept.north, 9);
  });
});

describe('LiDAR’s view (T-M05-002g, board frames 5–17)', () => {
  const on: LidarView = { ...LIDAR_START, on: true };
  const moving: LidarView = { ...on, move: { tab: 'roofs', picked: [] } };
  const played = (view: LidarView, ...events: LidarEvent[]) => events.reduce(lidarViewAfter, view);

  it.each<[string, LidarView, LidarEvent[], Partial<LidarView>]>([
    [
      'the button turns it on, Heights first',
      LIDAR_START,
      [{ kind: 'toggle' }],
      { on: true, look: 'heights' },
    ],
    [
      'the button again turns it off and closes Move',
      moving,
      [{ kind: 'toggle' }],
      { on: false, move: null },
    ],
    ['× or the top view turns it off', moving, [{ kind: 'off' }], { on: false, move: null }],
    ['Esc closes Move first', moving, [{ kind: 'back' }], { on: true, move: null }],
    [
      'then Esc turns LiDAR off',
      moving,
      [{ kind: 'back' }, { kind: 'back' }],
      { on: false, move: null },
    ],
    [
      'Move opens on Roofs with nothing picked',
      on,
      [{ kind: 'move' }],
      { move: { tab: 'roofs', picked: [] }, tipGone: true },
    ],
    ['Move closes again', moving, [{ kind: 'move' }], { move: null }],
    ['Move waits while LiDAR is off', LIDAR_START, [{ kind: 'move' }], { move: null }],
    [
      'the Map tab opens see-through at half',
      moving,
      [{ kind: 'tab', tab: 'map' }],
      { seeThrough: SEE_THROUGH_MAP_START, move: { tab: 'map', picked: [] } },
    ],
    [
      'a see-through the person set stays',
      { ...moving, seeThrough: 0.2 },
      [{ kind: 'tab', tab: 'map' }],
      { seeThrough: 0.2, move: { tab: 'map', picked: [] } },
    ],
    [
      'see-through is kept to its ends',
      on,
      [{ kind: 'see_through', share: 1.4 }],
      { seeThrough: 1 },
    ],
    [
      'Fix opens Move with the buildings picked',
      on,
      [{ kind: 'fix', picked: ['a', 'b'] }],
      { move: { tab: 'roofs', picked: ['a', 'b'] }, tipGone: true },
    ],
    [
      'a chip picks a whole building',
      moving,
      [{ kind: 'pick', building: ['a', 'b'] }],
      { move: { tab: 'roofs', picked: ['a', 'b'] } },
    ],
    [
      'the chip again lets it go',
      moving,
      [
        { kind: 'pick', building: ['a', 'b'] },
        { kind: 'pick', building: ['a', 'b'] },
      ],
      { move: { tab: 'roofs', picked: [] } },
    ],
    [
      'None lets every one go',
      { ...on, move: { tab: 'roofs', picked: ['a'] } },
      [{ kind: 'pick_none' }],
      { move: { tab: 'roofs', picked: [] } },
    ],
  ])('%s', (_, from, events, changed) => {
    expect(played(from, ...events)).toEqual({ ...from, ...changed });
  });

  it('a tap on a roof opens Move on its building; a second building joins; the Map tab goes back to Roofs', () => {
    const tapped = played(on, { kind: 'tap_roof', building: ['a', 'b'], roof: 'a', canEdit: true });
    expect(tapped.move).toEqual({ tab: 'roofs', picked: ['a', 'b'] });
    const onMap = played(tapped, { kind: 'tab', tab: 'map' });
    const second = played(onMap, { kind: 'tap_roof', building: ['c'], roof: 'c', canEdit: true });
    expect(second.move).toEqual({ tab: 'roofs', picked: ['a', 'b', 'c'] });
  });

  it('a reader’s tap shows that one roof, never its building', () => {
    const read = played(on, { kind: 'tap_roof', building: ['a', 'b'], roof: 'b', canEdit: false });
    expect(read.move).toEqual({ tab: 'roofs', picked: ['b'] });
  });

  it('a tap with LiDAR off does nothing; an event that changes nothing gives the same view', () => {
    expect(
      played(LIDAR_START, { kind: 'tap_roof', building: ['a'], roof: 'a', canEdit: true }),
    ).toBe(LIDAR_START);
    expect(lidarViewAfter(on, { kind: 'look', look: 'heights' })).toBe(on);
    expect(lidarViewAfter(on, { kind: 'off' }).on).toBe(false);
    expect(lidarViewAfter(LIDAR_START, { kind: 'back' })).toBe(LIDAR_START);
    expect(lidarViewAfter(LIDAR_START, { kind: 'why', shown: false })).toBe(LIDAR_START);
    expect(lidarViewAfter(LIDAR_START, { kind: 'why', shown: true }).why).toBe(true);
  });
});

describe('the scan moved as far as it goes', () => {
  it.each([
    ['at rest', { east: 0, north: 0 }, false],
    ['a step short of the limit', { east: 4.9, north: 0 }, false],
    ['at the limit, east', { east: 5, north: 0 }, true],
    ['at the limit, west', { east: -5, north: 0 }, true],
    ['at the limit, north', { east: 1, north: 5 }, true],
    ['at the limit, south', { east: 0, north: -5 }, true],
  ] as const)('%s', (_, lineUp, edge) => {
    expect(lineUpAtEdge(lineUp)).toBe(edge);
  });
});
