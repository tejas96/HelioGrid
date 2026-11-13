import { describe, expect, it } from 'vitest';
import { calendarDayAfter } from '../../src/format/zone';

describe('calendarDayAfter — calendar arithmetic on the date itself', () => {
  it.each([
    ['2026-11-12', 1, '2026-11-13'],
    ['2026-11-30', 1, '2026-12-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-03-08', 1, '2026-03-09'],
    ['2026-11-12', 0, '2026-11-12'],
    ['2026-11-12', -14, '2026-10-29'],
    ['2026-11-12', 8, '2026-11-20'],
  ] as const)('%s + %i → %s', (date, days, after) => {
    expect(calendarDayAfter(date, days)).toBe(after);
  });
});
