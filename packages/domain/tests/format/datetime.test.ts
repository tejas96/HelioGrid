import { describe, expect, it } from 'vitest';
import {
  formatClockAt,
  formatDate,
  formatMonthYear,
  formatTime,
  formatWeekday,
  monthNames,
  weekdayNames,
} from '../../src/format/datetime';
import type { UiLanguage } from '../../src/format/languages';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';

const TWELVE_HOUR: FormatPack = { ...IN_FORMATS, clock: '12h' };
/** A market whose week starts Monday — the ISO answer, and NOT India's. */
const MONDAY_FIRST: FormatPack = { ...IN_FORMATS, firstDayOfWeek: 1 };

describe('formatDate — the tenant timezone, never the device (F3-22, F1-48)', () => {
  it('renders the pack style', () => {
    expect(formatDate(IN_FORMATS, '2026-03-12T06:00:00Z', 'en')).toBe('12 Mar 2026');
  });

  it('takes a Date and an epoch as readily as a string', () => {
    expect(formatDate(IN_FORMATS, new Date('2026-03-12T06:00:00Z'), 'en')).toBe('12 Mar 2026');
    expect(formatDate(IN_FORMATS, Date.parse('2026-03-12T06:00:00Z'), 'en')).toBe('12 Mar 2026');
  });

  it('crosses midnight on the tenant clock, not UTC', () => {
    /* 19:00 UTC is 00:30 the NEXT day in Asia/Kolkata. Without the pack's zone this reads
       11 Mar — a rep abroad seeing yesterday's date on today's job. */
    expect(formatDate(IN_FORMATS, '2026-03-11T19:00:00Z', 'en')).toBe('12 Mar 2026');
    expect(formatDate({ ...IN_FORMATS, timeZone: 'UTC' }, '2026-03-11T19:00:00Z', 'en')).toBe(
      '11 Mar 2026',
    );
  });

  it('hands back an unparseable string untouched, and nothing for an invalid Date', () => {
    /* Returning the input beats returning "Invalid Date": whatever the server sent is at
       least true, and it is visibly wrong rather than plausibly wrong. */
    expect(formatDate(IN_FORMATS, 'not a date', 'en')).toBe('not a date');
    expect(formatDate(IN_FORMATS, new Date('not a date'), 'en')).toBe('');
  });
});

describe('formatMonthYear', () => {
  it('renders a calendar heading', () => {
    expect(formatMonthYear(IN_FORMATS, '2026-03-12T06:00:00Z', 'en')).toBe('March 2026');
  });

  it('renders nothing it cannot parse', () => {
    expect(formatMonthYear(IN_FORMATS, 'not a date', 'en')).toBe('');
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
    expect(monthNames(IN_FORMATS, 'en')).toHaveLength(12);
    expect(monthNames(IN_FORMATS, 'en')[0]).toBe('January');
    expect(monthNames(IN_FORMATS, 'en', 'short')[0]).toBe('Jan');
  });

  it('starts the week where the MARKET starts it, not where ISO does', () => {
    /* The calendar grid hard-coded Monday while the shipped India pack starts Sunday —
       every date in the grid was then one column out. */
    expect(weekdayNames(IN_FORMATS, 'en', 'long')[0]).toBe('Sunday');
    expect(weekdayNames(MONDAY_FIRST, 'en', 'long')[0]).toBe('Monday');
    expect(weekdayNames(IN_FORMATS, 'en')).toHaveLength(7);
  });
});

describe('formatClockAt — when an event happened, on the tenant clock (F3-22)', () => {
  it.each([
    ['the pack clock, 24-hour', IN_FORMATS, '2026-08-19T10:42:00Z', '16:12'],
    ['the pack clock, 12-hour', TWELVE_HOUR, '2026-08-19T10:42:00Z', '4:12 PM'],
    ['midnight on the tenant clock', IN_FORMATS, '2026-08-18T18:30:00Z', '00:00'],
    ['one minute before it', IN_FORMATS, '2026-08-18T18:29:00Z', '23:59'],
  ])('%s', (_, pack, stamp, clock) => {
    expect(formatClockAt(pack, stamp)).toBe(clock);
  });

  it('answers nothing for an unparseable stamp', () => {
    expect(formatClockAt(IN_FORMATS, 'not a date')).toBe('');
  });
});

describe('formatWeekday — the day by its name, on the tenant clock', () => {
  it.each([
    ['a Monday', '2026-08-17T06:00:00Z', 'Monday'],
    ['00:30 IST is already Tuesday, though UTC says Monday', '2026-08-17T19:00:00Z', 'Tuesday'],
  ])('%s', (_, stamp, name) => {
    expect(formatWeekday(IN_FORMATS, stamp, 'en')).toBe(name);
  });
});

describe("a date's words in the reader's language, its order and digits the pack's (F3-22, F3-21)", () => {
  const MARCH = '2026-03-12T06:00:00Z';
  const OCTOBER = '2026-10-01T06:00:00Z';
  const MONDAY = '2026-08-17T06:00:00Z';

  /* Marathi's own pattern would print `1 ऑक्टो, 2026` — a comma the India pack does not write —
     so the Marathi row is where a whole-date reader locale would show. */
  it.each<[UiLanguage, string, string, string, string]>([
    ['en', '12 Mar 2026', '1 Oct 2026', 'Monday', 'March 2026'],
    ['hi', '12 मार्च 2026', '1 अक्टू॰ 2026', 'सोमवार', 'मार्च 2026'],
    ['mr', '12 मार्च 2026', '1 ऑक्टो 2026', 'सोमवार', 'मार्च 2026'],
  ])('%s: %s · %s · %s · %s', (language, march, october, monday, heading) => {
    expect(formatDate(IN_FORMATS, MARCH, language)).toBe(march);
    expect(formatDate(IN_FORMATS, OCTOBER, language)).toBe(october);
    expect(formatWeekday(IN_FORMATS, MONDAY, language)).toBe(monday);
    expect(formatMonthYear(IN_FORMATS, MARCH, language)).toBe(heading);
  });

  it.each<[UiLanguage, string, string]>([
    ['en', 'Jan', 'Sunday'],
    ['hi', 'जन॰', 'रविवार'],
    ['mr', 'जाने', 'रविवार'],
  ])(
    "%s: a calendar names its months and days in the reader's words, from the market's first day",
    (language, january, sunday) => {
      expect(monthNames(IN_FORMATS, language, 'short')[0]).toBe(january);
      expect(weekdayNames(IN_FORMATS, language, 'long')[0]).toBe(sunday);
    },
  );

  it('keeps the tenant clock in every language: 00:30 IST is the next day', () => {
    expect(formatDate(IN_FORMATS, '2026-03-11T19:00:00Z', 'mr')).toBe('12 मार्च 2026');
  });
});
