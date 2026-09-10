import { describe, expect, it } from 'vitest';
import { resendOpensAt, resendSecondsLeft } from '../../src/auth/login-policy';
import {
  INITIAL_LOGIN_STATE,
  type LoginEvent,
  type LoginState,
  loginReducer,
} from '../../src/auth/login-state';
import { IN_FORMATS } from '../../src/format/pack';

const NOW = Date.UTC(2026, 8, 10, 9, 0, 0);
const SECOND = 1000;
const PHONE = '+919845027746';
const CODE = '123456';

function state(overrides: Partial<LoginState>): LoginState {
  return { ...INITIAL_LOGIN_STATE, phone: PHONE, ...overrides };
}
/** The step after a code went out: the shape most presses are read against. */
const sentState = state({
  step: 'otp',
  request: 'sent',
  placed: true,
  sends: 1,
  resendAt: NOW + 30 * SECOND,
  cooldownLeft: 30,
});
const cooled = { ...sentState, resendAt: null, cooldownLeft: 0 };

describe('resend gap (M01-04) — the device counts 30 s from the answer, rounded up', () => {
  it('opens 30 s after the send answered', () => {
    expect(resendOpensAt(NOW)).toBe(NOW + 30 * SECOND);
  });

  it.each([
    ['no gap runs', null, NOW, 0],
    ['half a second in', NOW + 30 * SECOND, NOW + 500, 30],
    ['half a second before it opens', NOW + 30 * SECOND, NOW + 29_500, 1],
    ['the instant it opens', NOW + 30 * SECOND, NOW + 30 * SECOND, 0],
    ['well after it opened', NOW + 30 * SECOND, NOW + 60 * SECOND, 0],
  ])('%s → %i s left', (_, opensAt, now, left) => {
    expect(resendSecondsLeft(opensAt, now)).toBe(left);
  });
});

describe('the phone step', () => {
  it('takes the number and clears the field answer', () => {
    const answered = state({ phoneProblem: { typed: 7, needed: 10 } });
    expect(loginReducer(answered, { type: 'phone-typed', phone: '+9198' })).toMatchObject({
      phone: '+9198',
      phoneProblem: null,
    });
  });

  it('answers a short number on the field and sends nothing', () => {
    const next = loginReducer(state({ phone: '+9198450' }), { type: 'send', pack: IN_FORMATS });
    expect(next.phoneProblem).toEqual({ typed: 5, needed: 10 });
    expect(next.pending).toBeNull();
  });

  it('asks for an SMS on a full number', () => {
    const next = loginReducer(state({}), { type: 'send', pack: IN_FORMATS });
    expect(next).toMatchObject({
      phoneProblem: null,
      channel: 'sms',
      pending: { kind: 'request', phone: PHONE, channel: 'sms' },
    });
  });
});

describe('a request answered', () => {
  it('a send opens the code step, counts the send and starts the gap', () => {
    const asked = state({ pending: { kind: 'request', phone: PHONE, channel: 'sms' } });
    expect(loginReducer(asked, { type: 'request-ended', outcome: 'sent', now: NOW })).toEqual(
      state({
        step: 'otp',
        request: 'sent',
        placed: true,
        sends: 1,
        resendAt: NOW + 30 * SECOND,
        cooldownLeft: 30,
      }),
    );
  });

  it.each(['capped', 'locked', 'delivery-failed', 'failed'] as const)(
    '%s releases the gap, counts no send and marks the channel asked for',
    (outcome) => {
      const next = loginReducer(sentState, { type: 'request-ended', outcome, now: NOW });
      expect(next).toMatchObject({
        request: outcome,
        sends: 1,
        placed: true,
        resendAt: null,
        cooldownLeft: 0,
      });
    },
  );

  it('a server-side gap starts the full gap again and places nothing', () => {
    const offered = state({ step: 'otp', channel: 'voice', placed: false, sends: 1 });
    const next = loginReducer(offered, { type: 'request-ended', outcome: 'cooldown', now: NOW });
    expect(next).toMatchObject({
      placed: false,
      sends: 1,
      cooldownLeft: 30,
      resendAt: NOW + 30 * SECOND,
    });
  });

  it('wipes the previous code, its verdict and the tries', () => {
    const tried = {
      ...sentState,
      code: CODE,
      verify: 'mismatch' as const,
      triesLeft: 2,
      filled: true,
    };
    const next = loginReducer(tried, { type: 'request-ended', outcome: 'sent', now: NOW });
    expect(next).toMatchObject({
      code: '',
      verify: null,
      triesLeft: 5,
      filled: false,
      codeShort: false,
    });
  });
});

