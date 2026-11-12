import { describe, expect, it } from 'vitest';
import { firstDayOf, monthOf, monthShifted, monthSpan } from '../../src/format/month';

describe('company months (F1-10)', () => {
  it.each([
    ['2026-11', -1, '2026-10'],
    ['2026-01', -1, '2025-12'],
    ['2026-12', 1, '2027-01'],
    ['2026-11', 0, '2026-11'],
    ['2026-03', -14, '2025-01'],
  ] as const)('%s shifted %i is %s', (month, by, shifted) => {
    expect(monthShifted(month, by)).toBe(shifted);
  });

  it('a day names its month, a month its first day', () => {
    expect(monthOf('2026-11-30')).toBe('2026-11');
    expect(firstDayOf('2026-11')).toBe('2026-11-01');
  });

  it('a month spans its first local midnight to the next', () => {
    const span = monthSpan('2026-11', 'Asia/Kolkata');
    expect(new Date(span.from).toISOString()).toBe('2026-10-31T18:30:00.000Z');
    expect(new Date(span.to).toISOString()).toBe('2026-11-30T18:30:00.000Z');
  });
});
