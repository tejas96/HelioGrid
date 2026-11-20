import { describe, expect, it } from 'vitest';
import { stepRail } from '../../src/studio/steps';

describe('the step rail', () => {
  it.each([false, true])(
    'opens with the site, done and open to change, then the roof in hand (roof closed: %s)',
    (roofClosed) => {
      const [site, roof] = stepRail(roofClosed);
      expect(site).toEqual({ step: 'site', here: false, lock: null });
      expect(roof).toEqual({ step: 'roof', here: true, lock: null });
    },
  );

  it.each([
    [false, 'needs_roof'],
    [true, null],
  ] as const)('objects wait for a closed roof (roof closed: %s → %s)', (roofClosed, lock) => {
    expect(stepRail(roofClosed).find((place) => place.step === 'objects')?.lock).toBe(lock);
  });

  it('holds exactly one step in hand', () => {
    expect(stepRail(false).filter((place) => place.here)).toHaveLength(1);
  });
});
