import { randomUUID } from 'node:crypto';
import { subscription, subscriptionPayment } from '@heliogrid/db';
import { METERED_PAUSE_DAY, MS_PER_DAY, minorUnits, PAST_DUE_GRACE_DAYS } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { companyNoticesLock } from '../../src/modules/billing/billing-notice.admin.repository';
import type { BillingNoticeService } from '../../src/modules/billing/billing-notice.service';
import { openPools, skipWithoutDatabase } from '../support/fixture';
import type { HeldLock } from '../support/held-lock';
import { holdLock } from '../support/held-lock';
import { publishIndiaPack } from '../support/market';
import {
  aMinute,
  day,
  FAILED,
  holdTheSweep,
  moveTo,
  NoticeCompanies,
  noticeServiceOf,
  notificationsOf,
  RecordedCarrier,
  SIGNED_UP_LONG_AGO,
  toldTo,
} from './notice-bench';
import { aPlan, chargeServiceOf } from './support';

/**
 * The dunning ladder, against a migrated database (`M12-09`, `M12-39`, `M12-41`): each rung told
 * on its day while its state holds, once, and cleared by the payment that ends it.
 */

/** `M12-39` — after the halt, the win-backs come weekly. */
const WEEK_DAYS = 7;
/** A monthly cycle, paid on the day after the reminder: a month of Growth at ₹3,999, in paise. */
const PERIOD_DAYS = 30;
const MONTHLY_PAISE = 399_900;
/** `M12-39` — the reminder's day. */
const REMINDER_DAY = 2;

const skip = skipWithoutDatabase(
  'DUNNING LADDER PROOF',
  'The dunning ladder and its clearance by a payment are UNPROVEN in this run.',
);

