import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlatformActivities } from '../../src/modules/platform/platform.activities';

/**
 * The retry contract every activity in this product will rest on: Temporal re-runs an activity
 * after a timeout, a worker restart or a transport failure, and a re-run that applies a second
 * time is the defect the whole model assumes away.
 *
 * The CLOCK is the instrument, not object identity. A store that re-applies writes a new
 * timestamp, and a store that honours the key keeps the first one — but two real calls inside
 * one millisecond produce the same ISO string, so a clock that stands still would let a
 * re-applying store pass. Time is moved between calls for that reason.
 *
 * The bound is passed in, so eviction is proven over three keys rather than a thousand and no
 * two cases share a store.
 */
const FIRST_MOMENT = new Date('2026-01-01T00:00:00.000Z');
/** Long enough that a store which re-applied would write a visibly different timestamp. */
const A_MINUTE = 60_000;
/** The store's bound, small enough that eviction is three calls rather than a thousand. */
const ROOM_FOR_TWO = 2;

describe('recordHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIRST_MOMENT);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('answers the first answer when the same event and beat arrive again', async () => {
    const { recordHeartbeat } = createPlatformActivities(ROOM_FOR_TWO);

    const applied = await recordHeartbeat('event-a', 1);
    vi.advanceTimersByTime(A_MINUTE);
    const retried = await recordHeartbeat('event-a', 1);

    expect(retried).toEqual(applied);
    expect(retried.at).toBe(FIRST_MOMENT.toISOString());
  });

  it('answers separately for each beat of one event', async () => {
    const { recordHeartbeat } = createPlatformActivities(ROOM_FOR_TWO);

    const first = await recordHeartbeat('event-a', 1);
    vi.advanceTimersByTime(A_MINUTE);
    const second = await recordHeartbeat('event-a', 2);

    expect(second.key).not.toBe(first.key);
    expect(second.at).not.toBe(first.at);
  });

  it('remembers every key while the store has room', async () => {
    const { recordHeartbeat } = createPlatformActivities(ROOM_FOR_TWO);

    const oldest = await recordHeartbeat('event-a', 1);
    await recordHeartbeat('event-b', 1);
    vi.advanceTimersByTime(A_MINUTE);

    expect(await recordHeartbeat('event-a', 1)).toEqual(oldest);
  });

  it('forgets the oldest key once the store is full, and keeps the newest', async () => {
    const { recordHeartbeat } = createPlatformActivities(ROOM_FOR_TWO);

    const oldest = await recordHeartbeat('event-a', 1);
    const kept = await recordHeartbeat('event-b', 1);
    await recordHeartbeat('event-c', 1);
    vi.advanceTimersByTime(A_MINUTE);

    // The survivor is read FIRST: re-asking for the forgotten key applies it again, which
    // evicts the next-oldest in its turn.
    expect(await recordHeartbeat('event-b', 1)).toEqual(kept);
    expect((await recordHeartbeat('event-a', 1)).at).not.toBe(oldest.at);
  });
});
