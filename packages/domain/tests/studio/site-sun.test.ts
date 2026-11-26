import { describe, expect, it } from 'vitest';
import {
  shadeStretches,
  skylineAt,
  skylineAtBearing,
  skylineFromSouthBearings,
  skylinesJoined,
} from '../../src/studio/site-skyline';
import {
  siteClockOf,
  siteMidnightMs,
  sunDayChips,
  sunDayLightOf,
  sunDayTicks,
  sunPathOf,
  zoneOffsetMinutes,
} from '../../src/studio/site-sun';
import {
  roofSunlightOf,
  skyViewOf,
  sunlightSpread,
  sunShareOf,
  sunSharesOf,
  yearSunSamples,
} from '../../src/studio/site-sunlight';
import { gridOf, inBox } from './site-support';

/**
 * The sun bar, the sun chart and sunlight (`T-M05-002`, part g): the day chips for each half of
 * the globe, the day on the site's own clock, the skyline the height map and the far hills make,
 * the shade it casts, and the share of the year's sun a spot keeps.
 */

const TODAY = { year: 2026, month: 11, day: 26 };
const PUNE = { latitude: 18.52, longitude: 73.86 };
const MUNICH = { latitude: 48.14, longitude: 11.58 };
const TROMSO = { latitude: 69.65, longitude: 18.96 };
const REYKJAVIK = { latitude: 64.15, longitude: -21.94 };
const MINUTE = 60_000;

describe('the day chips for the site’s half of the globe', () => {
  it.each([
    ['north of 10°: Winter is 21 Dec', 10, ['winter', 12], ['summer', 6]],
    ['south of −10°: Winter is 21 Jun', -10, ['winter', 6], ['summer', 12]],
    ['just inside 10°: the chips read as dates', 9.99, ['june', 6], ['december', 12]],
    ['just inside −10°', -9.99, ['june', 6], ['december', 12]],
  ])('%s', (_, latitude, first, second) => {
    const chips = sunDayChips(latitude, TODAY);
    expect(chips.map((chip) => chip.key)).toEqual([first[0], second[0], 'equinox', 'today']);
    expect(chips[0]?.on).toEqual({ year: 2026, month: first[1], day: 21 });
    expect(chips[1]?.on.month).toBe(second[1]);
    expect(chips[3]?.on).toEqual(TODAY);
  });
});

describe('the site’s own clock', () => {
  it.each([
    ['Pune, a half-hour zone with no summer time', 'Asia/Kolkata', Date.UTC(2026, 6, 1), 330],
    ['Kathmandu, a quarter-hour zone', 'Asia/Kathmandu', Date.UTC(2026, 0, 1), 345],
    ['Munich in winter', 'Europe/Berlin', Date.UTC(2026, 0, 15), 60],
    ['Munich in summer time', 'Europe/Berlin', Date.UTC(2026, 6, 15), 120],
    ['Sydney in its summer, our winter', 'Australia/Sydney', Date.UTC(2026, 11, 21), 660],
    ['Sydney in its winter', 'Australia/Sydney', Date.UTC(2026, 5, 21), 600],
  ])('%s', (_, zone, at, minutes) => {
    expect(zoneOffsetMinutes(zone, at)).toBe(minutes);
  });

  it('midnight on the site’s calendar, and the clock it reads', () => {
    const midnight = siteMidnightMs('Asia/Kolkata', { year: 2026, month: 12, day: 21 });
    expect(midnight).toBe(Date.UTC(2026, 11, 20, 18, 30));
    expect(siteClockOf('Asia/Kolkata', midnight + 7 * 60 * MINUTE + 50 * MINUTE)).toEqual({
      hour: 7,
      minute: 50,
    });
  });

  it('the day Munich’s clocks go forward has 23 hours', () => {
    const before = siteMidnightMs('Europe/Berlin', { year: 2026, month: 3, day: 29 });
    const after = siteMidnightMs('Europe/Berlin', { year: 2026, month: 3, day: 30 });
    expect((after - before) / (60 * MINUTE)).toBe(23);
  });
});

