import { describe, expect, it } from 'vitest';
import { billingStandingOf, type StandingRow } from '../../src/commerce/billing-standing';
import { MS_PER_DAY } from '../../src/format/zone';
import { IN_PAYMENT_RAILS } from '../../src/rails/pack';

const ENTERED = Date.UTC(2026, 8, 11, 6, 30);
const day = (n: number) => ENTERED + n * MS_PER_DAY;
const ladder = IN_PAYMENT_RAILS.ladder;

function row(overrides: Partial<StandingRow>): StandingRow {
  return {
    state: 'active',
    stateEnteredAt: ENTERED,
    trialEndsAt: null,
    paidPeriodEnd: day(30),
    tier: 'growth',
    cycle: 'monthly',
    ...overrides,
  };
}

const TRIAL = { tier: null, cycle: null, paidPeriodEnd: null, trialEndsAt: day(14) } as const;

describe('billingStandingOf — where a subscription stands, with no amount (M12-56)', () => {
  it.each([
    {
      name: 'a trial running',
      held: row({ state: 'trialing', ...TRIAL }),
      now: day(13),
      expected: { state: 'trialing', phase: 'trialing', trialEndsAt: day(14), collection: null },
    },
    {
      name: 'a trial at its end, the sweep not yet run',
      held: row({ state: 'trialing', ...TRIAL }),
      now: day(14),
      expected: {
        state: 'expired',
        phase: 'expired',
        stateEnteredAt: day(14),
        trialEndsAt: day(14),
      },
    },
    {
      name: 'an expired trial',
      held: row({ state: 'expired', ...TRIAL, stateEnteredAt: day(14) }),
      now: day(40),
      expected: { state: 'expired', phase: 'expired', trialEndsAt: day(14) },
    },
    {
      name: 'an active monthly mandate, a converted trial’s end hidden',
      held: row({ trialEndsAt: day(-2) }),
      now: day(1),
      expected: { state: 'active', phase: 'active', collection: 'mandate', trialEndsAt: null },
    },
    {
      name: 'an active yearly row, collected on a link',
      held: row({ cycle: 'yearly' }),
      now: day(1),
      expected: { state: 'active', collection: 'invoice' },
    },
    {
      name: 'past_due on day 3, still full function',
      held: row({ state: 'past_due' }),
      now: day(4) - 1,
      expected: {
        state: 'past_due',
        phase: 'past_due_full_function',
        pausesAt: day(4),
        graceEndsAt: day(7),
      },
    },
    {
      name: 'past_due on day 4, per-use features paused',
      held: row({ state: 'past_due' }),
      now: day(4),
      expected: { state: 'past_due', phase: 'past_due_metered_paused', pausesAt: day(4) },
    },
    {
      name: 'past_due a moment before the grace ends',
      held: row({ state: 'past_due' }),
      now: day(7) - 1,
      expected: { state: 'past_due', graceEndsAt: day(7) },
    },
    {
      name: 'past_due at the grace end, the sweep not yet run',
      held: row({ state: 'past_due' }),
      now: day(7),
      expected: {
        state: 'halted',
        phase: 'halted',
        stateEnteredAt: day(7),
        pausesAt: null,
        graceEndsAt: null,
      },
    },
    {
      name: 'a halted row',
      held: row({ state: 'halted', stateEnteredAt: day(7) }),
      now: day(400),
      expected: { state: 'halted', phase: 'halted', paidPeriodEnd: day(30) },
    },
    {
      name: 'cancelled a moment before its period ends',
      held: row({ state: 'cancelled' }),
      now: day(30) - 1,
      expected: { state: 'cancelled', phase: 'active', paidPeriodEnd: day(30) },
    },
    {
      name: 'cancelled at its period end',
      held: row({ state: 'cancelled' }),
      now: day(30),
      expected: { state: 'cancelled', phase: 'cancelled_post_period' },
    },
  ])('$name', ({ held, now, expected }) => {
    const standing = billingStandingOf(held, ladder, now);

    expect(standing).toMatchObject(expected);
    if (standing.state !== 'past_due') {
      expect([standing.pausesAt, standing.graceEndsAt]).toEqual([null, null]);
    }
  });
});
