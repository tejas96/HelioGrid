import { randomUUID } from 'node:crypto';
import { subscription, subscriptionPayment, subscriptionStateHistory } from '@heliogrid/db';
import {
  type BillingState,
  type ChargeSucceeded,
  MS_PER_DAY,
  minorUnits,
  PAST_DUE_GRACE_DAYS,
} from '@heliogrid/domain';
import { asc, eq, sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ChargeRefused, type ChargeService } from '../../src/modules/billing/charge.service';
import {
  aCompany,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { chargeServiceOf } from './support';

/**
 * Charge truth, against a migrated database (`M12-09`): a successful charge records its payment
 * and grows the window in one act, and no late, repeated or older message moves a company back.
 * Every moment sits in 1995: the billing timers' suite sweeps 1990, and a trial here ends in 2100,
 * so no timer run of another suite touches these rows.
 */

const skip = skipWithoutDatabase(
  'CHARGE TRUTH PROOF',
  'The payment record and the charge ordering are UNPROVEN in this run.',
);

const FAILED_AT = Date.parse('1995-03-01T06:00:00Z');
/** A monthly cycle, and the day of the grace the gateway's retry succeeds on. */
const PERIOD_DAYS = 30;
const RETRY_DAY = 2;
/** A month of Growth at ₹3,999, in paise. */
const MONTHLY_PAISE = 399_900;
const PERIOD_END = FAILED_AT + PERIOD_DAYS * MS_PER_DAY;
const NEXT_PERIOD_END = PERIOD_END + PERIOD_DAYS * MS_PER_DAY;
const TRIAL_END_FAR_AWAY = Date.parse('2100-01-01T00:00:00Z');
const NOW = Date.parse('1995-06-01T00:00:00Z');
const HALTED_AT = FAILED_AT + PAST_DUE_GRACE_DAYS * MS_PER_DAY;

describe.skipIf(skip)('charge truth (M12-09)', () => {
  let pools: ReturnType<typeof openPools>;
  let charges: ChargeService;
  let companies: Company[] = [];

  beforeAll(() => {
    pools = openPools();
    charges = chargeServiceOf(pools.admin.db);
  });

  afterEach(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    companies = [];
  });

  afterAll(async () => {
    await pools.close();
  });

  /** A company holding one subscription in `state`, entered at `enteredAt`. */
  async function aSubscriptionIn(
    state: BillingState,
    enteredAt: number,
    paidPeriodEnd: number | null = PERIOD_END,
  ): Promise<{ tenantId: string; subscriptionId: string }> {
    const company = aCompany(`Charge Truth ${randomUUID()}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    const [held] = await pools.admin.db
      .insert(subscription)
      .values({
        tenantId: company.tenantId,
        state,
        stateEnteredAt: new Date(enteredAt),
        trialEndsAt: new Date(TRIAL_END_FAR_AWAY),
        paidPeriodEnd: paidPeriodEnd === null ? null : new Date(paidPeriodEnd),
        createdAt: new Date(enteredAt),
      })
      .returning({ id: subscription.id });
    if (held === undefined) throw new Error('the subscription was not seeded');
    return { tenantId: company.tenantId, subscriptionId: held.id };
  }

  function aCharge(subscriptionId: string, overrides: Partial<ChargeSucceeded> = {}) {
    return {
      subscriptionId,
      chargeRef: `charge_${randomUUID()}`,
      occurredAt: FAILED_AT + RETRY_DAY * MS_PER_DAY,
      paysThrough: NEXT_PERIOD_END,
      amount: minorUnits(MONTHLY_PAISE),
      currencyCode: 'INR',
      ...overrides,
    } satisfies ChargeSucceeded;
  }

  async function standingOf(subscriptionId: string) {
    const [row] = await pools.admin.db
      .select({
        state: subscription.state,
        stateEnteredAt: subscription.stateEnteredAt,
        paidPeriodEnd: subscription.paidPeriodEnd,
      })
      .from(subscription)
      .where(eq(subscription.id, subscriptionId));
    if (row === undefined) throw new Error('the subscription is gone');
    return {
      state: row.state,
      stateEnteredAt: row.stateEnteredAt.getTime(),
      paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null,
    };
  }

  async function historyOf(subscriptionId: string) {
    return pools.admin.db
      .select({ state: subscriptionStateHistory.state, cause: subscriptionStateHistory.cause })
      .from(subscriptionStateHistory)
      .where(eq(subscriptionStateHistory.subscriptionId, subscriptionId))
      .orderBy(asc(subscriptionStateHistory.id));
  }

  async function paymentsOf(subscriptionId: string) {
    return pools.admin.db
      .select({
        gatewayChargeRef: subscriptionPayment.gatewayChargeRef,
        amountMinor: subscriptionPayment.amountMinor,
        currencyCode: subscriptionPayment.currencyCode,
      })
      .from(subscriptionPayment)
      .where(eq(subscriptionPayment.subscriptionId, subscriptionId));
  }

  it('a successful charge records the payment, grows the window and makes a past-due company active in one act', async () => {
    const { subscriptionId } = await aSubscriptionIn('past_due', FAILED_AT);
    const charge = aCharge(subscriptionId);

    expect(await charges.recordSuccess(charge, NOW)).toBe('recorded');

    expect(await standingOf(subscriptionId)).toEqual({
      state: 'active',
      stateEnteredAt: charge.occurredAt,
      paidPeriodEnd: NEXT_PERIOD_END,
    });
    expect(await paymentsOf(subscriptionId)).toEqual([
      { gatewayChargeRef: charge.chargeRef, amountMinor: MONTHLY_PAISE, currencyCode: 'INR' },
    ]);
    expect(await historyOf(subscriptionId)).toEqual([{ state: 'active', cause: 'paid' }]);
  });

  it('the same charge twice is recorded once', async () => {
    const { subscriptionId } = await aSubscriptionIn('past_due', FAILED_AT);
    const charge = aCharge(subscriptionId);

    await charges.recordSuccess(charge, NOW);
    expect(await charges.recordSuccess(charge, NOW)).toBe('duplicate');

    expect(await paymentsOf(subscriptionId)).toHaveLength(1);
    expect(await historyOf(subscriptionId)).toEqual([{ state: 'active', cause: 'paid' }]);
  });

  it('a late failure older than the last charge leaves the company active', async () => {
    const { subscriptionId } = await aSubscriptionIn('past_due', FAILED_AT);
    await charges.recordSuccess(aCharge(subscriptionId), NOW);
    // A renewal later in the period, then the day-0 failure re-sent after both.
    await charges.recordSuccess(
      aCharge(subscriptionId, { occurredAt: PERIOD_END, paysThrough: NEXT_PERIOD_END }),
      NOW,
    );

    expect(
      await charges.recordFailure({ subscriptionId, occurredAt: PERIOD_END - MS_PER_DAY }),
    ).toBe('stale');
    expect(await charges.recordFailure({ subscriptionId, occurredAt: FAILED_AT })).toBe('stale');

    expect((await standingOf(subscriptionId)).state).toBe('active');
    expect(await historyOf(subscriptionId)).toEqual([{ state: 'active', cause: 'paid' }]);
  });

  it('a newer failure makes an active company past due once', async () => {
    const { subscriptionId } = await aSubscriptionIn('active', FAILED_AT);
    const failure = { subscriptionId, occurredAt: PERIOD_END };

    expect(await charges.recordFailure(failure)).toBe('moved');
    expect(await charges.recordFailure(failure)).toBe('stale');

    expect(await standingOf(subscriptionId)).toMatchObject({
      state: 'past_due',
      stateEnteredAt: PERIOD_END,
    });
    expect(await historyOf(subscriptionId)).toEqual([
      { state: 'past_due', cause: 'charge_failed' },
    ]);
  });

  it('an older charge never shortens the window', async () => {
    const { subscriptionId } = await aSubscriptionIn('active', FAILED_AT, NEXT_PERIOD_END);

    await charges.recordSuccess(
      aCharge(subscriptionId, { occurredAt: FAILED_AT + MS_PER_DAY, paysThrough: PERIOD_END }),
      NOW,
    );

    expect(await standingOf(subscriptionId)).toMatchObject({
      state: 'active',
      paidPeriodEnd: NEXT_PERIOD_END,
    });
    expect(await paymentsOf(subscriptionId)).toHaveLength(1);
  });

  it('a late charge made inside the grace makes a halted company active', async () => {
    const { subscriptionId } = await aSubscriptionIn('halted', HALTED_AT);
    const charge = aCharge(subscriptionId, { occurredAt: HALTED_AT - MS_PER_DAY });

    expect(await charges.recordSuccess(charge, NOW)).toBe('recorded');

    expect(await standingOf(subscriptionId)).toEqual({
      state: 'active',
      stateEnteredAt: charge.occurredAt,
      paidPeriodEnd: NEXT_PERIOD_END,
    });
  });

  it('a late charge inside the grace leaves a halt alone once the company has reactivated', async () => {
    const { tenantId, subscriptionId } = await aSubscriptionIn('halted', HALTED_AT);
    await pools.admin.db.insert(subscription).values({
      tenantId,
      state: 'active',
      stateEnteredAt: new Date(HALTED_AT + MS_PER_DAY),
      paidPeriodEnd: new Date(NEXT_PERIOD_END),
      createdAt: new Date(HALTED_AT + MS_PER_DAY),
    });
    const before = await standingOf(subscriptionId);

    const charge = aCharge(subscriptionId, { occurredAt: HALTED_AT - MS_PER_DAY });

    expect(await charges.recordSuccess(charge, NOW)).toBe('dead');

    expect(await standingOf(subscriptionId)).toEqual(before);
    expect(await paymentsOf(subscriptionId)).toHaveLength(1);
  });

  it('a charge on a halted company after its grace records the payment and moves nothing', async () => {
    const { subscriptionId } = await aSubscriptionIn('halted', HALTED_AT);
    const before = await standingOf(subscriptionId);

    expect(
      await charges.recordSuccess(aCharge(subscriptionId, { occurredAt: HALTED_AT }), NOW),
    ).toBe('dead');

    expect(await standingOf(subscriptionId)).toEqual(before);
    expect(await paymentsOf(subscriptionId)).toHaveLength(1);
    expect(await historyOf(subscriptionId)).toEqual([]);
  });

  it.each([
    { refused: 'another currency', charge: { currencyCode: 'USD' } },
    { refused: 'an amount of zero', charge: { amount: minorUnits(0) } },
    { refused: 'an unknown subscription', charge: { subscriptionId: randomUUID() } },
  ])('a refused charge writes nothing ($refused)', async ({ charge: override }) => {
    const { subscriptionId } = await aSubscriptionIn('past_due', FAILED_AT);
    const before = await standingOf(subscriptionId);

    await expect(
      charges.recordSuccess(aCharge(subscriptionId, override), NOW),
    ).rejects.toBeInstanceOf(ChargeRefused);

    expect(await standingOf(subscriptionId)).toEqual(before);
    expect(await paymentsOf(subscriptionId)).toEqual([]);
  });

  it('a charge that waits on the halt is judged on the halted row', async () => {
    const { subscriptionId } = await aSubscriptionIn('past_due', FAILED_AT);
    // The timer's halt, held open: it commits only once the charge is seen waiting on it.
    const halt = await holdLock(
      sql`update subscription set state = 'halted', state_entered_at = ${new Date(HALTED_AT).toISOString()}
          where id = ${subscriptionId}`,
    );
    let released = false;
    try {
      // Made at the halt itself, so on the halted row it moves nothing.
      const charged = charges.recordSuccess(
        aCharge(subscriptionId, { occurredAt: HALTED_AT }),
        NOW,
      );
      await halt.waitForWaiters(1);
      await halt.release();
      released = true;
      expect(await charged).toBe('dead');
    } finally {
      if (!released) await halt.release();
    }

    expect(await standingOf(subscriptionId)).toMatchObject({ state: 'halted' });
    expect(await paymentsOf(subscriptionId)).toHaveLength(1);
  });
});
