import { describe, expect, it } from 'vitest';
import type { KnownAccount, SessionSnapshot, SessionUser } from '../../src/auth/session';
import { signupView } from '../../src/auth/signup-view';

/**
 * Which panel the company-signup door shows. Two orderings matter: a number that already has a
 * company is asked about BEFORE anything of that account loads (`M01-08`), and a settled person
 * without a company belongs on the company step rather than inside (`M01-10`).
 */
const withoutCompany: SessionUser = {
  id: 'u1',
  name: 'Asha',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  tenant: null,
};
const withCompany: SessionUser = {
  ...withoutCompany,
  tenant: { id: 't1', roles: ['epc_owner'] },
};
const known: KnownAccount = { next: withCompany };

type Signup = Pick<SessionSnapshot, 'status' | 'user' | 'known'>;
const signup = (over: Partial<Signup> = {}): Signup => ({
  status: 'anonymous',
  user: null,
  known: null,
  ...over,
});

describe('signupView', () => {
  it.each([
    [
      'a known number outranks a settled session',
      signup({ status: 'authenticated', user: withCompany, known }),
      'otp',
      'known',
    ],
    ['a known number outranks the step', signup({ known }), 'phone', 'known'],
    [
      'settled WITH a company is done',
      signup({ status: 'authenticated', user: withCompany }),
      'otp',
      'done',
    ],
    [
      'settled WITHOUT a company belongs on the company step',
      signup({ status: 'authenticated', user: withoutCompany }),
      'otp',
      'company',
    ],
    [
      'authenticated with no user is not settled',
      signup({ status: 'authenticated', user: null }),
      'otp',
      'code',
    ],
    ['the otp step shows the code panel', signup(), 'otp', 'code'],
    ['every other step shows the phone panel', signup(), 'phone', 'phone'],
  ] as const)('%s', (_name, session, step, expected) => {
    expect(signupView(session, step)).toBe(expected);
  });
});