describe('a day of sun at the site', () => {
  it('Pune on 21 Dec: sunrise near 7:00 and sunset near 18:00 on its clock', () => {
    const light = sunDayLightOf(PUNE, 'Asia/Kolkata', { year: 2026, month: 12, day: 21 });
    expect(light.kind).toBe('day');
    if (light.kind !== 'day') return;
    const rise = siteClockOf('Asia/Kolkata', light.sunriseMs);
    const set = siteClockOf('Asia/Kolkata', light.sunsetMs);
    expect(rise.hour * 60 + rise.minute).toBeGreaterThan(6 * 60 + 50);
    expect(rise.hour * 60 + rise.minute).toBeLessThan(7 * 60 + 15);
    expect(set.hour * 60 + set.minute).toBeGreaterThan(17 * 60 + 50);
    expect(set.hour * 60 + set.minute).toBeLessThan(18 * 60 + 15);
  });

  it('Munich in summer time rises before 5:30 by its own clock', () => {
    const light = sunDayLightOf(MUNICH, 'Europe/Berlin', { year: 2026, month: 6, day: 21 });
    expect(light.kind).toBe('day');
    if (light.kind === 'day') expect(siteClockOf('Europe/Berlin', light.sunriseMs).hour).toBe(5);
  });

  it('Reykjavik on 21 Jun: up at midnight, it rises near 3:00 and sets after the next midnight', () => {
    const light = sunDayLightOf(REYKJAVIK, 'Atlantic/Reykjavik', { year: 2026, month: 6, day: 21 });
    expect(light.kind).toBe('day');
    if (light.kind !== 'day') return;
    expect(siteClockOf('Atlantic/Reykjavik', light.sunriseMs).hour).toBe(2);
    expect(light.sunsetMs - light.sunriseMs).toBeGreaterThan(20 * 60 * MINUTE);
    expect(siteClockOf('Atlantic/Reykjavik', light.sunsetMs).hour).toBe(0);
  });

  it.each([
    ['Tromsø on 21 Dec: the sun stays down', { year: 2026, month: 12, day: 21 }, 'polar_night'],
    ['Tromsø on 21 Jun: the sun stays up', { year: 2026, month: 6, day: 21 }, 'midnight_sun'],
  ])('%s', (_, on, kind) => {
    expect(sunDayLightOf(TROMSO, 'Europe/Oslo', on).kind).toBe(kind);
  });

  it('the day line’s ticks fall on whole hours of the site’s clock, every 2 or every 3', () => {
    const from = Date.UTC(2026, 11, 21, 1, 20);
    const to = Date.UTC(2026, 11, 21, 12, 30);
    const every2 = sunDayTicks('Asia/Kolkata', from, to, 2).map((at) =>
      siteClockOf('Asia/Kolkata', at),
    );
    expect(every2.map((clock) => clock.hour)).toEqual([8, 10, 12, 14, 16, 18]);
    expect(every2.every((clock) => clock.minute === 0)).toBe(true);
    const every3 = sunDayTicks('Asia/Kolkata', from, to, 3).map(
      (at) => siteClockOf('Asia/Kolkata', at).hour,
    );
    expect(every3).toEqual([9, 12, 15, 18]);
  });

  it('the sun’s path holds a point each step and one at its end', () => {
    const path = sunPathOf(PUNE, 0, 25 * MINUTE, 10 * MINUTE);
    expect(path.map((point) => point.atMs)).toEqual([0, 10 * MINUTE, 20 * MINUTE, 25 * MINUTE]);
  });
});

describe('the skyline a spot sees', () => {
  /** A wall 6 m high and 20 m long, 10 m to the east of an eye on level ground. */
  const wallEast = gridOf(80, 0.5, (p) => (inBox(10, -10, 11, 10)(p) ? 6 : 0));
  const eye = { east: 0, north: 0, height: 1 };

  it('a wall to the east stands at its angle there, and nothing stands to the west', () => {
    const skyline = skylineAt(wallEast, eye);
    expect(skylineAtBearing(skyline, 90)).toBeCloseTo((Math.atan(5 / 10) * 180) / Math.PI, 0);
    expect(skylineAtBearing(skyline, 270)).toBe(0);
  });

  it('a bearing between two read ones lies between them; the turn wraps', () => {
    const skyline = { stepDeg: 90, elevationsDeg: [10, 20, 30, 40] };
    expect(skylineAtBearing(skyline, 45)).toBe(15);
    expect(skylineAtBearing(skyline, 315)).toBe(25);
    expect(skylineAtBearing(skyline, -45)).toBe(25);
    expect(skylineAtBearing({ stepDeg: 2, elevationsDeg: [] }, 30)).toBe(0);
  });

  it('PVGIS’s horizon (0 south, 90 west) turns to ours (0 north, 90 east)', () => {
    const far = skylineFromSouthBearings(
      [
        { bearingFromSouthDeg: -180, elevationDeg: 1 },
        { bearingFromSouthDeg: -90, elevationDeg: 29.8 },
        { bearingFromSouthDeg: 0, elevationDeg: 5 },
        { bearingFromSouthDeg: 90, elevationDeg: -2 },
      ],
      90,
    );
    expect(far?.elevationsDeg).toEqual([1, 29.8, 5, 0]);
    expect(skylineFromSouthBearings([], 2)).toBeNull();
  });

  it('the near and the far skyline join at the higher of the two', () => {
    const near = { stepDeg: 90, elevationsDeg: [10, 0, 0, 0] };
    const far = { stepDeg: 90, elevationsDeg: [2, 29.8, 0, 0] };
    expect(skylinesJoined(near, far).elevationsDeg).toEqual([10, 29.8, 0, 0]);
    expect(skylinesJoined(near, null)).toBe(near);
  });

  it('shade is where the path dips under the skyline: from the first point behind it to the first clear', () => {
    const skyline = { stepDeg: 90, elevationsDeg: [0, 20, 0, 0] };
    const path = [
      { atMs: 0, azimuthDegrees: 90, elevationDegrees: -1 },
      { atMs: 1, azimuthDegrees: 90, elevationDegrees: 5 },
      { atMs: 2, azimuthDegrees: 95, elevationDegrees: 15 },
      { atMs: 3, azimuthDegrees: 120, elevationDegrees: 25 },
      { atMs: 4, azimuthDegrees: 260, elevationDegrees: 5 },
      { atMs: 5, azimuthDegrees: 268, elevationDegrees: 1 },
    ];
    expect(shadeStretches(path, skyline)).toEqual([{ fromMs: 1, toMs: 3 }]);
    const evening = { stepDeg: 90, elevationsDeg: [0, 0, 0, 10] };
    expect(shadeStretches(path, evening)).toEqual([{ fromMs: 4, toMs: 5 }]);
  });
});