describe.skipIf(skip)('the dunning ladder (M12-09, M12-39, M12-41)', () => {
  let pools: ReturnType<typeof openPools>;
  let notices: BillingNoticeService;
  let companies: NoticeCompanies;
  let sweep: HeldLock;

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
    notices = noticeServiceOf(pools, new RecordedCarrier());
    companies = new NoticeCompanies(pools);
  });

  beforeEach(async () => {
    sweep = await holdTheSweep();
  });

  afterEach(async () => {
    await companies.removeAll();
    await sweep.release();
  });

  afterAll(async () => {
    await pools.close();
  });

  it('an unpaid company is told each rung on its day, from the failure to the halt', async () => {
    const held = await companies.holding({ state: 'past_due', enteredAt: FAILED });
    for (let n = 0; n <= PAST_DUE_GRACE_DAYS; n += 1) {
      if (n === PAST_DUE_GRACE_DAYS) {
        // Due, but the timers have not recorded the halt yet: nothing is told before it holds.
        expect((await notices.tellDue(day(n) + aMinute)).told).toBe(0);
        await moveTo(pools, held.subscriptionId, 'halted', day(n));
      }
      await notices.tellDue(day(n) + aMinute);
      await notices.tellDue(day(n) + 2 * aMinute);
    }
    const told = await toldTo(pools, held.subscriptionId);
    expect(
      told.map((row) => `${row.notice}@${(row.dueAt.getTime() - FAILED) / MS_PER_DAY}`),
    ).toEqual([
      'payment_failed@0',
      'payment_reminder@2',
      'metered_paused@4',
      'final_warning@6',
      'halted@7',
    ]);
    const words = await notificationsOf(pools, held.tenantId);
    expect(words.map((one) => one.title)).toEqual([
      'Payment failed',
      'Payment still due',
      'Some features are paused',
      'Your plan halts within a day',
      'Your plan is halted',
    ]);
    expect(words[2]?.body).toBe(
      'Your plan is unpaid. Paused until you pay: the voice agent, AI roof detection and team invites. ' +
        'Still working: reading and search, exports, customer links, billing, creating and editing records, ' +
        'editing designs, selling and delivery, new file uploads and uploading field photos already taken. ' +
        'If the plan halts, your launch price ends and a restart bills at today’s prices. ' +
        'Pay in Billing to turn them back on.',
    );
    expect(words[4]?.body).toBe(
      'Your plan is halted because it is unpaid. Still working: reading and search, exports, customer ' +
        'links, billing and uploading field photos already taken. Your launch price has ended; ' +
        'reactivating bills at today’s prices. Reactivate with one payment in Billing.',
    );
    // Then weekly: the first win-back a week after the halt, and nothing between.
    const firstWinBack = PAST_DUE_GRACE_DAYS + WEEK_DAYS;
    expect((await notices.tellDue(day(firstWinBack) - aMinute)).told).toBe(0);
    await notices.tellDue(day(firstWinBack) + aMinute);
    expect((await toldTo(pools, held.subscriptionId)).at(-1)?.notice).toBe('win_back');
  });

  it('tells a company past its protection horizon of no loss it no longer risks', async () => {
    const held = await companies.holding(
      { state: 'past_due', enteredAt: FAILED },
      SIGNED_UP_LONG_AGO,
    );
    await notices.tellDue(FAILED + aMinute);
    const [told] = await toldTo(pools, held.subscriptionId);
    expect(told?.forfeitureDisclosed).toBe(false);
    const [words] = await notificationsOf(pools, held.tenantId);
    expect(words?.body).not.toContain('launch price');
  });

  it('a failure sent again leaves one payment-failed notice', async () => {
    const held = await companies.holding({
      state: 'active',
      enteredAt: FAILED - PERIOD_DAYS * MS_PER_DAY,
    });
    const charges = chargeServiceOf(pools);
    const fail = (occurredAt: number) =>
      charges.recordFailure({ subscriptionId: held.subscriptionId, occurredAt });
    expect(await fail(FAILED)).toBe('moved');
    await notices.tellDue(FAILED + aMinute);
    expect(await fail(FAILED)).toBe('stale');
    expect(await fail(FAILED + aMinute)).toBe('stale');
    // The sweep runs again, and again: the key tells the failure once.
    await notices.tellDue(FAILED + aMinute + aMinute);
    await notices.tellDue(FAILED + aMinute + aMinute + aMinute);
    expect((await toldTo(pools, held.subscriptionId)).map((row) => row.notice)).toEqual([
      'payment_failed',
    ]);
  });

  it('a payment clears every open notice of its company in its own transaction', async () => {
    const held = await companies.holding({ state: 'past_due', enteredAt: FAILED });
    await notices.tellDue(FAILED + aMinute);
    await notices.tellDue(day(REMINDER_DAY) + aMinute);
    const paidAt = day(REMINDER_DAY + 1);
    const recorded = await chargeServiceOf(pools).recordSuccess(
      {
        subscriptionId: held.subscriptionId,
        chargeRef: `charge_${randomUUID()}`,
        occurredAt: paidAt,
        paysThrough: paidAt + PERIOD_DAYS * MS_PER_DAY,
        amount: minorUnits(MONTHLY_PAISE),
        currencyCode: 'INR',
      },
      paidAt + aMinute,
    );
    expect(recorded).toBe('recorded');
    const [payment] = await pools.admin.db
      .select({ id: subscriptionPayment.id })
      .from(subscriptionPayment)
      .where(eq(subscriptionPayment.subscriptionId, held.subscriptionId));
    const cleared = (await toldTo(pools, held.subscriptionId)).map((row) => [
      row.notice,
      row.clearedByPayment,
      row.clearedAt?.getTime(),
      row.nextDueAt,
    ]);
    expect(cleared).toEqual([
      ['payment_failed', payment?.id, paidAt + aMinute, null],
      ['payment_reminder', payment?.id, paidAt + aMinute, null],
    ]);
    // Active again: day 4's pause and every later rung never come.
    for (const n of [METERED_PAUSE_DAY, PAST_DUE_GRACE_DAYS]) {
      await notices.tellDue(day(n) + aMinute);
    }
    expect(await toldTo(pools, held.subscriptionId)).toHaveLength(2);
  });

  it('a late charge that leaves the company unpaid clears nothing, and the ladder goes on', async () => {
    const held = await companies.holding({ state: 'past_due', enteredAt: FAILED });
    await notices.tellDue(FAILED + aMinute);
    // Collected the day before the failure, told only now: it pays an earlier period.
    const collectedBefore = FAILED - MS_PER_DAY;
    const recorded = await chargeServiceOf(pools).recordSuccess(
      {
        subscriptionId: held.subscriptionId,
        chargeRef: `charge_${randomUUID()}`,
        occurredAt: collectedBefore,
        paysThrough: collectedBefore + aMinute,
        amount: minorUnits(MONTHLY_PAISE),
        currencyCode: 'INR',
      },
      day(1),
    );
    expect(recorded).toBe('recorded');
    expect((await toldTo(pools, held.subscriptionId)).map((row) => row.clearedAt)).toEqual([null]);
    await notices.tellDue(day(REMINDER_DAY) + aMinute);
    expect((await toldTo(pools, held.subscriptionId)).map((row) => row.notice)).toEqual([
      'payment_failed',
      'payment_reminder',
    ]);
  });

  it('a notice and a payment on one company take turns on the company’s lock', async () => {
    const held = await companies.holding({ state: 'past_due', enteredAt: FAILED });
    await notices.tellDue(FAILED + aMinute);
    const paidAt = day(REMINDER_DAY) + aMinute;
    const lock = await holdLock(companyNoticesLock(held.tenantId));
    const telling = notices.tellDue(paidAt);
    await lock.waitForWaiters(1);
    // Pools of its own: the sweep holds the suite's one admin connection while it waits.
    const beside = openPools();
    const paying = chargeServiceOf(beside).recordSuccess(
      {
        subscriptionId: held.subscriptionId,
        chargeRef: `charge_${randomUUID()}`,
        occurredAt: paidAt,
        paysThrough: paidAt + PERIOD_DAYS * MS_PER_DAY,
        amount: minorUnits(MONTHLY_PAISE),
        currencyCode: 'INR',
      },
      paidAt,
    );
    await lock.waitForWaiters(2);
    await lock.release();
    await Promise.all([telling, paying]);
    await beside.close();
    // The reminder was told first, and the payment that followed cleared it with the rest.
    expect(
      (await toldTo(pools, held.subscriptionId)).map((row) => [row.notice, row.clearedAt !== null]),
    ).toEqual([
      ['payment_failed', true],
      ['payment_reminder', true],
    ]);
  });

  it('a payment on a new row waits on the company’s lock its old row’s notices are told under', async () => {
    const old = await companies.holding({ state: 'past_due', enteredAt: FAILED });
    await moveTo(pools, old.subscriptionId, 'halted', day(PAST_DUE_GRACE_DAYS));
    const [renewed] = await pools.admin.db
      .insert(subscription)
      .values({
        tenantId: old.tenantId,
        state: 'past_due',
        stateEnteredAt: new Date(day(PAST_DUE_GRACE_DAYS + 1)),
        paidPeriodEnd: new Date(day(PAST_DUE_GRACE_DAYS + 1)),
        createdAt: new Date(day(PAST_DUE_GRACE_DAYS + 1)),
        ...(await aPlan(pools.admin.db)),
      })
      .returning({ id: subscription.id });
    if (renewed === undefined) throw new Error('the new row was not seeded');
    const paidAt = day(PAST_DUE_GRACE_DAYS + REMINDER_DAY);
    const lock = await holdLock(companyNoticesLock(old.tenantId));
    const paying = chargeServiceOf(pools).recordSuccess(
      {
        subscriptionId: renewed.id,
        chargeRef: `charge_${randomUUID()}`,
        occurredAt: paidAt,
        paysThrough: paidAt + PERIOD_DAYS * MS_PER_DAY,
        amount: minorUnits(MONTHLY_PAISE),
        currencyCode: 'INR',
      },
      paidAt,
    );
    // The new row's lock is free, so only the company's lock can hold the payment back.
    await lock.waitForWaiters(1);
    await lock.release();
    expect(await paying).toBe('recorded');
  });
});
