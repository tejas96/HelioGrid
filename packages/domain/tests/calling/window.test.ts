import { describe, expect, it } from 'vitest';
import { clockTime } from '../../src/calling/clock-time';
import { callingWindow, NO_WINDOW } from '../../src/calling/pack';
import { isWithinFloor, lawfulSendTime, windowInForce } from '../../src/calling/window';

const STATUTORY = callingWindow('09:00', '21:00');

describe('isWithinFloor — a tenant narrows a floor and never widens it (F1-17)', () => {
  it.each([
    ['10:00', '20:00', true, 'narrower on both sides'],
    ['09:00', '21:00', true, 'exactly the floor — narrowing to it is not widening it'],
    ['09:00', '20:00', true, 'narrower at the close only'],
    ['08:59', '21:00', false, 'one minute earlier than the floor opens'],
    ['09:00', '21:01', false, 'one minute later than the floor closes'],
    ['08:00', '22:00', false, 'wider on both sides'],
  ])('%s–%s is %s: %s', (opens, closes, expected) => {
    expect(isWithinFloor(STATUTORY, callingWindow(opens, closes))).toBe(expected);
  });

  it('bounds nothing where the market authors no window', () => {
    expect(isWithinFloor(NO_WINDOW, callingWindow('00:01', '23:59'))).toBe(true);
  });
});

describe('windowInForce — the floor stands where a tenant would cross it (F1-12, F1-17)', () => {
  it('takes the tenant’s window where it narrows the floor', () => {
    const narrower = callingWindow('10:00', '18:00');
    expect(windowInForce(STATUTORY, narrower)).toBe(narrower);
  });

  it('discards a tenant window that would widen the floor — there is no override flag', () => {
    expect(windowInForce(STATUTORY, callingWindow('08:00', '22:00'))).toBe(STATUTORY);
  });

  it('is the floor where the tenant has set nothing', () => {
    expect(windowInForce(STATUTORY, null)).toBe(STATUTORY);
  });
});

describe('lawfulSendTime — the hour yields to the window it sits inside (F1-15, F1-62)', () => {
  it.each([
    ['12:00', '12:00', 'inside the window'],
    ['09:00', '09:00', 'exactly as it opens'],
    ['21:00', '21:00', 'exactly as it closes'],
    ['21:01', '21:00', 'one minute past the close — the last lawful moment before it'],
    ['23:00', '21:00', 'well past the close'],
  ])('a %s slot sends at %s: %s', (slot, expected) => {
    expect(lawfulSendTime(STATUTORY, clockTime(slot))).toBe(clockTime(expected));
  });

  it.each(['00:00', '19:00', '23:59'])(
    'lets a %s slot stand where the market authors no window — IN’s transactional lane',
    (slot) => {
      expect(lawfulSendTime(NO_WINDOW, clockTime(slot))).toBe(clockTime(slot));
    },
  );

  it('refuses a slot before the window opens — unruled, open question Q86', () => {
    expect(() => lawfulSendTime(STATUTORY, clockTime('07:00'))).toThrow(/Q86/);
  });
});
