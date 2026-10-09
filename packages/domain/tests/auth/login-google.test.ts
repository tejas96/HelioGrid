import { describe, expect, it } from 'vitest';
import type { GoogleToken } from '../../src/auth/google-sign-in';
import { frameKindOf } from '../../src/auth/login-frame-kind';
import { loginReducer } from '../../src/auth/login-reducer';
import { INITIAL_LOGIN_STATE, type LoginState } from '../../src/auth/login-state';
import { IN_FORMATS } from '../../src/format/pack';

/** The Google door's moves through the one sign-in flow (`M01-02`, `SCR-M01-01` Google frames). */
const NOW = Date.UTC(2026, 8, 10, 9, 0, 0);
const PHONE = '+919845027746';
const CODE = '123456';

function state(overrides: Partial<LoginState>): LoginState {
  return { ...INITIAL_LOGIN_STATE, phone: PHONE, ...overrides };
}
/** The code step after a code went out and the gap has opened. */
const cooled = state({ step: 'otp', request: 'sent', placed: true, sends: 1 });

describe('the Google door (M01-02)', () => {
  const TOKEN: GoogleToken = { idToken: 'id-token', nonce: 'n-1', email: 'priya.sharma@gmail.com' };
  const OTHER: GoogleToken = { ...TOKEN, idToken: 'other-token', email: 'ravi@gmail.com' };
  const checking = state({ pending: { kind: 'google', token: TOKEN, code: null } });
  /** The link step after `LOGIN_NOT_LINKED`: the login waits for the number's code. */
  const linking = state({ step: 'google-link', google: TOKEN });
  const linkingCode = { ...linking, ...cooled, google: TOKEN, code: CODE };
  const proving = {
    ...linkingCode,
    pending: { kind: 'google' as const, token: TOKEN, code: CODE },
  };

  it('Continue with Google opens the sheet; an earlier failure stays drawn until a token arrives', () => {
    expect(loginReducer(state({ googleEnded: 'failed' }), { type: 'google' })).toMatchObject({
      googleEnded: 'failed',
      pending: { kind: 'google-sheet' },
    });
  });

  it('a token from the sheet — or from the web return route, with nothing pending — is checked', () => {
    const result = { kind: 'token', token: TOKEN } as const;
    const sheet = state({ pending: { kind: 'google-sheet' } });
    expect(loginReducer(sheet, { type: 'google-sheet-ended', result }).pending).toEqual(
      checking.pending,
    );
    expect(loginReducer(state({}), { type: 'google-sheet-ended', result }).pending).toEqual(
      checking.pending,
    );
  });

  it('a cancelled sheet changes nothing but the spinner (decision 11)', () => {
    const sheet = { ...linking, pending: { kind: 'google-sheet' as const } };
    expect(
      loginReducer(sheet, { type: 'google-sheet-ended', result: { kind: 'cancelled' } }),
    ).toEqual(linking);
  });

  it('a sheet that failed returns to the phone step with the failure frame', () => {
    const sheet = { ...linking, pending: { kind: 'google-sheet' as const } };
    expect(loginReducer(sheet, { type: 'google-sheet-ended', result: { kind: 'failed' } })).toEqual(
      state({ googleEnded: 'failed' }),
    );
  });

  it('a failure the web return route reads, with nothing pending, draws the failure frame', () => {
    expect(
      loginReducer(state({}), { type: 'google-sheet-ended', result: { kind: 'failed' } }),
    ).toEqual(state({ googleEnded: 'failed' }));
  });

  it('a return route answer is not heard over a round trip already in flight', () => {
    const sending = state({ pending: { kind: 'request', phone: '9820041123', channel: 'sms' } });
    expect(
      loginReducer(sending, { type: 'google-sheet-ended', result: { kind: 'failed' } }),
    ).toEqual(sending);
  });

  it('a linked login signs in: the session store moves the door', () => {
    expect(
      loginReducer(checking, { type: 'google-ended', outcome: 'signed-in', triesLeft: 5 }),
    ).toEqual(state({}));
  });

  it('an unlinked login lands on the link step holding its token', () => {
    expect(
      loginReducer(checking, { type: 'google-ended', outcome: 'not-linked', triesLeft: 5 }),
    ).toEqual(linking);
  });

  it('a Google answer with no Google call in flight is ignored', () => {
    const idle = state({});
    expect(loginReducer(idle, { type: 'google-ended', outcome: 'not-linked', triesLeft: 5 })).toBe(
      idle,
    );
  });

  it('Send code on the link step asks for the code like the phone step', () => {
    expect(loginReducer(linking, { type: 'send', pack: IN_FORMATS })).toMatchObject({
      google: TOKEN,
      pending: { kind: 'request', phone: PHONE, channel: 'sms' },
    });
  });

  it('the code sent while linking opens the code step, still linking', () => {
    const asked = {
      ...linking,
      pending: { kind: 'request' as const, phone: PHONE, channel: 'sms' as const },
    };
    expect(loginReducer(asked, { type: 'request-ended', outcome: 'sent', now: NOW })).toMatchObject(
      { step: 'otp', google: TOKEN, request: 'sent' },
    );
  });

  it('Verify while linking sends the code with the token, not to the phone door', () => {
    expect(loginReducer(linkingCode, { type: 'verify' }).pending).toEqual(proving.pending);
  });

  it("a wrong link code is a wrong code: the frame and the tries are the verify's", () => {
    expect(
      loginReducer(proving, { type: 'google-ended', outcome: 'mismatch', triesLeft: 4 }),
    ).toMatchObject({ pending: null, verify: 'mismatch', triesLeft: 4, code: CODE, google: TOKEN });
  });

  it.each([
    [
      'a request',
      { ...linking, pending: { kind: 'request' as const, phone: PHONE, channel: 'sms' as const } },
      { type: 'request-ended', outcome: 'locked', now: NOW },
    ],
    ['a link code', proving, { type: 'google-ended', outcome: 'locked', triesLeft: 0 }],
    [
      'a plain verify while linking',
      { ...linkingCode, pending: { kind: 'verify' as const, code: CODE } },
      { type: 'verify-ended', outcome: 'locked', triesLeft: 0 },
    ],
  ] as const)('a lock met on %s while linking stays on the link step', (_, from, event) => {
    expect(loginReducer(from, event)).toMatchObject({
      step: 'google-link',
      request: 'locked',
      pending: null,
      google: TOKEN,
    });
  });

  it('a lock met outside the link is the plain locked frame', () => {
    const asked = state({ pending: { kind: 'request', phone: PHONE, channel: 'sms' } });
    expect(
      loginReducer(asked, { type: 'request-ended', outcome: 'locked', now: NOW }),
    ).toMatchObject({ step: 'otp', request: 'locked' });
  });

  it('phone taken keeps the matched code for Sign in with this number', () => {
    const taken = loginReducer(proving, {
      type: 'google-ended',
      outcome: 'phone-taken',
      triesLeft: 5,
    });
    expect(taken).toMatchObject({ pending: null, googleEnded: 'phone-taken', code: CODE });
    expect(loginReducer(taken, { type: 'sign-in-by-number' })).toMatchObject({
      google: null,
      googleEnded: null,
      pending: { kind: 'verify', code: CODE },
    });
  });

  it('a Google sign-in that failed returns to the phone step with its frame', () => {
    expect(
      loginReducer(proving, { type: 'google-ended', outcome: 'failed', triesLeft: 5 }),
    ).toEqual(state({ googleEnded: 'failed' }));
  });

  it('Change number while linking returns to the link step, the login kept', () => {
    expect(loginReducer(linkingCode, { type: 'change-number' })).toEqual(linking);
  });

  it('Change number off the link never enters it', () => {
    expect(loginReducer(cooled, { type: 'change-number' }).step).toBe('phone');
  });

  it('Use my number instead drops the login and returns to the phone step', () => {
    expect(loginReducer(linking, { type: 'use-number' })).toEqual(state({}));
  });

  it('another Google account, picked from the link step, is checked afresh', () => {
    const sheet = loginReducer(linking, { type: 'google' });
    const next = loginReducer(sheet, {
      type: 'google-sheet-ended',
      result: { kind: 'token', token: OTHER },
    });
    expect(next.pending).toEqual({ kind: 'google', token: OTHER, code: null });
  });

  it.each(['expired', 'invalidated'] as const)(
    'a %s link code is that verify answer, the login kept',
    (outcome) => {
      expect(loginReducer(proving, { type: 'google-ended', outcome, triesLeft: 5 })).toMatchObject({
        pending: null,
        verify: outcome,
        code: '',
        google: TOKEN,
      });
    },
  );

  it('a cancel on the taken-phone frame leaves that frame drawn (decision 11)', () => {
    const taken = loginReducer(proving, {
      type: 'google-ended',
      outcome: 'phone-taken',
      triesLeft: 5,
    });
    const sheet = loginReducer(taken, { type: 'google' });
    const back = loginReducer(sheet, { type: 'google-sheet-ended', result: { kind: 'cancelled' } });
    expect(back).toEqual(taken);
    expect(frameKindOf(back)).toBe('google-phone-taken');
  });

  it('a new token clears what the last sign-in left', () => {
    const sheet = state({ googleEnded: 'phone-taken', pending: { kind: 'google-sheet' } });
    expect(
      loginReducer(sheet, { type: 'google-sheet-ended', result: { kind: 'token', token: OTHER } }),
    ).toMatchObject({ googleEnded: null, pending: { kind: 'google', token: OTHER, code: null } });
  });

  it.each([
    ['a token while a Google call runs', checking, { kind: 'token', token: OTHER }],
    [
      'a cancel while a code request runs',
      state({ pending: { kind: 'request', phone: PHONE, channel: 'sms' } }),
      { kind: 'cancelled' },
    ],
    ['a cancel with no sheet open', state({}), { kind: 'cancelled' }],
  ] as const)('a sheet answer no open sheet asked for is ignored: %s', (_, from, result) => {
    expect(loginReducer(from, { type: 'google-sheet-ended', result })).toBe(from);
  });

  it('Sign in with this number anywhere but the taken-phone frame is ignored', () => {
    const idle = state({});
    expect(loginReducer(idle, { type: 'sign-in-by-number' })).toBe(idle);
  });
});
