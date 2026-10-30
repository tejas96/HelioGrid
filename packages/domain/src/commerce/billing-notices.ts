import { MS_PER_DAY } from '../format/zone';
import { PAST_DUE_GRACE_DAYS, type SubscriptionClock } from './lifecycle';
import type { BillingState } from './states';

/**
 * The billing notices (`M12-39`, `M12-42`) — the dunning ladder from a first failed charge, and
 * the trial nudges that reuse it. One notice per fact; each is told only while its state is true
 * (`M12-39`'s behaviour detail: the ladder is state-driven, not schedule-driven).
 */
export const BILLING_NOTICES = [
  'payment_failed',
  'payment_reminder',
  'metered_paused',
  'final_warning',
  'halted',
  'win_back',
  'trial_half_way',
  'trial_ending',
  'trial_ended',
] as const;

export type BillingNotice = (typeof BILLING_NOTICES)[number];

/** The two ladders: one from a failed charge, one from a trial's end. */
export type NoticeLadder = 'dunning' | 'trial';

interface NoticeRule {
  readonly ladder: NoticeLadder;
  /** The state the subscription must hold for the notice to be true when it is told. */
  readonly holdsIn: BillingState;
  /**
   * Whether a company inside its price-protection horizon is told, in this notice, that a halt
   * ends its launch price (`M12-39`, `M12-41`, `BM-42`). The win-back says reactivation bills at
   * today's prices, which is true for every company, so it needs no second text.
   */
  readonly disclosesForfeiture: boolean;
}

/** An exhaustive `Record`, so a tenth notice names its ladder, its state and its disclosure. */
const RULES: Record<BillingNotice, NoticeRule> = {
  payment_failed: { ladder: 'dunning', holdsIn: 'past_due', disclosesForfeiture: true },
  payment_reminder: { ladder: 'dunning', holdsIn: 'past_due', disclosesForfeiture: true },
  metered_paused: { ladder: 'dunning', holdsIn: 'past_due', disclosesForfeiture: true },
  final_warning: { ladder: 'dunning', holdsIn: 'past_due', disclosesForfeiture: true },
  halted: { ladder: 'dunning', holdsIn: 'halted', disclosesForfeiture: true },
  win_back: { ladder: 'dunning', holdsIn: 'halted', disclosesForfeiture: false },
  trial_half_way: { ladder: 'trial', holdsIn: 'trialing', disclosesForfeiture: false },
  trial_ending: { ladder: 'trial', holdsIn: 'trialing', disclosesForfeiture: false },
  trial_ended: { ladder: 'trial', holdsIn: 'expired', disclosesForfeiture: false },
};

export function ladderOf(notice: BillingNotice): NoticeLadder {
  return RULES[notice].ladder;
}

export function disclosesForfeiture(notice: BillingNotice): boolean {
  return RULES[notice].disclosesForfeiture;
}

/** `M12-39` — the ladder's fixed rungs, in whole days from the first failed charge. */
const DUNNING_RUNGS: readonly { readonly notice: BillingNotice; readonly day: number }[] = [
  { notice: 'payment_failed', day: 0 },
  { notice: 'payment_reminder', day: 2 },
  { notice: 'metered_paused', day: 4 },
  { notice: 'final_warning', day: 6 },
  { notice: 'halted', day: PAST_DUE_GRACE_DAYS },
];

/** `M12-39` — after the halt, weekly four times. */
const WEEKLY_WIN_BACKS = 4;

/** `M12-39` — then "monthly, indefinitely": a fixed product timer of 30 days (`M12-43`). */
const MONTHLY_WIN_BACK_DAYS = 30;

/** `M12-42` — the first trial nudge comes this many days before the trial ends: day 7 of 14. */
export const TRIAL_NUDGE_LEAD_DAYS = 7;

/** `M12-42` — the trial nudges, in whole days before the trial's end: day 7, day 12, day 14. */
const TRIAL_RUNGS: readonly { readonly notice: BillingNotice; readonly daysBeforeEnd: number }[] = [
  { notice: 'trial_half_way', daysBeforeEnd: TRIAL_NUDGE_LEAD_DAYS },
  { notice: 'trial_ending', daysBeforeEnd: 2 },
  { notice: 'trial_ended', daysBeforeEnd: 0 },
];

/** What the notice sweep knows about one subscription. */
export interface NoticeClock extends SubscriptionClock {
  /** The company holds a newer live subscription: this row's ladder has ended (`M12-08`). */
  readonly replaced: boolean;
}

