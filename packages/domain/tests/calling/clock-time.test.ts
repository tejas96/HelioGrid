import { describe, expect, it } from 'vitest';
import { clockTime, clockTimeHhmm } from '../../src/calling/clock-time';

describe('clockTime — the one door into a policy time of day (F1-36, F1-62)', () => {
  it.each([
    ['00:00', 0],
    ['09:00', 540],
    ['19:00', 1140],
    ['21:00', 1260],
    ['23:59', 1439],
  ])('reads %s as %i minutes past midnight', (hhmm, minutes) => {
    expect(clockTime(hhmm)).toBe(minutes);
  });

  it.each([
    ['9:00', 'an unpadded hour — one hour would have two spellings in the data'],
    ['24:00', 'an hour past the clock'],
    ['09:60', 'a minute past the hour'],
    ['0900', 'the separator dropped'],
    ['7pm', 'a 12-hour spelling — that parse belongs to what a person types'],
    ['', 'nothing at all'],
  ])('refuses %s — %s', (hhmm) => {
    expect(() => clockTime(hhmm)).toThrow(RangeError);
  });
});

describe('clockTimeHhmm — back to the spelling formatTime renders', () => {
  it.each(['00:00', '09:00', '19:00', '23:59'])('round-trips %s unchanged', (hhmm) => {
    expect(clockTimeHhmm(clockTime(hhmm))).toBe(hhmm);
  });
});
