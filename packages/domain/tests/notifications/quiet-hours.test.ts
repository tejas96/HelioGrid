import { describe, expect, it } from 'vitest';
import { clockTime } from '../../src/calling/clock-time';
import { IN_CALLING_RULES } from '../../src/calling/pack';
import { marketQuietHours, pushDueAt, type QuietWindow } from '../../src/notifications/quiet-hours';

/**
 * `F6-14` — a standard push fired inside the tenant's quiet window becomes due at the window's
 * end; the record itself is never held. `F6-13`'s closing clause is the other half: an immediate
 * type is due at once and the window does not touch it.
 *
 * Every instant is read in the TENANT's timezone (`F1-10`), never the server's.
 */
const IST = 'Asia/Kolkata';
const night = (start: string, end: string): QuietWindow => ({
  start: clockTime(start),
  end: clockTime(end),
});
const NIGHT = night('20:00', '08:00');
/* Epoch milliseconds both ways: the package constructs no Date, and neither does its test. */
const at = (stamp: string) => Date.parse(stamp);
const iso = (epoch: number) => new Date(epoch).toISOString();

describe('pushDueAt — when a push falls due (F6-13, F6-14)', () => {
  it('holds a standard push fired after midnight until the window ends that morning', () => {
    // 02:00 IST on the 15th.
    expect(iso(pushDueAt('standard', at('2026-03-14T20:30:00Z'), NIGHT, IST))).toBe(
      '2026-03-15T02:30:00.000Z', // 08:00 IST the same morning
    );
  });

  it('holds a standard push fired before midnight until the NEXT morning', () => {
    // 21:00 IST on the 15th.
    expect(iso(pushDueAt('standard', at('2026-03-15T15:30:00Z'), NIGHT, IST))).toBe(
      '2026-03-16T02:30:00.000Z', // 08:00 IST on the 16th
    );
  });

  it('leaves a standard push fired in the working day due at once', () => {
    const emitted = at('2026-03-15T06:30:00Z'); // 12:00 IST
    expect(iso(pushDueAt('standard', emitted, NIGHT, IST))).toBe(iso(emitted));
  });

  it.each([
    ['the window opens: held', '2026-03-15T14:30:00Z', '2026-03-16T02:30:00.000Z'], // 20:00 IST
    ['the window closes: due', '2026-03-15T02:30:00Z', '2026-03-15T02:30:00.000Z'], // 08:00 IST
  ])('reads both edges of the window — %s', (_why, emitted, due) => {
    expect(iso(pushDueAt('standard', at(emitted), NIGHT, IST))).toBe(due);
  });

  it('holds inside a window that does not cross midnight', () => {
    // 13:30 IST, window 13:00–14:00.
    expect(
      iso(pushDueAt('standard', at('2026-03-15T08:00:00Z'), night('13:00', '14:00'), IST)),
    ).toBe('2026-03-15T08:30:00.000Z'); // 14:00 IST
  });

  it('holds nothing when the window has no length — the tenant keeps no quiet hours', () => {
    const emitted = at('2026-03-15T03:30:00Z'); // 09:00 IST
    expect(iso(pushDueAt('standard', emitted, night('09:00', '09:00'), IST))).toBe(iso(emitted));
  });

  it('is due at once for an immediate type, however deep in the window it fires', () => {
    const emitted = at('2026-03-14T20:30:00Z'); // 02:00 IST
    expect(iso(pushDueAt('immediate', emitted, NIGHT, IST))).toBe(iso(emitted));
  });

  it('reads the TENANT’s timezone, so one instant answers differently for two tenants', () => {
    const emitted = at('2026-03-15T02:00:00Z'); // 07:30 IST · 02:00 UTC — inside both windows
    expect(iso(pushDueAt('standard', emitted, NIGHT, IST))).toBe('2026-03-15T02:30:00.000Z');
    expect(iso(pushDueAt('standard', emitted, NIGHT, 'UTC'))).toBe('2026-03-15T08:00:00.000Z');
  });

  it('takes the offset in force when the window ENDS, not when the push was emitted', () => {
    // New York moves to daylight time at 02:00 on this date, so 06:00 local is UTC-4, not UTC-5.
    expect(
      iso(
        pushDueAt(
          'standard',
          at('2026-03-08T06:00:00Z'), // 01:00 EST
          night('22:00', '06:00'),
          'America/New_York',
        ),
      ),
    ).toBe('2026-03-08T10:00:00.000Z');
  });
});

describe('marketQuietHours — the default is the hours a market may not call in (F6-14)', () => {
  it('opens where the lawful calling window closes and closes where it opens', () => {
    expect(marketQuietHours(IN_CALLING_RULES)).toEqual({
      start: clockTime('21:00'),
      end: clockTime('09:00'),
    });
  });

  it('holds NOTHING for a market that declares no voice ruleset — no window, no invented night', () => {
    const silent = marketQuietHours({ ...IN_CALLING_RULES, voice: { declared: false } });
    expect(silent.start).toBe(silent.end);
    const emitted = at('2026-03-14T20:30:00Z'); // 02:00 IST
    expect(iso(pushDueAt('standard', emitted, silent, IST))).toBe(iso(emitted));
  });

  it('holds a push fired an hour after calling closes, and releases it when calling opens', () => {
    const window = marketQuietHours(IN_CALLING_RULES);
    // 22:00 IST.
    expect(iso(pushDueAt('standard', at('2026-03-15T16:30:00Z'), window, IST))).toBe(
      '2026-03-16T03:30:00.000Z', // 09:00 IST the next morning
    );
  });
});
