import { describe, expect, it } from 'vitest';
import {
  daysLateOf,
  movedToTomorrow,
  myDayBandOf,
  myDayDayOf,
  nextUpOf,
} from '../../src/tasks/my-day';

const HOUR = 3_600_000;
const clock = { now: 100 * HOUR, todayEnds: 110 * HOUR, weekEnds: 278 * HOUR };

describe('myDayBandOf — overdue, today, this week, then nothing (M07-02)', () => {
  it.each([
    [clock.now - 1, 'overdue'],
    [clock.now, 'today'],
    [clock.todayEnds - 1, 'today'],
    [clock.todayEnds, 'week'],
    [clock.weekEnds - 1, 'week'],
    [clock.weekEnds, null],
  ] as const)('a task due at %i is in %s', (dueAt, band) => {
    expect(myDayBandOf(dueAt, clock)).toBe(band);
  });
});

describe('nextUpOf — the most overdue first, then today by time (M07-01)', () => {
  it.each([
    { tasks: [], next: null },
    { tasks: [{ id: 'w', dueAt: clock.todayEnds }], next: null },
    {
      tasks: [
        { id: 't', dueAt: clock.now + HOUR },
        { id: 'o', dueAt: clock.now - HOUR },
      ],
      next: 'o',
    },
    {
      tasks: [
        { id: 'o1', dueAt: clock.now - HOUR },
        { id: 'o2', dueAt: clock.now - 3 * HOUR },
      ],
      next: 'o2',
    },
    {
      tasks: [
        { id: 'b', dueAt: clock.now + HOUR },
        { id: 'a', dueAt: clock.now + HOUR },
      ],
      next: 'a',
    },
    {
      tasks: [
        { id: 'w', dueAt: clock.weekEnds - 1 },
        { id: 't', dueAt: clock.todayEnds - 1 },
      ],
      next: 't',
    },
  ])('picks $next', ({ tasks, next }) => {
    expect(nextUpOf(tasks, clock)?.id ?? null).toBe(next);
  });
});

describe('movedToTomorrow — same clock time, the day after today, on the tenant clock (M07-05)', () => {
  const kolkata = 'Asia/Kolkata';
  it.each([
    ['late by days, 4 pm', '2026-11-09T10:30:00Z', '2026-11-12T06:00:00Z', '2026-11-13T10:30:00Z'],
    ['due later today', '2026-11-12T12:00:00Z', '2026-11-12T06:00:00Z', '2026-11-13T12:00:00Z'],
    [
      'read at 11:50 pm local',
      '2026-11-12T03:30:00Z',
      '2026-11-12T18:20:00Z',
      '2026-11-13T03:30:00Z',
    ],
    [
      'read at 00:10 local, next day',
      '2026-11-12T03:30:00Z',
      '2026-11-12T18:40:00Z',
      '2026-11-14T03:30:00Z',
    ],
    ['month end', '2026-11-30T04:00:00Z', '2026-11-30T05:00:00Z', '2026-12-01T04:00:00Z'],
  ])('%s', (_case, due, now, moved) => {
    expect(new Date(movedToTomorrow(Date.parse(due), Date.parse(now), kolkata)).toISOString()).toBe(
      new Date(Date.parse(moved)).toISOString(),
    );
  });

  it('keeps the wall clock across a daylight-saving morning', () => {
    const due = Date.parse('2026-03-01T14:00:00Z');
    const now = Date.parse('2026-03-07T15:00:00Z');
    expect(new Date(movedToTomorrow(due, now, 'America/New_York')).toISOString()).toBe(
      '2026-03-08T13:00:00.000Z',
    );
  });
});

describe('daysLateOf — tenant-local calendar days (M07-02)', () => {
  const at = (iso: string) => Date.parse(iso);
  it.each([
    ['same local day, hours later', '2026-11-12T03:30:00Z', '2026-11-12T11:30:00Z', 0],
    ['yesterday evening, read this morning', '2026-11-11T13:00:00Z', '2026-11-12T03:00:00Z', 1],
    ['crossing local midnight only', '2026-11-12T18:00:00Z', '2026-11-12T18:40:00Z', 1],
    ['three days', '2026-11-09T05:00:00Z', '2026-11-12T05:00:00Z', 3],
    ['due in the future', '2026-11-13T05:00:00Z', '2026-11-12T05:00:00Z', 0],
  ])('%s → %i', (_case, due, now, days) => {
    expect(daysLateOf(at(due), at(now), 'Asia/Kolkata')).toBe(days);
  });
});

describe('myDayDayOf — the bands cut on the tenant clock (M07-02, F1-10)', () => {
  it('today ends at local midnight and the week as day eight begins', () => {
    const day = myDayDayOf(Date.parse('2026-11-12T20:00:00Z'), 'Asia/Kolkata');
    expect(day.today).toBe('2026-11-13');
    expect(new Date(day.todayBegan).toISOString()).toBe('2026-11-12T18:30:00.000Z');
    expect(new Date(day.todayEnds).toISOString()).toBe('2026-11-13T18:30:00.000Z');
    expect(new Date(day.weekEnds).toISOString()).toBe('2026-11-20T18:30:00.000Z');
  });
});
