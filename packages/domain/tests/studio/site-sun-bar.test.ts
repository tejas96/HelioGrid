import { describe, expect, it } from 'vitest';
import {
  compassPointOf,
  siteDayOf,
  siteTimeZoneOf,
  sunBarViewOf,
  sunNextHour,
  sunPickDay,
  sunPickOpened,
  sunPickSlid,
  sunPlayedTo,
} from '../../src/studio/site-sun-bar';

/**
 * The sun bar (`T-M05-002`, part g, board G8–G13): the day chips for each half of the globe, the
 * day line on the site's own clock, the polar night, and play.
 */

const SANGLI = { latitude: 16.85, longitude: 74.58 };
const SYDNEY = { latitude: -33.87, longitude: 151.21 };
const JAKARTA = { latitude: -6.2, longitude: 106.8 };
const TROMSO = { latitude: 69.65, longitude: 18.96 };
const KOLKATA = 'Asia/Kolkata';
/** 26 Nov 2026, 12:00 in India. */
const NOON_IN_INDIA = Date.UTC(2026, 10, 26, 6, 30);
const clockIn = (timeZone: string, atMs: number) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(atMs);

describe('the site’s clock and compass', () => {
  it.each([
    ['a named zone is kept', 'Asia/Kolkata', 74, 'Asia/Kolkata'],
    ['at sea east of Greenwich', null, 75, 'Etc/GMT-5'],
    ['at sea west of it', null, -120, 'Etc/GMT+8'],
    ['at sea on it', null, 7, 'Etc/UTC'],
    ['by the date line, east', null, 179, 'Etc/GMT-12'],
    ['by the date line, west', null, -179, 'Etc/GMT+12'],
  ])('%s', (_, zone, longitude, expected) => {
    expect(siteTimeZoneOf(zone, longitude)).toBe(expected);
  });

  it('the site’s day is its own clock’s: 20:00 UTC is the next day in India', () => {
    expect(siteDayOf(KOLKATA, Date.UTC(2026, 10, 26, 20))).toEqual({
      year: 2026,
      month: 11,
      day: 27,
    });
  });

  it.each([
    [0, 'n'],
    [22.4, 'n'],
    [22.5, 'ne'],
    [127, 'se'],
    [180, 's'],
    [337.4, 'nw'],
    [337.5, 'n'],
    [-10, 'n'],
  ])('%s° is %s', (azimuth, point) => {
    expect(compassPointOf(azimuth)).toBe(point);
  });
});

describe('the day picked', () => {
  it('opens on today at the site’s now while the sun is up', () => {
    expect(sunPickOpened(SANGLI, KOLKATA, NOON_IN_INDIA)).toEqual({
      day: 'today',
      atMs: NOON_IN_INDIA,
    });
  });

  it('opens at night on the middle of today’s sun', () => {
    const night = Date.UTC(2026, 10, 26, 17, 30);
    const pick = sunPickOpened(SANGLI, KOLKATA, night);
    expect(clockIn(KOLKATA, pick.atMs)).toMatch(/^12:/);
  });

  it('another day keeps the clock time', () => {
    const today = sunPickOpened(SANGLI, KOLKATA, Date.UTC(2026, 10, 26, 3, 30));
    const winter = sunPickDay(today, 'winter', SANGLI, KOLKATA, NOON_IN_INDIA);
    expect(winter.day).toBe('winter');
    expect(clockIn(KOLKATA, winter.atMs)).toBe('09:00');
  });

  it('a clock time before that day’s sunrise lands on its sunrise', () => {
    const early = { day: 'summer' as const, atMs: Date.UTC(2026, 5, 21, 0, 30) };
    const winter = sunPickDay(early, 'winter', SANGLI, KOLKATA, NOON_IN_INDIA);
    const view = sunBarViewOf(winter, SANGLI, KOLKATA, NOON_IN_INDIA);
    expect(view.line?.minutes).toBe(0);
  });

  it.each([
    ['before sunrise', -30, 0],
    ['on the line', 90, 90],
    ['after sunset', 99_999, null],
  ])('a slide %s is kept on the line', (_, minutes, expected) => {
    const pick = sunPickOpened(SANGLI, KOLKATA, NOON_IN_INDIA);
    const line = sunBarViewOf(pick, SANGLI, KOLKATA, NOON_IN_INDIA).line;
    if (line === null) throw new Error('no line');
    const slid = sunBarViewOf(sunPickSlid(pick, line, minutes), SANGLI, KOLKATA, NOON_IN_INDIA);
    expect(slid.line?.minutes).toBe(expected ?? line.spanMinutes);
  });
});

describe('the day’s view', () => {
  it('Sangli in winter: 21 Dec, sunrise near 7:00, the sun in the south-east at 9:00', () => {
    const pick = { day: 'winter' as const, atMs: Date.UTC(2026, 11, 21, 3, 30) };
    const view = sunBarViewOf(pick, SANGLI, KOLKATA, NOON_IN_INDIA);
    expect(view.date).toEqual({ year: 2026, month: 12, day: 21 });
    expect(view.line?.rise.hour).toBe(6);
    expect(view.bearing).toBe('se');
    expect(view.line?.ticks.every((tick) => tick.at.minute === 0)).toBe(true);
    expect(view.hours.length).toBeGreaterThan(3);
  });

  it('Sydney: Winter is 21 June, and its noon sun stands in the north', () => {
    const view = sunBarViewOf(
      { day: 'winter', atMs: Date.UTC(2026, 5, 21, 2) },
      SYDNEY,
      'Australia/Sydney',
      NOON_IN_INDIA,
    );
    expect(view.date.month).toBe(6);
    expect(view.bearing).toBe('n');
  });

  it('near the equator the chips are dates', () => {
    const view = sunBarViewOf(
      { day: 'today', atMs: NOON_IN_INDIA },
      JAKARTA,
      'Asia/Jakarta',
      NOON_IN_INDIA,
    );
    expect(view.chips.map((chip) => chip.key)).toEqual(['june', 'december', 'equinox', 'today']);
  });

  it('Tromsø on 21 Dec: the sun stays down — no line, no sun, no path', () => {
    const view = sunBarViewOf(
      { day: 'winter', atMs: Date.UTC(2026, 11, 21, 11) },
      TROMSO,
      'Europe/Oslo',
      NOON_IN_INDIA,
    );
    expect(view.light).toBe('polar_night');
    expect([view.line, view.sun, view.path.length]).toEqual([null, null, 0]);
  });
});

describe('play', () => {
  const pick = { day: 'winter' as const, atMs: Date.UTC(2026, 11, 21, 3, 30) };
  const line = sunBarViewOf(pick, SANGLI, KOLKATA, NOON_IN_INDIA).line;
  if (line === null) throw new Error('no line');

  it.each([
    ['at the start', 0, line.fromMs],
    ['half way through 6 s', 3_000, (line.fromMs + line.toMs) / 2],
    ['past the end', 9_000, line.toMs],
  ])('%s', (_, elapsed, expected) => {
    expect(sunPlayedTo(line, line.fromMs, elapsed)).toBe(expected);
  });

  it('Reduce Motion steps to the next whole hour on India’s clock, then stops at sunset', () => {
    const tenPastNine = Date.UTC(2026, 11, 21, 3, 40);
    expect(clockIn(KOLKATA, sunNextHour(line, tenPastNine, KOLKATA))).toBe('10:00');
    expect(sunNextHour(line, line.toMs - 1, KOLKATA)).toBe(line.toMs);
  });
});
