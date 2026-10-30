import { describe, expect, it } from 'vitest';
import { IN_BILLING_NOTICE_TEXTS } from '../../src/calling/billing-notice-texts';
import { IN_CALLING_RULES } from '../../src/calling/pack';
import { CALLING_RULES_PACK_SCHEMA } from '../../src/calling/pack-schema';
import { billingNoticeMessage } from '../../src/calling/platform-message';
import {
  BILLING_NOTICES,
  disclosesForfeiture,
  type NoticeClock,
  nextNotice,
} from '../../src/commerce/billing-notices';
import { protectionEndsAt } from '../../src/commerce/grandfathering';
import { pauseNoticeOf } from '../../src/commerce/pause-notice';
import { MS_PER_DAY } from '../../src/format/zone';

const FAILED = Date.UTC(2026, 2, 3, 4, 35);
const HOUR = 60 * 60 * 1_000;

function pastDue(overrides: Partial<NoticeClock> = {}): NoticeClock {
  return {
    state: 'past_due',
    stateEnteredAt: FAILED,
    trialEndsAt: null,
    paidPeriodEnd: null,
    replaced: false,
    ...overrides,
  };
}

const halted = (overrides: Partial<NoticeClock> = {}) =>
  pastDue({ state: 'halted', stateEnteredAt: FAILED + 7 * MS_PER_DAY, ...overrides });

const day = (n: number) => FAILED + n * MS_PER_DAY;

describe('nextNotice — the dunning ladder (M12-39)', () => {
  it('tells each rung of the grace on its day, once', () => {
    const told: string[] = [];
    let last: number | null = null;
    for (let hour = 0; hour < 7 * 24; hour += 1) {
      const decision = nextNotice(pastDue(), last, FAILED + hour * HOUR);
      if (decision.tell !== null) {
        told.push(`${decision.tell.notice}@${(decision.tell.dueAt - FAILED) / MS_PER_DAY}`);
        last = decision.tell.dueAt;
      }
    }
    expect(told).toEqual([
      'payment_failed@0',
      'payment_reminder@2',
      'metered_paused@4',
      'final_warning@6',
    ]);
  });

  it('tells only the latest rung when several fell due while the sweep was down', () => {
    expect(nextNotice(pastDue(), null, day(5)).tell).toEqual({
      notice: 'metered_paused',
      dueAt: day(4),
    });
    expect(nextNotice(pastDue(), day(4), day(5))).toEqual({ tell: null, lookAgainAt: day(6) });
  });

  it('waits for the timers to record the halt before telling it', () => {
    expect(nextNotice(pastDue(), day(6), day(7) + HOUR)).toEqual({
      tell: null,
      lookAgainAt: day(7),
    });
    expect(nextNotice(halted(), day(6), day(7) + HOUR).tell).toEqual({
      notice: 'halted',
      dueAt: day(7),
    });
  });

  it('wins back weekly four times after the halt, then every 30 days', () => {
    const due: number[] = [];
    let last: number | null = day(7);
    for (let at = day(7); at <= day(130); at += HOUR) {
      const decision = nextNotice(halted(), last, at);
      if (decision.tell !== null) {
        expect(decision.tell.notice).toBe('win_back');
        due.push((decision.tell.dueAt - FAILED) / MS_PER_DAY);
        last = decision.tell.dueAt;
      }
    }
    expect(due).toEqual([14, 21, 28, 35, 65, 95, 125]);
  });

  it('ends the ladder of a row a newer live subscription replaced, and of a paid one', () => {
    expect(nextNotice(halted({ replaced: true }), day(7), day(40))).toEqual({
      tell: null,
      lookAgainAt: null,
    });
    expect(nextNotice(pastDue({ state: 'active' }), null, day(3))).toEqual({
      tell: null,
      lookAgainAt: null,
    });
  });
});

