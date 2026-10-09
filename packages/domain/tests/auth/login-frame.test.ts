import { describe, expect, it } from 'vitest';
import { loginFrame } from '../../src/auth/login-frame';
import { type FrameKind, frameKindOf } from '../../src/auth/login-frame-kind';
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
/** A door with a Google sheet behind it — the sign-in door. */
const signInFrame = (state: LoginState) => loginFrame(state, true);
const inGap = { resendAt: 1, cooldownLeft: 12 } as const;

describe('frameKindOf — the order a fact wins', () => {
  it.each<[string, Partial<LoginState>, FrameKind]>([
    [
      'a taken phone, over a failed step and the lock',
      { googleEnded: 'phone-taken', verify: 'failed', request: 'locked' },
      'google-phone-taken',
    ],
    [
      'a failed step after the code, over everything',
      { verify: 'failed', request: 'locked' },
      'auth-error',
    ],
    [
      'a check that got no answer, over the lock',
      { verify: 'unreached', request: 'locked' },
      'auth-unreached',
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
    ['an SMS request that got no answer', { request: 'unreached' }, 'request-unreached'],
    [
      'a call request that got no answer',
      { request: 'unreached', ...byCall },
      'call-request-unreached',
    ],
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

describe('loginFrame — no answer is told from a refusal, and offers the same ways (F8-36)', () => {
  it.each<[FrameKind, Partial<LoginState>, Partial<LoginState>]>([
    ['auth-unreached', { verify: 'unreached' }, { verify: 'failed' }],
    ['request-unreached', { request: 'unreached' }, { request: 'failed' }],
    [
      'call-request-unreached',
      { request: 'unreached', ...byCall },
      { request: 'failed', ...byCall },
    ],
  ])("%s keeps its refusal twin's code field and controls", (kind, unreached, refused) => {
    expect(signInFrame(otp(unreached))).toEqual({ ...signInFrame(otp(refused)), kind });
  });
});

describe('loginFrame — what each frame offers', () => {
  it('auth-error: the code was fine, so Try again checks it again', () => {
    expect(signInFrame(otp({ verify: 'failed' }))).toEqual({
      kind: 'auth-error',
      sub: 'checked-for',
      codeError: null,
      code: 'read-only',
      primary: { press: 'verify', label: 'try-again' },
      resend: null,
      callOffered: false,
      foot: 'auth-error',
      explainer: null,
      google: null,
      linkedEmail: null,
    });
  });

  it('locked: no code field, no primary, no resend, no call — the title says how long', () => {
    expect(signInFrame(otp({ request: 'locked' }))).toMatchObject({
      kind: 'locked',
      sub: 'locked-for',
      code: 'absent',
      primary: null,
      resend: null,
      callOffered: false,
      foot: null,
    });
  });

  it('the locked frame carries the Google control (M01-04: the lock is SMS only; its sentence is sign-in-google.test.ts)', () => {
    expect(signInFrame(otp({ request: 'locked' })).google).toBe('continue');
  });

  it('a door with no Google sheet behind it draws no Google control — never a dead one', () => {
    expect(loginFrame(otp({ request: 'locked' }), false).google).toBeNull();
    expect(loginFrame(otp({ googleEnded: 'phone-taken' }), false).google).toBeNull();
  });

  it('google-phone-taken: the matched code shown spent, the number signs in, another login offered', () => {
    const google = { idToken: 't', nonce: null, email: 'priya.sharma@gmail.com' };
    expect(signInFrame(otp({ googleEnded: 'phone-taken', google, code: '482913' }))).toEqual({
      kind: 'google-phone-taken',
      sub: 'correct-for',
      codeError: null,
      code: 'read-only',
      primary: { press: 'sign-in-by-number', label: 'sign-in-by-number' },
      resend: null,
      callOffered: false,
      foot: null,
      explainer: null,
      google: 'use-another',
      linkedEmail: 'priya.sharma@gmail.com',
    });
  });

  it('no other frame carries Google, and only a linking code names the login', () => {
    const plain = signInFrame(otp({}));
    expect(plain).toMatchObject({ google: null, linkedEmail: null });
    const google = { idToken: 't', nonce: null, email: 'priya.sharma@gmail.com' };
    expect(signInFrame(otp({ google })).linkedEmail).toBe('priya.sharma@gmail.com');
  });

  it.each([
    ['by SMS', {}, 'tried-by-sms'],
    ['by call', byCall, 'tried-to-call'],
  ] as const)(
    'capped %s: no primary, because a call counts to the cap too; the limits sit behind the Explainer',
    (_, channel, sub) => {
      expect(signInFrame(otp({ request: 'capped', ...channel }))).toMatchObject({
        kind: 'capped',
        sub,
        code: 'closed',
        primary: null,
        resend: null,
        callOffered: false,
        foot: null,
        explainer: 'code-limits',
      });
    },
  );

  it.each([
    ['delivery-failed', null],
    ['request-failed', null],
  ] as const)('%s: send it again, or the call as the way across', (kind, foot) => {
    const request = kind === 'delivery-failed' ? 'delivery-failed' : 'failed';
    expect(signInFrame(otp({ request }))).toMatchObject({
      kind,
      sub: 'tried-by-sms',
      code: 'closed',
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
    expect(signInFrame(otp({ request, ...byCall }))).toMatchObject({
      kind,
      sub: 'tried-to-call',
      primary: { press: 'resend', label: 'call-again' },
      resend: { kind: 'live', press: 'sms', label: 'send-sms-again' },
      callOffered: false,
      foot: null,
    });
    expect(signInFrame(otp({ request, ...byCall, ...inGap })).resend).toEqual({ kind: 'wait' });
  });

  describe.each([
    ['expired', 'expired'],
    ['used-up', 'invalidated'],
  ] as const)('%s: nothing to type until a new code', (kind, verify) => {
    it('by SMS offers a new code and the call', () => {
      expect(signInFrame(otp({ verify }))).toMatchObject({
        kind,
        sub: 'sent-by-sms',
        code: 'closed',
        primary: { press: 'resend', label: 'send-new' },
        resend: null,
        callOffered: true,
        foot: null,
      });
    });

    it('by call offers another call and the SMS', () => {
      expect(signInFrame(otp({ verify, ...byCall }))).toMatchObject({
        sub: 'read-out',
        primary: { press: 'resend', label: 'call-again' },
        resend: { kind: 'live', press: 'sms', label: 'send-sms-again' },
        callOffered: false,
      });
    });

    it('inside the gap shows the wait and no way to ask', () => {
      expect(signInFrame(otp({ verify, ...inGap }))).toMatchObject({
        primary: null,
        resend: { kind: 'wait' },
        callOffered: false,
      });
    });
  });

  it('call-offer: the call is the primary, the SMS the way back', () => {
    const offered = otp({ channel: 'voice', placed: false });
    expect(signInFrame(offered)).toMatchObject({
      kind: 'call-offer',
      sub: 'will-call',
      code: 'open',
      primary: { press: 'call', label: 'call-me' },
      resend: { kind: 'live', press: 'sms', label: 'send-sms-again' },
      callOffered: false,
      foot: null,
    });
    expect(signInFrame({ ...offered, ...inGap })).toMatchObject({
      primary: null,
      resend: { kind: 'wait' },
    });
  });

  it('wrong: the error sits on the field and the tries left at the foot', () => {
    expect(signInFrame(otp({ verify: 'mismatch' }))).toMatchObject({
      kind: 'wrong',
      codeError: 'wrong',
      code: 'open',
      primary: { press: 'verify', label: 'verify' },
      resend: { kind: 'live', press: 'resend', label: 'send-new' },
      callOffered: false,
      foot: 'tries-left',
    });
    expect(signInFrame(otp({ verify: 'mismatch', ...inGap })).resend).toEqual({ kind: 'wait' });
  });

  it('filled: check it or type over it; a short press answers on the field', () => {
    expect(signInFrame(otp({ filled: true }))).toMatchObject({
      kind: 'filled',
      codeError: null,
      resend: { kind: 'live', press: 'resend', label: 'send-new' },
      foot: null,
    });
    expect(signInFrame(otp({ filled: true, codeShort: true, ...inGap }))).toMatchObject({
      codeError: 'short',
      resend: { kind: 'wait' },
    });
  });

  it.each([
    ['the first SMS', { sends: 1 }],
    ['a second SMS', { sends: 2 }],
    ['a call', { sends: 1, ...byCall }],
  ] as const)('waiting after %s: the resend control counts the gap down itself', (_, facts) => {
    expect(signInFrame(otp({ ...inGap, ...facts }))).toMatchObject({
      kind: 'waiting',
      code: 'open',
      primary: { press: 'verify', label: 'verify' },
      resend: { kind: 'wait' },
      callOffered: false,
      foot: null,
    });
  });

  it.each([
    ['by SMS', {}, true],
    ['by call', byCall, false],
  ] as const)('entry %s: the call is offered only off the SMS', (_, channel, callOffered) => {
    expect(signInFrame(otp({ codeShort: true, ...channel }))).toMatchObject({
      kind: 'entry',
      code: 'open',
      codeError: 'short',
      resend: { kind: 'live', press: 'resend', label: 'send-new' },
      callOffered,
      foot: null,
    });
  });
});
