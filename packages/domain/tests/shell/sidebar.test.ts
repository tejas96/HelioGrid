import { describe, expect, it } from 'vitest';
import { workListLanded } from '../../src/shell/sidebar';
import type { WorkDestination } from '../../src/shell/standing-destinations';

describe('workListLanded — a list whose module has not shipped is marked Soon', () => {
  it.each<[WorkDestination, boolean]>([
    ['leads', true],
    ['proposals', false],
    ['projects', true],
    ['people', false],
    ['campaigns', false],
  ])('%s opens its own page: %s', (destination, landed) => {
    expect(workListLanded(destination)).toBe(landed);
  });
});
