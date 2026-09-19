import { describe, expect, it } from 'vitest';
import { pushIsDue } from '../../src/notifications/delivery';

/**
 * `F6-13` and `F6-06` — whether a push leaves NOW. Four facts decide it and nothing else: the
 * channels this type still delivers on for this reader (`T-FPLAT-018`'s answer), the instant it
 * fell due, whether one was already sent, and the clock.
 */
const AT = 1_800_000_000_000;
const BOTH = ['in_app', 'push'] as const;
const RECORD_ONLY = ['in_app'] as const;

describe('pushIsDue — whether a push leaves now (F6-06, F6-13)', () => {
  it('leaves when it is due and nothing has been sent', () => {
    expect(pushIsDue(BOTH, AT, null, AT)).toBe(true);
  });

  it.each([
    ['one millisecond before it falls due', AT - 1, false],
    ['exactly when it falls due', AT, true],
    ['long after it fell due', AT + 60_000, true],
  ])('reads the due instant at its edge — %s', (_why, now, expected) => {
    expect(pushIsDue(BOTH, AT, null, now)).toBe(expected);
  });

  it('never leaves twice: a record that already carries a sent marker is done', () => {
    expect(pushIsDue(BOTH, AT, AT, AT + 60_000)).toBe(false);
  });

  it('never leaves for a type whose channels say record only — a mute, or a type that never pushed', () => {
    expect(pushIsDue(RECORD_ONLY, AT, null, AT)).toBe(false);
  });

  it('never leaves on an empty channel set, which the record law should make impossible anyway', () => {
    expect(pushIsDue([], AT, null, AT)).toBe(false);
  });
});
