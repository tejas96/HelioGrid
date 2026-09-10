import { describe, expect, it } from 'vitest';
import { type FrameKind, frameKindOf, loginFrame } from '../../src/auth/login-frame';
import { INITIAL_LOGIN_STATE, type LoginState } from '../../src/auth/login-state';

/** The code step after one SMS went out and the gap has opened. */
function otp(overrides: Partial<LoginState>): LoginState {
  return {
    ...INITIAL_LOGIN_STATE,
    step: 'otp',
    phone: '+919845027746',
    request: 'sent',
    placed: true,
    sends: 1,
    ...overrides,
  };
}
const byCall = { channel: 'voice', placed: true } as const;
const inGap = { resendAt: 1, cooldownLeft: 12 } as const;

describe('frameKindOf — the order a fact wins', () => {
  it.each<[string, Partial<LoginState>, FrameKind]>([
    [
      'a failed step after the code, over everything',
      { verify: 'failed', request: 'locked' },
      'auth-error',
    ],
    ['the lock, from a check', { verify: 'locked' }, 'locked'],
    ['the lock, from a request', { request: 'locked' }, 'locked'],
    [
      'a call chosen but not placed, before the SMS outcome',
      { channel: 'voice', placed: false, request: 'capped' },
      'call-offer',
    ],
    ['the cap', { request: 'capped' }, 'capped'],
    ['an SMS the network refused', { request: 'delivery-failed' }, 'delivery-failed'],
    ['a call the network refused', { request: 'delivery-failed', ...byCall }, 'call-not-placed'],
    ['an SMS our side could not send', { request: 'failed' }, 'request-failed'],
    ['a call our side could not place', { request: 'failed', ...byCall }, 'call-request-failed'],
    ['a dead code, before a filled field', { verify: 'expired', filled: true }, 'expired'],
    ['a used-up code', { verify: 'invalidated' }, 'used-up'],
    ['a wrong code, before a running gap', { verify: 'mismatch', ...inGap }, 'wrong'],
    ['a filled field, before a running gap', { filled: true, ...inGap }, 'filled'],
    ['the gap', inGap, 'waiting'],
    ['the ordinary step', {}, 'entry'],
  ])('%s', (_, facts, kind) => {
    expect(frameKindOf(otp(facts))).toBe(kind);
  });
});

