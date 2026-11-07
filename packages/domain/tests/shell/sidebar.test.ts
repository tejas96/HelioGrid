import { describe, expect, it } from 'vitest';
import { workListLanded } from '../../src/shell/sidebar';
import { WORK_DESTINATIONS } from '../../src/shell/standing-destinations';

describe('workListLanded — a list whose module has not shipped is marked Soon', () => {
  it.each(WORK_DESTINATIONS)('%s opens the placeholder door today', (destination) => {
    expect(workListLanded(destination)).toBe(false);
  });
});
