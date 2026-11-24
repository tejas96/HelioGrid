import { describe, expect, it } from 'vitest';
import {
  FRAMES_JUDGED,
  movingFrames,
  SCENE_DETAIL_LOOK,
  type SceneDetail,
  sceneDetailAfter,
  sceneDetailAtStart,
  sceneDetailHeard,
  sceneDetailStart,
} from '../../src/studio/scene-detail';

/**
 * How much detail the 3D view draws (`T-M05-002`, G034): full, a step lower on a small device, and
 * a step lower again each time it draws slowly while it moves; never back up.
 */
describe('the detail the view opens at', () => {
  it.each([
    ['a device that says nothing of itself: full', null, null, 'full'],
    ['8 cores and 8 GB: full', 8, 8, 'full'],
    ['5 cores: full', 5, null, 'full'],
    ['4 cores: a step lower', 4, null, 'lighter'],
    ['4 GB: a step lower', null, 4, 'lighter'],
    ['8 cores but 2 GB: a step lower', 8, 2, 'lighter'],
  ] as const)('%s', (_why, cores, memoryGb, detail) => {
    expect(sceneDetailAtStart({ cores, memoryGb })).toBe(detail);
  });
});

describe('the detail after the view moves', () => {
  const run = (ms: number, count = FRAMES_JUDGED) => Array.from({ length: count }, () => ms);

  it.each([
    ['smooth frames keep it', 'full', run(16), 'full'],
    ['frames at the slow line keep it', 'full', run(40), 'full'],
    ['slow frames take it a step lower', 'full', run(41), 'lighter'],
    ['slow again: the lowest', 'lighter', run(60), 'light'],
    ['the lowest stays the lowest', 'light', run(90), 'light'],
    ['too few frames say nothing yet', 'full', run(90, FRAMES_JUDGED - 1), 'full'],
    [
      'a few slow frames among smooth ones keep it',
      'full',
      [...run(16, 20), ...run(90, 10)],
      'full',
    ],
  ] as const)('%s', (_why, now: SceneDetail, frames, after) => {
    expect(sceneDetailAfter(now, frames)).toBe(after);
  });

  it('a gap after rest is no frame of movement', () => {
    expect(movingFrames([16, 0, 1800, 250, 251, 33])).toEqual([16, 250, 33]);
  });

  it('each step lower draws fewer pixels and a smaller shadow map', () => {
    const { full, lighter, light } = SCENE_DETAIL_LOOK;
    expect(lighter.maxPixelRatio).toBeLessThan(full.maxPixelRatio);
    expect(light.maxPixelRatio).toBeLessThan(lighter.maxPixelRatio);
    expect(lighter.shadowMapPx).toBeLessThan(full.shadowMapPx);
    expect(light.shadowMapPx).toBeLessThan(lighter.shadowMapPx);
  });
});

describe('the view hears each frame it draws', () => {
  const REST_MS = 1800;
  const heard = (gaps: readonly number[]) =>
    gaps.reduce(sceneDetailHeard, sceneDetailStart({ cores: 8, memoryGb: 8 }));
  const slow = Array.from({ length: FRAMES_JUDGED }, () => 60);

  it('a run of slow frames takes it a step lower and starts the judging again', () => {
    expect(heard([REST_MS, ...slow])).toEqual({ detail: 'lighter', moving: [], rested: true });
  });

  it('the flight that opens the view is not judged: frames count once it has rested', () => {
    expect(heard(slow).detail).toBe('full');
  });

  it('a gap after rest is no frame of movement', () => {
    const rested = heard([REST_MS]);
    expect(sceneDetailHeard(rested, REST_MS)).toBe(rested);
  });

  it('it keeps no more frames than one judging reads', () => {
    const smooth = Array.from({ length: FRAMES_JUDGED + 5 }, () => 16);
    expect(heard([REST_MS, ...smooth]).moving).toHaveLength(FRAMES_JUDGED);
  });
});
