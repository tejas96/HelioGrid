import { describe, expect, it } from 'vitest';
import { BILLING_STATES } from '../../src/commerce/states';
import { isNonPaying } from '../../src/commerce/trial';

describe('isNonPaying — the only two states a tenant reaches without paying (BM-03, BM-29)', () => {
  it.each([
    { state: 'trialing', nonPaying: true, why: 'the trial itself — no instrument at signup' },
    { state: 'expired', nonPaying: true, why: 'a trial that ran out, still never having paid' },
    { state: 'active', nonPaying: false, why: 'converted, so an instrument exists' },
    { state: 'past_due', nonPaying: false, why: 'reachable only through a conversion' },
    { state: 'halted', nonPaying: false, why: 'the grace ran out on a tenant who had paid' },
    { state: 'cancelled', nonPaying: false, why: 'a paid period is running down' },
  ] as const)('$state — $why', ({ state, nonPaying }) => {
    expect(isNonPaying(state)).toBe(nonPaying);
  });

  it('leaves exactly two ways to hold the product without paying — no free tier (BM-03)', () => {
    expect(BILLING_STATES.filter(isNonPaying)).toEqual(['trialing', 'expired']);
  });
});
