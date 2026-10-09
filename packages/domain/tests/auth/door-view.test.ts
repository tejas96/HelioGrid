import { describe, expect, it } from 'vitest';
import { doorNotice, doorView } from '../../src/auth/door-view';
import { INITIAL_LOGIN_STATE, type LoginState } from '../../src/auth/login-state';
import type { PendingSwitch, SessionSnapshot, SessionUser } from '../../src/auth/session';

/**
 * Which panel the sign-in door shows. The ORDER is the decision: a pending switch outranks a
 * settled session, and a settled session outranks the flow's own step — so a device changing
 * hands can never slip past the question it must ask first (`F4-37`).
 */
const aUser: SessionUser = {
  id: 'u1',
  name: 'Asha',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  tenant: null,
};

const aSwitch: PendingSwitch = {
  previousUserId: 'u0',
  heldWork: { count: 1, capturedByUserId: 'u0', capturedAt: '2026-01-01T00:00:00.000Z' },
  next: aUser,
};

type Door = Pick<SessionSnapshot, 'status' | 'user' | 'switch'>;
const door = (over: Partial<Door> = {}): Door => ({
  status: 'anonymous',
  user: null,
  switch: null,
  ...over,
});

describe('doorView', () => {
  it.each([
    [
      'a pending switch outranks a settled session',
      door({ status: 'authenticated', user: aUser, switch: aSwitch }),
      'otp',
      'switch',
    ],
    [
      'a pending switch outranks a session still checking',
      door({ status: 'checking', switch: aSwitch }),
      'phone',
      'switch',
    ],
    [
      'a settled session outranks the step',
      door({ status: 'authenticated', user: aUser }),
      'otp',
      'done',
    ],
    [
      'authenticated with no user is not settled',
      door({ status: 'authenticated', user: null }),
      'otp',
      'code',
    ],
    ['the otp step shows the code panel', door(), 'otp', 'code'],
    ['a first Google sign-in shows the link panel', door(), 'google-link', 'google-link'],
    ['every other step shows the phone panel', door(), 'phone', 'phone'],
  ] as const)('%s', (_name, session, step, expected) => {
    expect(doorView(session, step)).toBe(expected);
  });
});

describe('doorNotice — the one block above the number (F8-36)', () => {
  const login = (over: Partial<LoginState>): LoginState => ({ ...INITIAL_LOGIN_STATE, ...over });
  it.each([
    ['a first send that got no answer', login({ request: 'unreached' }), 'not-reached'],
    [
      'no answer on the code step, which its frame says',
      login({ step: 'otp', request: 'unreached' }),
      null,
    ],
    ['a refused first send, which opens the code step', login({ request: 'failed' }), null],
    ['the door as it opens', login({}), null],
  ] as const)('%s', (_name, state, expected) => {
    expect(doorNotice(state)).toBe(expected);
  });
});
