import { describe, expect, it } from 'vitest';
import {
  billingPhaseAt,
  dueTimedCause,
  entitledUntil,
  nextState,
  SUBSCRIPTION_CAUSES,
  type SubscriptionClock,
} from '../../src/commerce/lifecycle';
import { BILLING_CAPABILITIES, capabilityStanding } from '../../src/commerce/soft-block';
import { BILLING_STATES } from '../../src/commerce/states';
import { MS_PER_DAY } from '../../src/format/zone';

const ENTERED = Date.UTC(2026, 9, 1, 6, 30);
const ONE_MS = 1;

function clock(overrides: Partial<SubscriptionClock>): SubscriptionClock {
  return {
    state: 'active',
    stateEnteredAt: ENTERED,
    trialEndsAt: null,
    paidPeriodEnd: null,
    ...overrides,
  };
}

describe('nextState — the one machine (M12-04, M12-07, M12-08)', () => {
  it('moves a subscription only along the machine’s edges', () => {
    const edges = BILLING_STATES.flatMap((from) =>
      SUBSCRIPTION_CAUSES.flatMap((cause) => {
        const to = nextState(from, cause);
        return to === null ? [] : [`${from} -${cause}-> ${to}`];
      }),
    );
    expect(edges).toEqual([
      'trialing -paid-> active',
      'trialing -trial_expired-> expired',
      'active -charge_failed-> past_due',
      'active -cancelled-> cancelled',
      'past_due -paid-> active',
      'past_due -grace_expired-> halted',
      'halted -paid-> active',
    ]);
  });

  it.each(['expired', 'cancelled'] as const)(
    '%s is left only by reactivation, which makes a new subscription',
    (state) => {
      for (const cause of SUBSCRIPTION_CAUSES) expect(nextState(state, cause)).toBeNull();
    },
  );

  it('knows no pause', () => {
    expect(
      [...BILLING_STATES, ...SUBSCRIPTION_CAUSES].filter((name) => /pause/.test(name)),
    ).toEqual([]);
  });
});

describe('billingPhaseAt — the phase the clock puts a subscription in', () => {
  it.each([
    { day: 0, at: 0, phase: 'past_due_full_function' },
    { day: 3, at: 4 * MS_PER_DAY - ONE_MS, phase: 'past_due_full_function' },
    { day: 4, at: 4 * MS_PER_DAY, phase: 'past_due_metered_paused' },
    { day: 6, at: 7 * MS_PER_DAY - ONE_MS, phase: 'past_due_metered_paused' },
    { day: 7, at: 7 * MS_PER_DAY, phase: 'halted' },
  ] as const)('reads the phase of a past-due company by its day — day $day', ({ at, phase }) => {
    expect(billingPhaseAt(clock({ state: 'past_due' }), ENTERED + at)).toBe(phase);
  });

  it.each([
    { at: -ONE_MS, phase: 'trialing' },
    { at: 0, phase: 'expired' },
  ] as const)('reads a trial $at ms from its end as $phase', ({ at, phase }) => {
    const trialEndsAt = ENTERED + 14 * MS_PER_DAY;
    expect(billingPhaseAt(clock({ state: 'trialing', trialEndsAt }), trialEndsAt + at)).toBe(phase);
  });

  it.each([
    { at: -ONE_MS, phase: 'active' },
    { at: 0, phase: 'cancelled_post_period' },
  ] as const)('runs a cancelled company $at ms from its period end as $phase', ({ at, phase }) => {
    const paidPeriodEnd = ENTERED + 20 * MS_PER_DAY;
    expect(billingPhaseAt(clock({ state: 'cancelled', paidPeriodEnd }), paidPeriodEnd + at)).toBe(
      phase,
    );
  });

  it('keeps an active company entitled through the buffer', () => {
    const paidPeriodEnd = ENTERED + 30 * MS_PER_DAY;
    const lastEntitled = entitledUntil(paidPeriodEnd) - ONE_MS;
    expect(entitledUntil(paidPeriodEnd)).toBe(paidPeriodEnd + 3 * MS_PER_DAY);
    expect(billingPhaseAt(clock({ state: 'active', paidPeriodEnd }), lastEntitled)).toBe('active');
    // Past the buffer the clock still blocks nothing: only a failed charge leaves `active`.
    expect(
      billingPhaseAt(clock({ state: 'active', paidPeriodEnd }), lastEntitled + MS_PER_DAY),
    ).toBe('active');
  });

  it('gives a trialing company every capability', () => {
    const trialEndsAt = ENTERED + 14 * MS_PER_DAY;
    const phase = billingPhaseAt(clock({ state: 'trialing', trialEndsAt }), ENTERED);
    const paused = BILLING_CAPABILITIES.filter(
      (capability) => capabilityStanding(capability, phase) === 'paused',
    );
    expect(paused).toEqual([]);
  });
});

describe('dueTimedCause — what the sweep owes a subscription, and from when', () => {
  const trialEndsAt = ENTERED + 14 * MS_PER_DAY;
  const graceEnds = ENTERED + 7 * MS_PER_DAY;

  it.each([
    {
      name: 'a trial before its end',
      at: trialEndsAt - ONE_MS,
      sub: { state: 'trialing', trialEndsAt },
      due: null,
    },
    {
      name: 'a trial at its end',
      at: trialEndsAt,
      sub: { state: 'trialing', trialEndsAt },
      due: { cause: 'trial_expired', dueAt: trialEndsAt },
    },
    {
      name: 'a trial long past its end',
      at: trialEndsAt + 9 * MS_PER_DAY,
      sub: { state: 'trialing', trialEndsAt },
      due: { cause: 'trial_expired', dueAt: trialEndsAt },
    },
    { name: 'past due at day six', at: graceEnds - ONE_MS, sub: { state: 'past_due' }, due: null },
    {
      name: 'past due at day seven',
      at: graceEnds,
      sub: { state: 'past_due' },
      due: { cause: 'grace_expired', dueAt: graceEnds },
    },
    {
      name: 'an expired trial',
      at: trialEndsAt + MS_PER_DAY,
      sub: { state: 'expired', trialEndsAt },
      due: null,
    },
    {
      name: 'an active company long past its period',
      at: ENTERED + 90 * MS_PER_DAY,
      sub: { state: 'active', paidPeriodEnd: ENTERED },
      due: null,
    },
  ] as const)('$name', ({ at, sub, due }) => {
    expect(dueTimedCause(clock(sub), at)).toEqual(due);
  });
});
