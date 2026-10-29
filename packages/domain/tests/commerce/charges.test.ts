import { describe, expect, it } from 'vitest';
import { type ChargeStanding, failureMoves, successEffect } from '../../src/commerce/charges';
import { PAST_DUE_GRACE_DAYS } from '../../src/commerce/lifecycle';
import { MS_PER_DAY } from '../../src/format/zone';

const ENTERED = Date.UTC(2026, 9, 1, 6, 30);
const PERIOD_END = ENTERED + 30 * MS_PER_DAY;
const ONE_MS = 1;

function standing(overrides: Partial<ChargeStanding>): ChargeStanding {
  return {
    state: 'active',
    stateEnteredAt: ENTERED,
    paidPeriodEnd: PERIOD_END,
    lastChargedAt: ENTERED,
    replaced: false,
    ...overrides,
  };
}

describe('successEffect — a successful charge is entitlement truth (M12-09)', () => {
  it('the window only grows', () => {
    const later = PERIOD_END + 30 * MS_PER_DAY;
    expect(
      successEffect(standing({}), { occurredAt: ENTERED + ONE_MS, paysThrough: later }),
    ).toMatchObject({ paidPeriodEnd: later });
    expect(
      successEffect(standing({}), { occurredAt: ENTERED + ONE_MS, paysThrough: ENTERED }),
    ).toMatchObject({ paidPeriodEnd: PERIOD_END });
    expect(
      successEffect(standing({ state: 'trialing', paidPeriodEnd: null, lastChargedAt: null }), {
        occurredAt: ENTERED + ONE_MS,
        paysThrough: PERIOD_END,
      }),
    ).toMatchObject({ paidPeriodEnd: PERIOD_END });
  });

  it.each(['trialing', 'past_due'] as const)(
    'a success moves a trial or past-due company to active (%s)',
    (state) => {
      expect(
        successEffect(standing({ state }), {
          occurredAt: ENTERED + ONE_MS,
          paysThrough: PERIOD_END,
        }),
      ).toEqual({ outcome: 'live', paidPeriodEnd: PERIOD_END, moveTo: 'active' });
    },
  );

  it('a renewal on an active company grows the window and moves nothing', () => {
    expect(
      successEffect(standing({}), { occurredAt: PERIOD_END, paysThrough: PERIOD_END + 1 }),
    ).toEqual({ outcome: 'live', paidPeriodEnd: PERIOD_END + 1, moveTo: null });
  });

  it('a success older than the current state moves nothing', () => {
    expect(
      successEffect(standing({ state: 'past_due' }), {
        occurredAt: ENTERED - ONE_MS,
        paysThrough: PERIOD_END,
      }),
    ).toEqual({ outcome: 'live', paidPeriodEnd: PERIOD_END, moveTo: null });
  });

  it('a success wins a tie with a failure', () => {
    expect(
      successEffect(standing({ state: 'past_due' }), {
        occurredAt: ENTERED,
        paysThrough: PERIOD_END,
      }),
    ).toMatchObject({ moveTo: 'active' });
    expect(
      failureMoves(standing({ stateEnteredAt: ENTERED - MS_PER_DAY, lastChargedAt: ENTERED }), {
        occurredAt: ENTERED,
      }),
    ).toBeNull();
  });

  it('a success inside the grace undoes the halt', () => {
    const haltedAt = ENTERED + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
    const later = PERIOD_END + 30 * MS_PER_DAY;
    for (const occurredAt of [ENTERED, haltedAt - ONE_MS]) {
      expect(
        successEffect(standing({ state: 'halted', stateEnteredAt: haltedAt }), {
          occurredAt,
          paysThrough: later,
        }),
      ).toEqual({ outcome: 'live', paidPeriodEnd: later, moveTo: 'active' });
    }
  });

  it('a success after the halt moves nothing', () => {
    const haltedAt = ENTERED + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
    for (const occurredAt of [haltedAt, ENTERED - ONE_MS]) {
      expect(
        successEffect(standing({ state: 'halted', stateEnteredAt: haltedAt }), {
          occurredAt,
          paysThrough: PERIOD_END + MS_PER_DAY,
        }),
      ).toEqual({ outcome: 'dead' });
    }
  });

  it('a success inside the grace leaves a halt alone once the company has reactivated', () => {
    const haltedAt = ENTERED + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
    expect(
      successEffect(standing({ state: 'halted', stateEnteredAt: haltedAt, replaced: true }), {
        occurredAt: haltedAt - ONE_MS,
        paysThrough: PERIOD_END + MS_PER_DAY,
      }),
    ).toEqual({ outcome: 'dead' });
  });

  it.each(['expired', 'cancelled'] as const)('a success on a %s row moves nothing', (state) => {
    expect(
      successEffect(standing({ state }), {
        occurredAt: ENTERED + ONE_MS,
        paysThrough: PERIOD_END + MS_PER_DAY,
      }),
    ).toEqual({ outcome: 'dead' });
  });
});

describe('failureMoves — a failed charge never undoes a later payment (M12-09)', () => {
  it('a newer failure moves an active company to past due', () => {
    expect(failureMoves(standing({}), { occurredAt: ENTERED + ONE_MS })).toBe('past_due');
  });

  it('a failure older than the last charge is stale', () => {
    expect(
      failureMoves(standing({ lastChargedAt: ENTERED + MS_PER_DAY }), {
        occurredAt: ENTERED + ONE_MS,
      }),
    ).toBeNull();
    expect(failureMoves(standing({ lastChargedAt: null }), { occurredAt: ENTERED })).toBeNull();
  });

  it.each(['trialing', 'past_due', 'halted', 'expired', 'cancelled'] as const)(
    'a failure on a %s row moves nothing',
    (state) => {
      expect(failureMoves(standing({ state }), { occurredAt: PERIOD_END })).toBeNull();
    },
  );
});