/** One notice of a ladder, and the moment it falls due. */
export interface ScheduledNotice {
  readonly notice: BillingNotice;
  readonly dueAt: number;
}

/** The ladder a subscription is on, and where it starts; `null` when it is on none. */
export interface LadderStart {
  readonly ladder: NoticeLadder;
  readonly startedAt: number;
}

/**
 * Days are whole 24 hours from the ladder's start (`lifecycle.ts`): a failed charge's ladder
 * starts when the row entered `past_due`, and the halt is recorded exactly the grace later. A
 * trial's counts back from its end, so a support extension moves every nudge with it.
 */
export function ladderStartOf(clock: NoticeClock): LadderStart | null {
  switch (clock.state) {
    case 'past_due':
      return { ladder: 'dunning', startedAt: clock.stateEnteredAt };
    case 'halted':
      return clock.replaced
        ? null
        : { ladder: 'dunning', startedAt: clock.stateEnteredAt - PAST_DUE_GRACE_DAYS * MS_PER_DAY };
    case 'trialing':
    case 'expired':
      return clock.trialEndsAt === null ? null : { ladder: 'trial', startedAt: clock.trialEndsAt };
    default:
      return null;
  }
}

/** The notice at a position on its ladder; `null` past a trial's last. The dunning ladder never ends. */
function noticeAt(start: LadderStart, position: number): ScheduledNotice | null {
  if (start.ladder === 'trial') {
    const rung = TRIAL_RUNGS[position];
    return rung === undefined
      ? null
      : { notice: rung.notice, dueAt: start.startedAt - rung.daysBeforeEnd * MS_PER_DAY };
  }
  const fixed = DUNNING_RUNGS[position];
  if (fixed !== undefined) {
    return { notice: fixed.notice, dueAt: start.startedAt + fixed.day * MS_PER_DAY };
  }
  const afterHalt = position - DUNNING_RUNGS.length + 1;
  const days =
    afterHalt <= WEEKLY_WIN_BACKS
      ? PAST_DUE_GRACE_DAYS + 7 * afterHalt
      : PAST_DUE_GRACE_DAYS +
        7 * WEEKLY_WIN_BACKS +
        MONTHLY_WIN_BACK_DAYS * (afterHalt - WEEKLY_WIN_BACKS);
  return { notice: 'win_back', dueAt: start.startedAt + days * MS_PER_DAY };
}

/**
 * The ladder's first moment: a notice due before it belongs to an earlier ladder of the same row —
 * a failure paid off, then another — and never stands for one told on this ladder.
 */
export function ladderBeginsAt(start: LadderStart): number {
  // Position 0 exists on both ladders, so the fallback is never taken.
  return noticeAt(start, 0)?.dueAt ?? start.startedAt;
}

/** The last notice of the ladder due at or before `now`, and the one after it. */
function latestDue(
  start: LadderStart,
  now: number,
): { latest: ScheduledNotice | null; after: ScheduledNotice | null } {
  let latest: ScheduledNotice | null = null;
  for (let position = 0; ; position += 1) {
    const scheduled = noticeAt(start, position);
    if (scheduled === null || scheduled.dueAt > now) return { latest, after: scheduled };
    latest = scheduled;
  }
}

/** What the sweep does for one subscription at `now`. */
export interface NoticeDecision {
  /** The notice to tell now, or `null`. */
  readonly tell: ScheduledNotice | null;
  /**
   * When to look at this subscription again: the next notice's due moment, a moment already past
   * when the notice is due but its state is not yet recorded, or `null` when its ladder has ended.
   */
  readonly lookAgainAt: number | null;
}

/**
 * Only the LATEST notice due is ever told: when the sweep was down and several fell due, an older
 * one would no longer be true. It is told once — never when a notice at or after its moment was
 * already told on this ladder — and only while its state holds; a due notice whose state the
 * timers have not yet recorded waits for them.
 */
export function nextNotice(
  clock: NoticeClock,
  lastToldDueAt: number | null,
  now: number,
): NoticeDecision {
  const start = ladderStartOf(clock);
  if (start === null) return { tell: null, lookAgainAt: null };
  const { latest, after } = latestDue(start, now);
  const lookAfter = after?.dueAt ?? null;
  if (latest === null) return { tell: null, lookAgainAt: lookAfter };
  if (lastToldDueAt !== null && latest.dueAt <= lastToldDueAt) {
    return { tell: null, lookAgainAt: lookAfter };
  }
  if (RULES[latest.notice].holdsIn !== clock.state) {
    return { tell: null, lookAgainAt: latest.dueAt };
  }
  return { tell: latest, lookAgainAt: lookAfter };
}
