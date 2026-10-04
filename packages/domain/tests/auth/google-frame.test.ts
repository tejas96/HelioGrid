import { describe, expect, it } from 'vitest';
import { googleLinkFrame, phoneGoogle } from '../../src/auth/google-frame';
import { INITIAL_LOGIN_STATE, type LoginState } from '../../src/auth/login-state';

const TOKEN = { idToken: 'id-token', nonce: null, email: 'priya.sharma@gmail.com' };
const linking = (over: Partial<LoginState>): LoginState => ({
  ...INITIAL_LOGIN_STATE,
  step: 'google-link',
  phone: '+919820041123',
  google: TOKEN,
  ...over,
});

describe('googleLinkFrame — the link step (SCR-M01-01 m-google-link)', () => {
  it('confirms the number: the field and Send code are live', () => {
    expect(googleLinkFrame(linking({}))).toEqual({
      kind: 'link',
      phoneEnabled: true,
      sendOffered: true,
      sending: false,
    });
  });

  it('Send code spins and the field locks while the code is asked for', () => {
    const asked = linking({ pending: { kind: 'request', phone: '+919820041123', channel: 'sms' } });
    expect(googleLinkFrame(asked)).toEqual({
      kind: 'link',
      phoneEnabled: false,
      sendOffered: true,
      sending: true,
    });
  });

  it('the number under its lock: linking waits, Send code is gone (m-google-link-locked)', () => {
    expect(googleLinkFrame(linking({ request: 'locked' }))).toEqual({
      kind: 'link-locked',
      phoneEnabled: false,
      sendOffered: false,
      sending: false,
    });
  });
});

describe('phoneGoogle — the Google control on the phone step', () => {
  it.each<[string, Partial<LoginState>, { busy: boolean; failed: boolean }]>([
    ['idle', {}, { busy: false, failed: false }],
    [
      'the sheet open (m-google-loading)',
      { pending: { kind: 'google-sheet' } },
      { busy: true, failed: false },
    ],
    [
      'the token checked',
      { pending: { kind: 'google', token: TOKEN, code: null } },
      { busy: true, failed: false },
    ],
    [
      'a code in flight is not Google',
      { pending: { kind: 'verify', code: '123456' } },
      { busy: false, failed: false },
    ],
    [
      'a sign-in that did not finish (m-google-failed)',
      { googleEnded: 'failed' },
      { busy: false, failed: true },
    ],
    [
      "a taken phone is the code step's, not this",
      { googleEnded: 'phone-taken' },
      { busy: false, failed: false },
    ],
  ])('%s', (_, facts, expected) => {
    expect(phoneGoogle({ ...INITIAL_LOGIN_STATE, ...facts })).toEqual(expected);
  });
});
