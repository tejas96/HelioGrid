import { describe, expect, it } from 'vitest';
import { clockTime } from '../../src/calling/clock-time';
import { callingWindow, floor, IN_CALLING_RULES, tenantDefault } from '../../src/calling/pack';
import {
  type CrewMessageRules,
  callRequestDueAt,
  consentedCallTime,
  crewMessageMoment,
  isCrewMessageDue,
} from '../../src/customer-link/moments';

const IST = 'Asia/Kolkata';
const at = (iso: string) => Date.parse(iso);
const IN_RULES: CrewMessageRules = {
  rules: IN_CALLING_RULES,
  tenantWindow: null,
  tenantSendHour: null,
};

describe('callRequestDueAt — the time they named, else the next lawful moment (F5-54)', () => {
  const NINE_TO_NINE = callingWindow('09:00', '21:00');

  /* `F5-54`: a time they name outside the ordinary window is their own recorded consent and stands;
     a time already past when they asked consents to nothing, so the request reads as naming none. */
  it.each([
    [
      'late at night, outside the window: stands',
      '2026-11-14T22:30',
      '2026-11-14T12:00',
      '2026-11-14T22:30',
    ],
    [
      'early next morning, outside the window: stands',
      '2026-11-15T06:30',
      '2026-11-14T12:00',
      '2026-11-15T06:30',
    ],
    ['inside the window: stands', '2026-11-15T11:00', '2026-11-14T12:00', '2026-11-15T11:00'],
    [
      'the very moment they asked: stands',
      '2026-11-14T12:00',
      '2026-11-14T12:00',
      '2026-11-14T12:00',
    ],
    [
      'already past, asked at noon: due now',
      '2026-11-14T08:00',
      '2026-11-14T12:00',
      '2026-11-14T12:00',
    ],
    [
      'already past, asked at 21:40: due at 09:00 next morning',
      '2026-11-14T10:00',
      '2026-11-14T21:40',
      '2026-11-15T09:00',
    ],
  ])('a named time %s', (_, named, asked, due) => {
    const ist = (local: string) => at(`${local}:00+05:30`);
    expect(callRequestDueAt(ist(named), ist(asked), IST, NINE_TO_NINE)).toBe(ist(due));
  });

  it.each([
    ['asked at noon: due now', '2026-11-14T12:00:00+05:30', '2026-11-14T12:00:00+05:30'],
    [
      'asked at 21:40: due at 09:00 the next morning',
      '2026-11-14T21:40:00+05:30',
      '2026-11-15T09:00:00+05:30',
    ],
    [
      'asked at 06:00: due at 09:00 that morning',
      '2026-11-14T06:00:00+05:30',
      '2026-11-14T09:00:00+05:30',
    ],
  ])('naming none — %s', (_, asked, due) => {
    expect(callRequestDueAt(null, at(asked), IST, NINE_TO_NINE)).toBe(at(due));
  });

  it('a market with no window is due at once', () => {
    const asked = at('2026-11-14T23:50:00+05:30');
    expect(callRequestDueAt(null, asked, IST, null)).toBe(asked);
  });
});

describe('consentedCallTime — the moment a named time consents to (F5-54)', () => {
  const NOON = at('2026-11-14T12:00:00+05:30');
  it.each([
    ['none named', null, null],
    ['a minute before they asked', NOON - 60_000, null],
    ['the moment they asked', NOON, null],
    ['a minute after', NOON + 60_000, NOON + 60_000],
  ])('%s', (_, named, consented) => {
    expect(consentedCallTime(named, NOON)).toBe(consented);
  });
});

describe('crewMessageMoment — the evening before, on the tenant’s clock (F5-68, F1-15)', () => {
  it('India: 19:00 the day before the installation; no window holds it', () => {
    expect(crewMessageMoment('2026-11-20', IST, IN_RULES)).toBe(at('2026-11-19T19:00:00+05:30'));
  });

  it('is read on the tenant’s zone, whatever the customer’s', () => {
    expect(crewMessageMoment('2026-11-20', 'Asia/Dubai', IN_RULES)).toBe(
      at('2026-11-19T19:00:00+04:00'),
    );
  });

  it('a tenant’s own earlier hour is used', () => {
    expect(
      crewMessageMoment('2026-11-20', IST, { ...IN_RULES, tenantSendHour: clockTime('17:30') }),
    ).toBe(at('2026-11-19T17:30:00+05:30'));
  });

  const windowed = (opens: string, closes: string): CrewMessageRules => ({
    rules: {
      messaging: {
        ...IN_CALLING_RULES.messaging,
        statutoryWindow: floor(callingWindow(opens, closes)),
        scheduledSendHour: tenantDefault(clockTime('19:00')),
      },
    },
    tenantWindow: null,
    tenantSendHour: null,
  });

  it.each([
    ['a slot inside the window stands', '09:00', '21:00', '2026-11-19T19:00:00+05:30'],
    ['a slot at the close stands', '09:00', '19:00', '2026-11-19T19:00:00+05:30'],
    [
      'past the close: that day’s close, never after',
      '09:00',
      '18:00',
      '2026-11-19T18:00:00+05:30',
    ],
    [
      'before the open: the previous day’s close, the day carried',
      '20:00',
      '22:00',
      '2026-11-18T22:00:00+05:30',
    ],
  ])('%s', (_, opens, closes, moment) => {
    expect(crewMessageMoment('2026-11-20', IST, windowed(opens, closes))).toBe(at(moment));
  });

  it('a tenant’s narrower window moves the moment earlier, never later', () => {
    const rules = { ...windowed('09:00', '21:00'), tenantWindow: callingWindow('10:00', '18:30') };
    expect(crewMessageMoment('2026-11-20', IST, rules)).toBe(at('2026-11-19T18:30:00+05:30'));
  });
});

describe('isCrewMessageDue — offered from its moment until the installation day ends', () => {
  it.each([
    ['a minute before 19:00 the evening before', '2026-11-19T18:59:00+05:30', false],
    ['at 19:00 the evening before', '2026-11-19T19:00:00+05:30', true],
    ['on the installation morning', '2026-11-20T08:00:00+05:30', true],
    ['the last minute of the installation day', '2026-11-20T23:59:00+05:30', true],
    ['the day after', '2026-11-21T00:00:00+05:30', false],
  ])('%s', (_, now, due) => {
    expect(isCrewMessageDue(at(now), '2026-11-20', IST, IN_RULES)).toBe(due);
  });
});