describe('nextNotice — the trial nudges (M12-42)', () => {
  const ENDS = Date.UTC(2026, 3, 1, 9);
  const trial = (state: 'trialing' | 'expired', trialEndsAt = ENDS): NoticeClock => ({
    state,
    stateEnteredAt: ENDS - 14 * MS_PER_DAY,
    trialEndsAt,
    paidPeriodEnd: null,
    replaced: false,
  });

  it('counts back from the trial’s end: day 7, day 12, day 14', () => {
    expect(nextNotice(trial('trialing'), null, ENDS - 7 * MS_PER_DAY).tell?.notice).toBe(
      'trial_half_way',
    );
    expect(nextNotice(trial('trialing'), null, ENDS - 2 * MS_PER_DAY).tell?.notice).toBe(
      'trial_ending',
    );
    expect(nextNotice(trial('expired'), ENDS - 2 * MS_PER_DAY, ENDS + HOUR).tell?.notice).toBe(
      'trial_ended',
    );
    expect(nextNotice(trial('expired'), ENDS, ENDS + 30 * MS_PER_DAY)).toEqual({
      tell: null,
      lookAgainAt: null,
    });
  });

  it('moves every nudge with a support extension', () => {
    const extended = ENDS + 7 * MS_PER_DAY;
    expect(nextNotice(trial('trialing', extended), ENDS - 2 * MS_PER_DAY, ENDS - HOUR)).toEqual({
      tell: null,
      lookAgainAt: ENDS,
    });
    // Seven days are left again, so that notice is true again and is told again.
    expect(nextNotice(trial('trialing', extended), ENDS - 2 * MS_PER_DAY, ENDS).tell).toEqual({
      notice: 'trial_half_way',
      dueAt: ENDS,
    });
  });
});

describe('protectionEndsAt — the horizon in calendar months (BM-42)', () => {
  it('lands on the same day, or the shorter month’s last', () => {
    expect(protectionEndsAt(Date.UTC(2026, 0, 15, 8), 24)).toBe(Date.UTC(2028, 0, 15, 8));
    expect(protectionEndsAt(Date.UTC(2026, 0, 31), 1)).toBe(Date.UTC(2026, 1, 28));
  });
});

describe('the pack’s SMS texts (M12-40, M12-41)', () => {
  it("the day-4 pack text was written for the matrix's paused set", () => {
    expect(pauseNoticeOf('past_due_metered_paused').paused).toEqual([
      'voice_agent',
      'ai_roof_detections',
      'team_invites',
    ]);
    expect(IN_BILLING_NOTICE_TEXTS.metered_paused?.text.en).toContain(
      'voice agent, AI roof detection and team invites are paused',
    );
  });

  it('carries every notice in every language, a protected text exactly where one is owed', () => {
    for (const notice of BILLING_NOTICES) {
      const registered = IN_BILLING_NOTICE_TEXTS[notice];
      expect(registered, notice).toBeDefined();
      for (const label of [registered?.text, registered?.whileProtected ?? registered?.text]) {
        expect(Object.keys(label ?? {}).sort(), notice).toEqual(['en', 'hi', 'mr']);
      }
      expect(registered?.whileProtected !== null, notice).toBe(disclosesForfeiture(notice));
    }
  });

  it('fills the company and the link, and sends nothing a pack has not registered', () => {
    const variables = { company: 'Surya Solar', link: 'https://app.example/more/billing' };
    expect(
      billingNoticeMessage(IN_CALLING_RULES, 'halted', true, 'en', variables),
    ).toMatchInlineSnapshot(
      `"HelioGrid: Surya Solar's plan is halted because it is unpaid. Reading, exports, customer links and billing still work. Your launch price has ended; reactivating bills at today's prices. Reactivate with one payment: https://app.example/more/billing"`,
    );
    const unregistered = {
      ...IN_CALLING_RULES,
      messaging: { ...IN_CALLING_RULES.messaging, billingNotices: {} },
    };
    expect(billingNoticeMessage(unregistered, 'halted', false, 'en', variables)).toBeNull();
  });

  it('reads a stored pack that predates the texts', () => {
    const { billingNotices: _, ...older } = IN_CALLING_RULES.messaging;
    const parsed = CALLING_RULES_PACK_SCHEMA.parse({ ...IN_CALLING_RULES, messaging: older });
    expect(parsed.messaging.billingNotices).toBeUndefined();
  });
});
