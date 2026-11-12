import { describe, expect, it } from 'vitest';
import { callingWindow, IN_CALLING_RULES, NO_WINDOW } from '../../src/calling/pack';
import {
  calendarMonthsAfter,
  callBackDueAt,
  callBackWindowOf,
  dailySweepDue,
  isDormantDue,
  isUnassignedOverdue,
  noCallUntilOf,
  wakeInstantOf,
} from '../../src/crm/crm-clock';

const KOLKATA = 'Asia/Kolkata';
const NEW_YORK = 'America/New_York';
const HOUR = 60 * 60 * 1_000;
const DAY = 24 * HOUR;

describe('callBackDueAt — capture any hour, call inside the window (M02-15)', () => {
  const window = callBackWindowOf(IN_CALLING_RULES, null);

  it.each([
    ['2026-11-09T16:10:00Z', '2026-11-10T03:30:00Z'], // 21:40 IST — Priya's call
    ['2026-11-09T15:31:00Z', '2026-11-10T03:30:00Z'], // 21:01 IST, one past the close
    ['2026-11-09T00:30:00Z', '2026-11-09T03:30:00Z'], // 06:00 IST, before the open
    ['2026-11-09T03:29:00Z', '2026-11-09T03:30:00Z'], // 08:59 IST, one before the open
    ['2026-11-08T18:30:00Z', '2026-11-09T03:30:00Z'], // 00:00 IST
  ])(
    'a call-back raised outside the calling window is due at its next opening — %s',
    (raised, due) => {
      expect(callBackDueAt(Date.parse(raised), KOLKATA, window)).toBe(Date.parse(due));
    },
  );

  it.each([
    '2026-11-09T03:30:00Z', // 09:00 IST, the open
    '2026-11-09T09:30:00Z', // 15:00 IST
    '2026-11-09T15:30:00Z', // 21:00 IST, the close
  ])('a call-back raised inside the window is due at once — %s', (raised) => {
    expect(callBackDueAt(Date.parse(raised), KOLKATA, window)).toBe(Date.parse(raised));
  });

  it('a tenant window narrows the floor and a wider one is discarded (F1-17)', () => {
    const raised = Date.parse('2026-11-09T04:00:00Z'); // 09:30 IST
    const narrower = callBackWindowOf(IN_CALLING_RULES, callingWindow('10:00', '18:00'));
    const wider = callBackWindowOf(IN_CALLING_RULES, callingWindow('07:00', '22:00'));
    expect(callBackDueAt(raised, KOLKATA, narrower)).toBe(Date.parse('2026-11-09T04:30:00Z'));
    expect(callBackDueAt(raised, KOLKATA, wider)).toBe(raised);
  });

  it('a market with no voice ruleset states no hour, so a call-back is due at once', () => {
    const silent = { ...IN_CALLING_RULES, voice: { declared: false } } as const;
    const raised = Date.parse('2026-11-09T16:10:00Z');
    expect(callBackWindowOf(silent, null)).toBe(NO_WINDOW);
    expect(callBackDueAt(raised, KOLKATA, NO_WINDOW)).toBe(raised);
  });

  it('in a daylight-saving zone the next opening is 09:00 on that morning’s clock', () => {
    const window9to21 = callingWindow('09:00', '21:00');
    // 22:00 EST on 7 March 2026 → 09:00 EDT on 8 March, the morning clocks go forward.
    expect(callBackDueAt(Date.parse('2026-03-08T03:00:00Z'), NEW_YORK, window9to21)).toBe(
      Date.parse('2026-03-08T13:00:00Z'),
    );
  });
});

describe('wakeInstantOf — 09:00 on the tenant’s own clock (M02-49)', () => {
  it.each([
    [KOLKATA, '2026-11-10', '2026-11-10T03:30:00Z'],
    [KOLKATA, '2027-01-01', '2027-01-01T03:30:00Z'],
    [NEW_YORK, '2026-03-07', '2026-03-07T14:00:00Z'], // EST, the day before the shift
    [NEW_YORK, '2026-03-08', '2026-03-08T13:00:00Z'], // EDT, the morning clocks go forward
    [NEW_YORK, '2026-11-01', '2026-11-01T14:00:00Z'], // EST, the morning clocks go back
    ['Pacific/Kiritimati', '2026-11-10', '2026-11-09T19:00:00Z'], // UTC+14
    ['Etc/GMT+12', '2026-11-10', '2026-11-10T21:00:00Z'], // UTC−12
    ['UTC', '2026-11-10', '2026-11-10T09:00:00Z'],
  ])("every wake lands at 09:00 in the tenant's timezone — %s on %s", (zone, date, instant) => {
    expect(wakeInstantOf(date, zone)).toBe(Date.parse(instant));
  });
});

describe('dailySweepDue — once per local day, from 09:00 (M02-49)', () => {
  it.each([
    [KOLKATA, '2026-11-09T03:29:00Z', null, false], // 08:59 IST
    [KOLKATA, '2026-11-09T03:30:00Z', null, true], // 09:00 IST
    [KOLKATA, '2026-11-09T03:30:00Z', '2026-11-08', true],
    [KOLKATA, '2026-11-09T03:30:00Z', '2026-11-09', false],
    [KOLKATA, '2026-11-09T18:29:00Z', '2026-11-08', true], // 23:59 IST
    [KOLKATA, '2026-11-09T18:30:00Z', '2026-11-09', false], // 00:00 IST on the 10th
    [NEW_YORK, '2026-03-08T12:59:00Z', '2026-03-07', false], // 08:59 EDT
    [NEW_YORK, '2026-03-08T13:00:00Z', '2026-03-07', true], // 09:00 EDT
  ])('in %s at %s, last run %s, the sweep is due: %s', (zone, now, lastRun, due) => {
    expect(dailySweepDue(Date.parse(now), zone, lastRun)).toBe(due);
  });
});

describe('the sweep’s two age rules (M02-50, M02-52)', () => {
  const start = Date.parse('2026-10-01T05:00:00Z');

  it.each([
    [30 * DAY - 1, false],
    [30 * DAY, true],
    [45 * DAY, true],
  ])('%i ms since the last activity is dormant: %s', (age, due) => {
    expect(isDormantDue(start, start + age)).toBe(due);
  });

  it.each([
    [24 * HOUR - 1, false],
    [24 * HOUR, false],
    [24 * HOUR + 1, true],
  ])('%i ms unassigned escalates: %s', (age, overdue) => {
    expect(isUnassignedOverdue(start, start + age)).toBe(overdue);
  });
});

describe('noCallUntilOf — six calendar months on (M02-54)', () => {
  it.each([
    ['2026-11-09', '2027-05-09'],
    ['2026-06-15', '2026-12-15'],
    ['2026-07-31', '2027-01-31'],
    ['2026-08-31', '2027-02-28'],
    ['2027-08-31', '2028-02-29'],
    ['2026-12-30', '2027-06-30'],
  ])('a loss on %s holds calls back until %s', (today, until) => {
    expect(noCallUntilOf(today)).toBe(until);
  });
});

describe('calendarMonthsAfter — the same day, months on, clamped to a short month', () => {
  it.each([
    ['2026-11-12', 1, '2026-12-12'],
    ['2026-11-12', 3, '2027-02-12'],
    ['2026-01-31', 1, '2026-02-28'],
    ['2028-01-31', 1, '2028-02-29'],
    ['2026-10-31', 1, '2026-11-30'],
    ['2026-12-15', 1, '2027-01-15'],
  ])('%s plus %i months is %s', (date, months, after) => {
    expect(calendarMonthsAfter(date, months)).toBe(after);
  });
});
