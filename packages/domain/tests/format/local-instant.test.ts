import { describe, expect, it } from 'vitest';
import { localDate, localInstant, localMinutes } from '../../src/format/zone';

const HOUR_MINUTES = 60;

/**
 * A day and a time on a tenant's clock as the instant they name (`F1-10`, `M02-46`): a booked
 * visit's moment. Every time of day lands on its own date, at the zone's offset that day.
 */
describe('localInstant — a wall-clock moment on a named zone', () => {
  it.each([
    ['2026-11-12', '10:30', 'Asia/Kolkata', '2026-11-12T05:00:00Z'],
    ['2026-11-12', '00:00', 'Asia/Kolkata', '2026-11-11T18:30:00Z'],
    ['2026-11-12', '23:59', 'Asia/Kolkata', '2026-11-12T18:29:00Z'],
    ['2026-11-12', '00:00', 'Pacific/Kiritimati', '2026-11-11T10:00:00Z'],
    ['2026-11-12', '23:30', 'Pacific/Pago_Pago', '2026-11-13T10:30:00Z'],
    // The morning New York moves onto daylight time: 10:00 stands at UTC−4, not −5.
    ['2026-03-08', '10:00', 'America/New_York', '2026-03-08T14:00:00Z'],
    ['2026-03-07', '10:00', 'America/New_York', '2026-03-07T15:00:00Z'],
  ])('%s %s in %s is %s', (date, time, zone, instant) => {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    const at = localInstant(date, hours * HOUR_MINUTES + minutes, zone);
    expect(new Date(at).toISOString()).toBe(new Date(instant).toISOString());
    expect(localDate(at, zone)).toBe(date);
    expect(localMinutes(at, zone)).toBe(hours * HOUR_MINUTES + minutes);
  });
});
