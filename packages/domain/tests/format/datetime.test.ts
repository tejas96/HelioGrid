import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatMonthYear,
  formatTime,
  monthNames,
  weekdayNames,
} from '../../src/format/datetime';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';

const TWELVE_HOUR: FormatPack = { ...IN_FORMATS, clock: '12h' };
/** A market whose week starts Monday — the ISO answer, and NOT India's. */
const MONDAY_FIRST: FormatPack = { ...IN_FORMATS, firstDayOfWeek: 1 };

describe('formatDate — the tenant timezone, never the device (F3-22, F1-48)', () => {
  it('renders the pack style', () => {
    expect(formatDate(IN_FORMATS, '2026-03-12T06:00:00Z')).toBe('12 Mar 2026');
  });

  it('takes a Date and an epoch as readily as a string', () => {
    expect(formatDate(IN_FORMATS, new Date('2026-03-12T06:00:00Z'))).toBe('12 Mar 2026');
    expect(formatDate(IN_FORMATS, Date.parse('2026-03-12T06:00:00Z'))).toBe('12 Mar 2026');
  });

  it('crosses midnight on the tenant clock, not UTC', () => {
    /* 19:00 UTC is 00:30 the NEXT day in Asia/Kolkata. Without the pack's zone this reads
       11 Mar — a rep abroad seeing yesterday's date on today's job. */
    expect(formatDate(IN_FORMATS, '2026-03-11T19:00:00Z')).toBe('12 Mar 2026');
    expect(formatDate({ ...IN_FORMATS, timeZone: 'UTC' }, '2026-03-11T19:00:00Z')).toBe(
      '11 Mar 2026',
    );
  });

  it('hands back an unparseable string untouched, and nothing for an invalid Date', () => {
    /* Returning the input beats returning "Invalid Date": whatever the server sent is at
       least true, and it is visibly wrong rather than plausibly wrong. */
    expect(formatDate(IN_FORMATS, 'not a date')).toBe('not a date');
    expect(formatDate(IN_FORMATS, new Date('not a date'))).toBe('');
  });
});

describe('formatMonthYear', () => {
  it('renders a calendar heading', () => {
    expect(formatMonthYear(IN_FORMATS, '2026-03-12T06:00:00Z')).toBe('March 2026');
  });

  it('renders nothing it cannot parse', () => {
    expect(formatMonthYear(IN_FORMATS, 'not a date')).toBe('');
  });
});

describe('formatTime — wall clock in, wall clock out', () => {
  it.each([
    ['17:00', '17:00'],
    ['9:05', '09:05'],
    ['00:00', '00:00'],
    ['  17:00  ', '17:00'],
  ])('24h: %s → %s', (input, expected) => {
    expect(formatTime(IN_FORMATS, input)).toBe(expected);
  });

  it.each([
    ['17:00', '5:00 PM'],
    /* Midnight and noon are where a 12-hour clock is got wrong: `0 % 12` is 0, not 12. */
    ['00:30', '12:30 AM'],
    ['12:00', '12:00 PM'],
    ['11:59', '11:59 AM'],
  ])('12h: %s → %s', (input, expected) => {
    expect(formatTime(TWELVE_HOUR, input)).toBe(expected);
  });

  it.each([['25:00'], ['17:60'], ['noon'], ['']])('hands %o back unchanged', (input) => {
    expect(formatTime(IN_FORMATS, input)).toBe(input);
  });
});

describe('month and weekday names', () => {
  it('names twelve months in calendar order', () => {
    expect(monthNames(IN_FORMATS)).toHaveLength(12);
    expect(monthNames(IN_FORMATS)[0]).toBe('January');
    expect(monthNames(IN_FORMATS, 'short')[0]).toBe('Jan');
  });

  it('starts the week where the MARKET starts it, not where ISO does', () => {
    /* The calendar grid hard-coded Monday while the shipped India pack starts Sunday —
       every date in the grid was then one column out. */
    expect(weekdayNames(IN_FORMATS, 'long')[0]).toBe('Sunday');
    expect(weekdayNames(MONDAY_FIRST, 'long')[0]).toBe('Monday');
    expect(weekdayNames(IN_FORMATS)).toHaveLength(7);
  });
});
