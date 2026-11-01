import { describe, expect, it } from 'vitest';
import { type BillingNeedsFacts, billingNeedOf } from '../../src/commerce/billing-needs';
import type { BillingState } from '../../src/commerce/states';

const NOW = Date.parse('2026-09-15T06:00:00Z');
const SOME = {};

function facts(
  state: BillingState,
  more: Partial<Omit<BillingNeedsFacts, 'standing'>> & { paidPeriodEnd?: string | null } = {},
): BillingNeedsFacts {
  return {
    standing: { state, paidPeriodEnd: more.paidPeriodEnd ?? null },
    due: more.due ?? null,
    renewal: more.renewal ?? null,
    refund: more.refund ?? null,
    reactivation: more.reactivation ?? null,
  };
}

describe('billingNeedOf — the one thing Needs you holds, and its one act (SCR-M12-02)', () => {
  it.each([
    ['a trial needs nothing', facts('trialing'), 'none'],
    ['an active plan with nothing open needs nothing', facts('active'), 'none'],
    [
      'an active plan in its refund window offers the refund',
      facts('active', { refund: SOME }),
      'refund',
    ],
    [
      'an open renewal outranks the refund window',
      facts('active', { renewal: SOME, refund: SOME }),
      'renewal',
    ],
    ['a failed charge asks to pay', facts('past_due', { due: SOME }), 'pay'],
    ['a past due row with no amount owed asks nothing', facts('past_due'), 'none'],
    ['a halted row is the way back', facts('halted', { reactivation: SOME }), 'way_back'],
    ['an ended trial picks a plan, with no amount', facts('expired'), 'pick_plan'],
    [
      'a cancelled row still inside its period carries on',
      facts('cancelled', { paidPeriodEnd: '2026-10-01T00:00:00Z', reactivation: SOME }),
      'running',
    ],
    [
      'a cancelled row at its period end is the way back',
      facts('cancelled', { paidPeriodEnd: '2026-09-15T06:00:00Z', reactivation: SOME }),
      'way_back',
    ],
    [
      'a cancelled row past its period is the way back',
      facts('cancelled', { paidPeriodEnd: '2026-09-01T00:00:00Z', reactivation: SOME }),
      'way_back',
    ],
  ] as const)('%s', (_, given, need) => {
    expect(billingNeedOf(given, NOW)).toBe(need);
  });
});
