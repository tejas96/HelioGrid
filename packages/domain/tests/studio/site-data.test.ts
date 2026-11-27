import { describe, expect, it } from 'vitest';
import { heightFromFloors } from '../../src/studio/site-data';

/** A roof's height from its floors (`T-M05-002`, part g): the plinth, then a storey each. */

describe('a roof’s height from its floors', () => {
  it.each([
    ['G: the plinth and one storey', 0, 3.45],
    ['G+1', 1, 6.45],
    ['G+3', 3, 12.45],
  ])('%s', (_, floors, height) => {
    expect(heightFromFloors(floors, { plinthHeightM: 0.45, storeyHeightM: 3 })).toBe(height);
  });
});
