import { describe, expect, it } from 'vitest';
import { landingFor } from '../../src/auth/landing';
import type { SessionUser } from '../../src/auth/session';

/**
 * The rule both navigators obey. Its ORDER is the decision: nothing is known while the store is
 * still booting, the door keeps a visitor who is not settled — the sign-in beat included, which
 * is why `signedOut` and not-yet-signed-in answer the same — and only then does `M01-10` choose
 * between a company's home and the step that makes one.
 */
const person = (tenant: SessionUser['tenant']): SessionUser => ({
  id: 'u1',
  name: 'Asha',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  tenant,
});
const withCompany = person({ id: 't1', roles: ['epc_owner'] });
const withoutCompany = person(null);

describe('landingFor', () => {
  it.each([
    ['booting outranks everything, even a settled person', 'booting', withCompany, 'wait'],
    ['booting with nobody is still wait', 'booting', null, 'wait'],
    ['a signed-out visitor belongs at the door', 'signedOut', null, 'door'],
    ['the sign-in beat keeps the door, though a user is known', 'signedOut', withCompany, 'door'],
    ['settled WITH a company lands home', 'signedIn', withCompany, 'home'],
    [
      'settled WITHOUT a company lands on the company step',
      'signedIn',
      withoutCompany,
      'company-step',
    ],
    ['signedIn with nobody cannot be home', 'signedIn', null, 'company-step'],
  ] as const)('%s', (_name, phase, user, expected) => {
    expect(landingFor(phase, user, null)).toBe(expected);
  });

  it('lands a held removal on access-removed', () => {
    expect(landingFor('signedIn', withCompany, { tenantId: 't1' })).toBe('access-removed');
  });

  it.each([
    ['booting', 'wait'],
    ['signedOut', 'door'],
  ] as const)('keeps a removal found before sign-in at %s', (phase, expected) => {
    expect(landingFor(phase, null, { tenantId: null })).toBe(expected);
  });
});
