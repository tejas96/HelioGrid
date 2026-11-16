import { describe, expect, it } from 'vitest';
import { springCurve } from '../src/spring-curve';
import { SPRING } from '../src/tokens/motion';

/**
 * The web plays each spring token as a sampled `linear()` curve: it must start at rest, end exactly
 * in place, and last as long as the spring takes to settle — or a sheet stops short or jumps.
 */
describe('each spring token as a web curve', () => {
  for (const [name, spring] of Object.entries(SPRING)) {
    it(`${name} starts at 0, ends at 1 and settles in under a second`, () => {
      const { durationMs, easing } = springCurve(spring);
      const points = easing.slice('linear('.length, -1).split(',').map(Number);
      expect(points[0]).toBe(0);
      expect(points.at(-1)).toBe(1);
      expect(durationMs).toBeGreaterThan(100);
      expect(durationMs).toBeLessThan(1000);
    });
  }

  it('a stiffer spring settles sooner', () => {
    expect(springCurve(SPRING.snappy).durationMs).toBeLessThan(
      springCurve(SPRING.layout).durationMs,
    );
    expect(springCurve(SPRING.layout).durationMs).toBeLessThan(
      springCurve(SPRING.gentle).durationMs,
    );
  });
});
