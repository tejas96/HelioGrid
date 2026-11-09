import { uuidv7 } from '@heliogrid/db/uuid';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Every "newest first" list orders by `desc(id)`, so ids made one after another must sort in the
 * order they were made — inside one millisecond too, where only the counter tells them apart.
 */
const madeInOrder = (count: number) => Array.from({ length: count }, () => uuidv7());
const sortedCopy = (ids: string[]) => [...ids].sort();
const A_MOMENT = Date.parse('2026-11-09T09:00:01Z');
const A_MOMENT_BEFORE_IT = Date.parse('2026-11-09T08:59:59Z');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ids made one after another sort in the order they were made', () => {
  it.each([
    { case: 'two in one millisecond', count: 2 },
    { case: 'a burst that runs the counter out', count: 5000 },
  ])('$case', ({ count }) => {
    vi.spyOn(Date, 'now').mockReturnValue(A_MOMENT);

    const ids = madeInOrder(count);

    expect(ids).toEqual(sortedCopy(ids));
    expect(new Set(ids).size).toBe(count);
  });

  it('a clock that steps back', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(A_MOMENT);
    const before = uuidv7();
    now.mockReturnValue(A_MOMENT_BEFORE_IT);

    expect(uuidv7() > before).toBe(true);
  });

  it('still reads as a version 7, variant 10 id', () => {
    expect(uuidv7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
