/**
 * A time of day on a 24-hour clock, as minutes past midnight — `09:00` is `540`. A market's
 * statutory calling window and its scheduled-send hour are policy numbers (`F1-36`, `F1-62`),
 * so `clockTime()` is the only door in and a consuming gate can neither compose one nor guess
 * one (`M60`).
 *
 * Minutes rather than `"HH:MM"` because every rule that reads one COMPARES it: a floor against
 * a tenant's narrowing, a send slot against a window's close. `packages/ui`'s `TimeField` keeps
 * its own lenient parser — that one reads what a person TYPES (`5pm`, `0900`, `9.00`), a
 * different job from a value the platform authors.
 *
 * No date and no zone. `F1-10` fixes the clock this is read on — the TENANT's, one clock for the
 * hour and for the window it sits inside (`Q58`) — and the caller holding the tenant applies it.
 */
declare const CLOCK_TIME: unique symbol;

export type ClockTime = number & { readonly [CLOCK_TIME]: 'clock' };

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const MINUTES_PER_HOUR = 60;

/**
 * `"09:00"` → `540`. Strictly zero-padded `HH:MM` on a 24-hour clock: the pack's own spelling is
 * canonical, so a lenient parse here would let two spellings of one hour into the data. The only
 * callers are pack literals, so a throw lands at import time in the first test run.
 */
export function clockTime(hhmm: string): ClockTime {
  const match = HH_MM.exec(hhmm);
  const hours = match?.[1];
  const minutes = match?.[2];
  if (hours === undefined || minutes === undefined) {
    throw new RangeError(`a clock time is 24-hour HH:MM, not ${String(hhmm)}`);
  }
  return (Number(hours) * MINUTES_PER_HOUR + Number(minutes)) as ClockTime;
}

/** `540` → `"09:00"` — the spelling `formatTime` renders and `TimeField` carries. */
export function clockTimeHhmm(time: ClockTime): string {
  const hours = Math.floor(time / MINUTES_PER_HOUR);
  const minutes = time % MINUTES_PER_HOUR;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