describe('loginFrame — what each frame offers', () => {
  it('auth-error: the code was fine, so Try again checks it again', () => {
    expect(loginFrame(otp({ verify: 'failed' }))).toEqual({
      kind: 'auth-error',
      sub: 'checked-for',
      helper: 'code-was-fine',
      codeError: null,
      codeEnabled: false,
      primary: { press: 'verify', label: 'try-again' },
      resend: null,
      callOffered: false,
      foot: 'auth-error',
    });
  });

  it('locked: no entry, no primary, no call — the wait is the remedy', () => {
    expect(loginFrame(otp({ request: 'locked' }))).toMatchObject({
      kind: 'locked',
      sub: 'locked-for',
      helper: 'locked',
      codeEnabled: false,
      primary: null,
      resend: { kind: 'wait', reason: 'locked' },
      callOffered: false,
      foot: 'locked',
    });
  });

  it.each([
    ['by SMS', {}, 'tried-by-sms'],
    ['by call', byCall, 'tried-to-call'],
  ] as const)('capped %s: no primary, because a call counts to the cap too', (_, channel, sub) => {
    expect(loginFrame(otp({ request: 'capped', ...channel }))).toMatchObject({
      kind: 'capped',
      sub,
      helper: 'no-code-yet',
      codeEnabled: false,
      primary: null,
      resend: { kind: 'wait', reason: 'cap' },
      callOffered: false,
      foot: 'cap',
    });
  });

  it.each([
    ['delivery-failed', 'not-sent'],
    ['request-failed', null],
  ] as const)('%s: send it again, or the call as the way across', (kind, foot) => {
    const request = kind === 'delivery-failed' ? 'delivery-failed' : 'failed';
    expect(loginFrame(otp({ request }))).toMatchObject({
      kind,
      sub: 'tried-by-sms',
      helper: 'no-code-yet',
      codeEnabled: false,
      primary: { press: 'resend', label: 'send-again' },
      resend: null,
      callOffered: true,
      foot,
    });
  });

  it.each([
    ['call-not-placed', 'delivery-failed'],
    ['call-request-failed', 'failed'],
  ] as const)('%s: call again, or the SMS again as the way across', (kind, request) => {
    expect(loginFrame(otp({ request, ...byCall }))).toMatchObject({
      kind,
      sub: 'tried-to-call',
      primary: { press: 'resend', label: 'call-again' },
      resend: { kind: 'live', press: 'sms', label: 'send-sms-again' },
      callOffered: false,
      foot: null,
    });
    expect(loginFrame(otp({ request, ...byCall, ...inGap })).resend).toEqual({
      kind: 'wait',
      reason: 'short',
    });
  });

  describe.each([
    ['expired', 'expired'],
    ['used-up', 'invalidated'],
  ] as const)('%s: nothing to type until a new code', (kind, verify) => {
    it('by SMS offers a new code and the call', () => {
      expect(loginFrame(otp({ verify }))).toMatchObject({
        kind,
        sub: 'sent-by-sms',
        helper: 'nothing-until-new',
        codeEnabled: false,
        primary: { press: 'resend', label: 'send-new' },
        resend: null,
        callOffered: true,
        foot: null,
      });
    });

    it('by call offers another call and the SMS', () => {
      expect(loginFrame(otp({ verify, ...byCall }))).toMatchObject({
        sub: 'read-out',
        primary: { press: 'resend', label: 'call-again' },
        resend: { kind: 'live', press: 'sms', label: 'send-sms-again' },
        callOffered: false,
      });
    });

    it('inside the gap shows the wait and no way to ask', () => {
      expect(loginFrame(otp({ verify, ...inGap }))).toMatchObject({
        primary: null,
        resend: { kind: 'wait', reason: 'short' },
        callOffered: false,
      });
    });
  });

  it('call-offer: the call is the primary, the SMS the way back', () => {
    const offered = otp({ channel: 'voice', placed: false });
    expect(loginFrame(offered)).toMatchObject({
      kind: 'call-offer',
      sub: 'will-call',
      helper: 'answer-call',
      codeEnabled: true,
      primary: { press: 'call', label: 'call-me' },
      resend: { kind: 'live', press: 'sms', label: 'send-sms-again' },
      callOffered: false,
      foot: 'call',
    });
    expect(loginFrame({ ...offered, ...inGap })).toMatchObject({
      primary: null,
      resend: { kind: 'wait', reason: 'short' },
    });
  });

  it('wrong: the error sits on the field and the tries left at the foot', () => {
    expect(loginFrame(otp({ verify: 'mismatch' }))).toMatchObject({
      kind: 'wrong',
      helper: null,
      codeError: 'wrong',
      codeEnabled: true,
      primary: { press: 'verify', label: 'verify' },
      resend: { kind: 'live', press: 'resend', label: 'send-new' },
      callOffered: false,
      foot: 'tries-left',
    });
    expect(loginFrame(otp({ verify: 'mismatch', ...inGap })).resend).toEqual({
      kind: 'wait',
      reason: 'short',
    });
  });

  it('filled: check it or type over it; a short press answers on the field', () => {
    expect(loginFrame(otp({ filled: true }))).toMatchObject({
      kind: 'filled',
      helper: 'filled-from-sms',
      codeError: null,
      resend: { kind: 'live', press: 'resend', label: 'send-new' },
      foot: 'only-some-phones',
    });
    expect(loginFrame(otp({ filled: true, codeShort: true, ...inGap }))).toMatchObject({
      codeError: 'short',
      resend: { kind: 'wait', reason: 'short' },
    });
  });

  it.each([
    ['the first SMS', { sends: 1 }, 'sent-just-now', 'first', 'code-works-for'],
    ['a second SMS', { sends: 2 }, 'sent-moment-ago', 'again', 'wait-stops'],
    ['a call', { sends: 1, ...byCall }, 'answer-call', 'first', 'code-works-for'],
  ] as const)('waiting after %s', (_, facts, helper, reason, foot) => {
    expect(loginFrame(otp({ ...inGap, ...facts }))).toMatchObject({
      kind: 'waiting',
      helper,
      codeEnabled: true,
      primary: { press: 'verify', label: 'verify' },
      resend: { kind: 'wait', reason },
      callOffered: false,
      foot,
    });
  });

  it.each([
    ['by SMS', {}, true],
    ['by call', byCall, false],
  ] as const)(
    'entry %s: paste the whole code; the call is offered only off the SMS',
    (_, channel, callOffered) => {
      expect(loginFrame(otp({ codeShort: true, ...channel }))).toMatchObject({
        kind: 'entry',
        helper: 'paste-whole',
        codeError: 'short',
        resend: { kind: 'live', press: 'resend', label: 'send-new' },
        callOffered,
        foot: null,
      });
    },
  );
});
