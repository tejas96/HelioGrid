import { describe, expect, it } from 'vitest';
import { admit } from '../../src/auth/admission';

describe('admit — a token is compared, never trusted for its remaining life (M01-07, F2-17)', () => {
  it.each([
    {
      membership: null,
      outcome: { admitted: false, reason: 'no-membership' },
      why: 'no membership under this tenant',
    },
    {
      membership: { status: 'invited', authorizationVersion: 3 },
      outcome: { admitted: false, reason: 'not-active' },
      why: 'an invited membership has not accepted',
    },
    {
      membership: { status: 'deactivated', authorizationVersion: 3 },
      outcome: { admitted: false, reason: 'not-active' },
      why: 'a deactivated membership is out within one token life',
    },
    {
      membership: { status: 'active', authorizationVersion: 4 },
      outcome: { admitted: false, reason: 'stale-claims' },
      why: 'a role changed since the token was minted',
    },
    {
      membership: { status: 'active', authorizationVersion: 3 },
      outcome: { admitted: true },
      why: 'the claims still hold',
    },
  ] as const)('$why', ({ membership, outcome }) => {
    expect(admit({ authorizationVersion: 3 }, membership)).toEqual(outcome);
  });
});
