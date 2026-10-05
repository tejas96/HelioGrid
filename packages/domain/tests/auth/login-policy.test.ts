import { describe, expect, it } from 'vitest';
import { countdownClock } from '../../src/auth/login-policy';

describe('countdownClock — the resend wait as the control reads it', () => {
  it.each<[number, string]>([
    [30, '0:30'],
    [9, '0:09'],
    [1, '0:01'],
    [0, '0:00'],
    [60, '1:00'],
    [75, '1:15'],
    [-3, '0:00'],
  ])('%i s reads %s', (seconds, clock) => {
    expect(countdownClock(seconds)).toBe(clock);
  });
});