describe('the clock', () => {
  it('re-reads the seconds left on every tick, to 0', () => {
    expect(loginReducer(sentState, { type: 'tick', now: NOW + 12_100 }).cooldownLeft).toBe(18);
    expect(loginReducer(sentState, { type: 'tick', now: NOW + 30 * SECOND }).cooldownLeft).toBe(0);
  });

  it('is heard while a round trip is in flight', () => {
    const busy = { ...sentState, pending: { kind: 'verify' as const, code: CODE } };
    expect(loginReducer(busy, { type: 'tick', now: NOW + 30 * SECOND }).cooldownLeft).toBe(0);
  });
});

describe('the code field', () => {
  it.each([
    ['typed one digit', '', '1', false],
    ['arrived whole into an empty field', '', CODE, true],
    ['typed on after a first digit', '1', '12', false],
  ])('%s → filled %s', (_, before, code, filled) => {
    const next = loginReducer({ ...sentState, code: before }, { type: 'code-typed', code });
    expect(next).toMatchObject({ code, filled });
  });

  it('clears the verdict and the short answer as soon as the code changes', () => {
    const wrong = { ...sentState, code: CODE, verify: 'mismatch' as const, codeShort: true };
    expect(loginReducer(wrong, { type: 'code-typed', code: '12345' })).toMatchObject({
      verify: null,
      codeShort: false,
    });
  });

  it('answers Verify pressed short on the field and checks nothing', () => {
    const next = loginReducer({ ...sentState, code: '12345' }, { type: 'verify' });
    expect(next).toMatchObject({ codeShort: true, pending: null });
  });

  it('checks a full code', () => {
    const next = loginReducer({ ...sentState, code: CODE, codeShort: true }, { type: 'verify' });
    expect(next).toMatchObject({ codeShort: false, pending: { kind: 'verify', code: CODE } });
  });
});

describe('a check answered', () => {
  const checking = {
    ...sentState,
    code: CODE,
    filled: true,
    pending: { kind: 'verify' as const, code: CODE },
  };

  it('a mismatch keeps the code for correction and says the tries left', () => {
    const next = loginReducer(checking, {
      type: 'verify-ended',
      outcome: 'mismatch',
      triesLeft: 4,
    });
    expect(next).toMatchObject({
      pending: null,
      verify: 'mismatch',
      triesLeft: 4,
      code: CODE,
      filled: false,
    });
  });

  it.each(['verified', 'expired', 'invalidated', 'locked', 'failed'] as const)(
    '%s clears the code',
    (outcome) => {
      const next = loginReducer(checking, { type: 'verify-ended', outcome, triesLeft: 5 });
      expect(next).toMatchObject({ pending: null, verify: outcome, code: '', codeShort: false });
    },
  );
});

describe('asking again', () => {
  it('resends on the channel in use once the gap is open', () => {
    const byCall = { ...cooled, channel: 'voice' as const, code: CODE, verify: 'expired' as const };
    expect(loginReducer(byCall, { type: 'resend' })).toMatchObject({
      channel: 'voice',
      pending: { kind: 'request', phone: PHONE, channel: 'voice' },
      code: '',
      verify: null,
    });
  });

  it.each(['resend', 'call', 'sms'] as const)('%s inside the gap is not sent', (type) => {
    expect(loginReducer(sentState, { type })).toBe(sentState);
  });

  it('offers the call route without placing it', () => {
    const next = loginReducer({ ...cooled, code: '12' }, { type: 'choose-call' });
    expect(next).toMatchObject({ channel: 'voice', placed: false, pending: null, code: '' });
  });

  it('places the call', () => {
    const offered = { ...cooled, channel: 'voice' as const, placed: false };
    expect(loginReducer(offered, { type: 'call' })).toMatchObject({
      channel: 'voice',
      pending: { kind: 'request', phone: PHONE, channel: 'voice' },
    });
  });

  it('sends the SMS again from the call route', () => {
    const byCall = { ...cooled, channel: 'voice' as const };
    expect(loginReducer(byCall, { type: 'sms' })).toMatchObject({
      channel: 'sms',
      pending: { kind: 'request', phone: PHONE, channel: 'sms' },
    });
  });

  it('changing the number starts over with the digits kept', () => {
    expect(loginReducer(sentState, { type: 'change-number' })).toEqual(state({}));
  });
});

describe('while a round trip is in flight', () => {
  const busy = {
    ...cooled,
    pending: { kind: 'request' as const, phone: PHONE, channel: 'sms' as const },
  };
  const presses: LoginEvent[] = [
    { type: 'phone-typed', phone: '+91' },
    { type: 'code-typed', code: '1' },
    { type: 'send', pack: IN_FORMATS },
    { type: 'resend' },
    { type: 'verify' },
    { type: 'choose-call' },
    { type: 'call' },
    { type: 'sms' },
    { type: 'change-number' },
  ];

  it.each(presses.map((event) => [event.type, event] as const))('%s is ignored', (_, event) => {
    expect(loginReducer(busy, event)).toBe(busy);
  });
});