describe('sunlight: the share of the year’s sun a spot keeps', () => {
  const samples = yearSunSamples(PUNE, 2026);

  it('the year’s sun is 12 days of half hours it is up, each weighed by its height', () => {
    expect(samples.length).toBeGreaterThan(12 * 20);
    expect(samples.length).toBeLessThan(12 * 28);
    expect(samples.every((sample) => sample.elevationDeg > 0 && sample.weight > 0)).toBe(true);
  });

  it.each([
    ['an open roof keeps all of it', { stepDeg: 2, elevationsDeg: new Array(180).fill(0) }, 1],
    [
      'under a skyline at 90° all round it keeps none',
      { stepDeg: 2, elevationsDeg: new Array(180).fill(90) },
      0,
    ],
  ])('%s', (_, skyline, share) => {
    expect(sunShareOf(skyline, samples)).toBeCloseTo(share, 6);
  });

  it('the sky a spot sees: all of it in the open, half under a 45° skyline', () => {
    expect(skyViewOf({ stepDeg: 2, elevationsDeg: new Array(180).fill(0) })).toBe(1);
    expect(skyViewOf({ stepDeg: 2, elevationsDeg: new Array(180).fill(45) })).toBeCloseTo(0.5, 6);
    expect(skyViewOf({ stepDeg: 2, elevationsDeg: [] })).toBe(1);
  });

  it('a spot beside a tall wall to its south keeps less than one in the open', () => {
    const grid = gridOf(80, 0.5, (p) => (inBox(-20, -4, 20, -3)(p) ? 12 : 0));
    const [beside, open] = sunSharesOf(
      grid,
      [
        { east: 0, north: -2, height: 0.5 },
        { east: 0, north: 30, height: 0.5 },
      ],
      samples,
      null,
      40,
    );
    expect(beside ?? 1).toBeLessThan(0.7);
    expect(open ?? 0).toBeGreaterThan(0.97);
  });

  it('a roof’s spread: its shadiest tenth, its middle, its sunniest tenth', () => {
    const shares = Array.from({ length: 11 }, (_, i) => 0.6 + i * 0.04);
    expect(sunlightSpread(shares)).toEqual({ low: 0.64, middle: 0.8, high: 0.96 });
    expect(sunlightSpread([])).toBeNull();
  });
});

describe('a roof’s sunlight, a share for each metre (board G24)', () => {
  const samples = yearSunSamples(PUNE, 2026);
  const square = [
    { east: -4, north: -4 },
    { east: 4, north: -4 },
    { east: 4, north: 4 },
    { east: -4, north: 4 },
  ];

  it('an 8 m roof in the open: 64 metres, every one in full sun', () => {
    const sunlight = roofSunlightOf(
      gridOf(80, 0.5, () => 3),
      square,
      samples,
      null,
    );
    expect(sunlight.cells).toHaveLength(64);
    expect(sunlight.cells.every((cell) => cell.share > 0.99)).toBe(true);
  });

  it('a stair room on the south side shades the metres just north of it', () => {
    const room = inBox(-1, -4, 1, -2);
    const grid = gridOf(80, 0.5, (p) => (room(p) ? 6 : 3));
    const cells = roofSunlightOf(grid, square, samples, null).cells;
    const north = cells.find((cell) => cell.east === 0.5 && cell.north === -0.5);
    const far = cells.find((cell) => cell.east === 3.5 && cell.north === 3.5);
    expect(north?.share ?? 1).toBeLessThan(far?.share ?? 0);
  });

  it('a roof the map does not reach has no metres', () => {
    const off = square.map((p) => ({ east: p.east + 200, north: p.north }));
    expect(
      roofSunlightOf(
        gridOf(80, 0.5, () => 3),
        off,
        samples,
        null,
      ).cells,
    ).toEqual([]);
  });
});
