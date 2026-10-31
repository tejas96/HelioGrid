import { randomUUID } from 'node:crypto';
import { pushDevice } from '@heliogrid/db';
import { MS_PER_DAY, pushDueAt, TRIAL_DAYS, TRIAL_NUDGE_LEAD_DAYS } from '@heliogrid/domain';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { BillingNoticeService } from '../../src/modules/billing/billing-notice.service';
import { settingsServicesOf } from '../settings/support';
import { openPools, skipWithoutDatabase } from '../support/fixture';
import type { HeldLock } from '../support/held-lock';
import { publishIndiaPack } from '../support/market';
import {
  aMinute,
  FAILED,
  holdTheSweep,
  moveTo,
  NoticeCompanies,
  noticeServiceOf,
  notificationsOf,
  RecordedCarrier,
  toldTo,
} from './notice-bench';

/**
 * How a billing notice travels, against a migrated database (`M12-40`, `M12-42`, `F6-14`): the
 * trial's nudges through the dunning pipeline, each owner reached in the app, by push and by the
 * market's text, and nothing told inside the company's quiet window.
 */

/** `M12-42` — day 12 of 14. */
const TRIAL_ENDING_DAYS_LEFT = 2;

const skip = skipWithoutDatabase(
  'BILLING NOTICE CHANNELS PROOF',
  'The trial nudges and the notice channels are UNPROVEN in this run.',
);

describe.skipIf(skip)('the billing notices’ channels and the trial nudges (M12-40, M12-42)', () => {
  let pools: ReturnType<typeof openPools>;
  let carrier: RecordedCarrier;
  let notices: BillingNoticeService;
  let companies: NoticeCompanies;
  let sweep: HeldLock;

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
    companies = new NoticeCompanies(pools);
  });

  beforeEach(async () => {
    sweep = await holdTheSweep();
    carrier = new RecordedCarrier();
    notices = noticeServiceOf(pools, carrier);
  });

  afterEach(async () => {
    await companies.removeAll();
    await sweep.release();
  });

  afterAll(async () => {
    await pools.close();
  });

  it('a trial is told on day 7, day 12 and day 14 through the same pipeline', async () => {
    const ends = FAILED + TRIAL_DAYS * MS_PER_DAY;
    const held = await companies.holding({
      state: 'trialing',
      enteredAt: FAILED,
      trialEndsAt: ends,
    });
    // The day before the first nudge, then each nudge's day: half way, two days left.
    for (const daysLeft of [
      TRIAL_NUDGE_LEAD_DAYS + 1,
      TRIAL_NUDGE_LEAD_DAYS,
      TRIAL_ENDING_DAYS_LEFT,
    ]) {
      await notices.tellDue(ends - daysLeft * MS_PER_DAY + aMinute);
    }
    await notices.tellDue(ends + aMinute);
    await moveTo(pools, held.subscriptionId, 'expired', ends);
    await notices.tellDue(ends + 2 * aMinute);
    expect((await toldTo(pools, held.subscriptionId)).map((row) => row.notice)).toEqual([
      'trial_half_way',
      'trial_ending',
      'trial_ended',
    ]);
    const words = await notificationsOf(pools, held.tenantId);
    expect(words.map((one) => [one.type, one.title])).toEqual([
      ['trial_nudge', '7 days left in your trial'],
      ['trial_nudge', 'Your trial ends in 2 days'],
      ['trial_nudge', 'Your trial has ended'],
    ]);
    expect(carrier.sent.map((one) => one.message)).toEqual([
      expect.stringContaining('free trial has 7 days left'),
      expect.stringContaining('free trial ends in 2 days'),
      expect.stringContaining('free trial has ended'),
    ]);
  });

  it("a notice reaches each owner in the app, by push and by the pack's text", async () => {
    const held = await companies.holding({ state: 'past_due', enteredAt: FAILED }, ['en', 'hi']);
    const [english, hindi] = held.owners;
    if (english === undefined || hindi === undefined) throw new Error('two owners were seeded');
    await pools.admin.db.insert(pushDevice).values({
      userRef: english.userId,
      platform: 'android',
      token: `dunning-${randomUUID()}`,
      registeredAt: new Date(FAILED),
      lastSeenAt: new Date(FAILED),
    });
    await notices.tellDue(FAILED + aMinute);
    const [told] = await toldTo(pools, held.subscriptionId);
    const words = await notificationsOf(pools, held.tenantId);
    expect(
      words.map((one) => [one.recipient, one.language, one.type, one.subjectKind, one.subjectRef]),
    ).toEqual(
      expect.arrayContaining([
        [english.userId, 'en', 'dunning_notice', 'dunning_event', told?.id],
        [hindi.userId, 'hi', 'dunning_notice', 'dunning_event', told?.id],
      ]),
    );
    expect(words.find((one) => one.language === 'hi')?.title).toBe('भुगतान विफल हुआ');
    expect(words.find((one) => one.recipient === english.userId)?.pushSentAt).not.toBeNull();
    const textTo = (phone: string) => carrier.sent.find((one) => one.phoneE164 === phone);
    expect(carrier.sent).toHaveLength(2);
    expect(carrier.sent.every((one) => one.channel === 'sms')).toBe(true);
    expect(textTo(english.phoneE164)?.message).toMatch(
      /^HelioGrid: the payment for .*'s plan failed\. .*Pay or update your payment method: .*\/more\/billing$/,
    );
    expect(textTo(hindi.phoneE164)?.message).toContain('के प्लान का भुगतान विफल हो गया');
  });

  it('holds a notice that falls in the quiet window until the window ends', async () => {
    const atNight = Date.parse('2001-03-03T18:00:00Z');
    const held = await companies.holding({ state: 'past_due', enteredAt: atNight });
    const quiet = await settingsServicesOf(pools).settings.quietHoursOf(held.tenantId);
    const morning = pushDueAt('standard', atNight + aMinute, quiet.window, quiet.timezone);
    expect(morning).toBeGreaterThan(atNight + aMinute);
    await notices.tellDue(atNight + aMinute);
    expect(await toldTo(pools, held.subscriptionId)).toHaveLength(0);
    await notices.tellDue(morning);
    expect((await toldTo(pools, held.subscriptionId)).map((row) => row.firedAt.getTime())).toEqual([
      morning,
    ]);
  });
});
