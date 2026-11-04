import type { TranslatedText } from '@heliogrid/contracts';
import type { BillingCycle, Tier } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { TIER_LABEL } from './invoice-document';

/**
 * The plans screen's words (`SCR-M12-03`). Plan names are `TIER_LABEL`'s (`BM-11`); the limits'
 * labels, the cycle and the sets are the pricing page's own (`PRICING`); the plan region's pairs
 * are Billing's (`BILLING_HOME`). A figure sits in a sentence as domain's `FIGURE_SLOT`, so the
 * reader's language places it and the screen draws it in mono (`F7-09`).
 */

type T = Translator['t'];

export const PLAN_SELECTION = {
  aboutReading: /*i18n*/ { id: 'About reading and exporting' },
  readingTitle: /*i18n*/ { id: 'Reading and exporting' },
  readingBody: /*i18n*/ {
    id: 'Reading and exporting your work never stop, whatever happens to a payment.',
  },
  choosePlan: /*i18n*/ { id: 'Choose a plan' },
  loadingPlans: /*i18n*/ { id: 'Loading the plans' },
  failedPlansTitle: /*i18n*/ { id: 'Couldn’t load the plans' },
  failedPlansMessage: /*i18n*/ { id: 'The price list didn’t answer — try again.' },
  upgrade: /*i18n*/ { id: 'Upgrade' },
  downgrade: /*i18n*/ { id: 'Downgrade' },
  pricedWithYou: /*i18n*/ { id: 'Priced with you' },
  noPrice: /*i18n*/ { id: 'No price in your market' },
  reviewChange: /*i18n*/ { id: 'Review change' },
  pickReason: /*i18n*/ { id: 'Pick a plan to see what changes and what you pay.' },
  heldReason: /*i18n*/ { id: 'This is the plan you’re on. Pick another plan or cycle.' },
  compareAll: /*i18n*/ { id: 'Compare all plans' },
  compareLineOwner: /*i18n*/ { id: 'Limits, what’s included, extra charges' },
  compareLineMember: /*i18n*/ { id: 'Limits, what’s included' },
  compareWith: /*i18n*/ { id: 'Compare with' },
  pairLimits: /*i18n*/ { id: '{plan} against {against} · limits' },
  pairIncluded: /*i18n*/ { id: '{plan} against {against} · included' },
  pairCharges: /*i18n*/ { id: '{plan} against {against} · extra charges' },
  allLimits: /*i18n*/ {
    id: '{count, select, 2 {Both plans} 3 {All three plans} 4 {All four plans} other {All plans}} · limits',
  },
  allIncluded: /*i18n*/ {
    id: '{count, select, 2 {Both plans} 3 {All three plans} 4 {All four plans} other {All plans}} · included',
  },
  allCharges: /*i18n*/ {
    id: '{count, select, 2 {Both plans} 3 {All three plans} 4 {All four plans} other {All plans}} · extra charges',
  },
  review: /*i18n*/ { id: 'Review' },
  changeSubtitle: /*i18n*/ { id: '{from} to {to} · {cycle}' },
  trialSubtitle: /*i18n*/ { id: 'Trial to {to} · {cycle}' },
  cycleSubtitle: /*i18n*/ { id: '{plan} · {from} to {to}' },
  whatChanges: /*i18n*/ { id: 'What changes' },
  whatYouPayToday: /*i18n*/ { id: 'What you pay today' },
  whenItStarts: /*i18n*/ { id: 'When it starts' },
  totalToday: /*i18n*/ { id: 'Total today' },
  partOfCycle: /*i18n*/ { id: 'Part of this cycle' },
  partOfCycleDays: /*i18n*/ { id: 'Part of this cycle · {left} of {total} days' },
  firstMonth: /*i18n*/ { id: '{plan} · first month' },
  firstYear: /*i18n*/ { id: '{plan} · first year' },
  taxLine: /*i18n*/ { id: '{tax} {rate}%' },
  withTax: /*i18n*/ { id: 'with {tax}' },
  howWorkedOut: /*i18n*/ { id: 'How the part-cycle amount is worked out' },
  days: /*i18n*/ { id: 'Days' },
  daysText: /*i18n*/ { id: '{left} of this cycle’s {total} days remain on {date}.' },
  difference: /*i18n*/ { id: 'Difference' },
  differenceMonth: /*i18n*/ {
    id: '{difference} a month between {from}’s {fromPrice} and {to}’s {toPrice}.',
  },
  differenceYear: /*i18n*/ {
    id: '{difference} a year between {from}’s {fromPrice} and {to}’s {toPrice}.',
  },
  rates: /*i18n*/ { id: 'Rates' },
  yearlyAgainstMonthly: /*i18n*/ {
    id: 'Yearly’s {toRate} a day against monthly’s {fromRate} a day.',
  },
  monthlyAgainstYearly: /*i18n*/ {
    id: 'Monthly’s {toRate} a day against yearly’s {fromRate} a day.',
  },
  yearlyAgainstMonthlyNothing: /*i18n*/ {
    id: 'Yearly’s {toRate} a day against monthly’s {fromRate} a day leaves nothing to pay.',
  },
  monthlyAgainstYearlyNothing: /*i18n*/ {
    id: 'Monthly’s {toRate} a day against yearly’s {fromRate} a day leaves nothing to pay.',
  },
  trialPlan: /*i18n*/ { id: '{days}-day trial' },
  tax: /*i18n*/ { id: 'Tax' },
  taxText: /*i18n*/ { id: '{tax} {rate}% on the {amount} part-cycle charge.' },
  refund: /*i18n*/ { id: 'Refund' },
  noRefundMidCycle: /*i18n*/ { id: 'No refund is made mid-cycle.' },
  planSwaps: /*i18n*/ { id: 'Plan swaps' },
  fromThenMonth: /*i18n*/ { id: 'From then, a month' },
  fromThenYear: /*i18n*/ { id: 'From then, a year' },
  paidCycleStarts: /*i18n*/ { id: 'Paid cycle starts' },
  monthlyStarts: /*i18n*/ { id: 'Monthly starts' },
  yearlyStarts: /*i18n*/ { id: 'Yearly starts' },
  cycleRow: /*i18n*/ { id: 'Cycle' },
  arrow: /*i18n*/ { id: '{from} → {to}' },
  arrowMonth: /*i18n*/ { id: '{from} → {to} a month' },
  monthToYear: /*i18n*/ { id: '{from} a month → {to} a year' },
  yearToMonth: /*i18n*/ { id: '{from} a year → {to} a month' },
  unchanged: /*i18n*/ { id: 'Unchanged' },
  everyLimit: /*i18n*/ { id: 'Every limit' },
  perMinute: /*i18n*/ { id: 'Per minute' },
  blocksTitle: /*i18n*/ { id: 'What a downgrade to {plan} blocks' },
  overLimits: /*i18n*/ { id: 'Over {plan}’s limits' },
  nothing: /*i18n*/ { id: 'Nothing' },
  usedOf: /*i18n*/ { id: '{used} of {limit}' },
  from: /*i18n*/ { id: 'From' },
  thisCycle: /*i18n*/ { id: 'This cycle' },
  noRefund: /*i18n*/ { id: 'No refund' },
  nothingToPay: /*i18n*/ { id: 'Nothing to pay' },
  workingOutBlocks: /*i18n*/ { id: 'Working out what a downgrade to {plan} blocks' },
  workingOutChange: /*i18n*/ { id: 'Working out what this change costs' },
  previewFailedBlocks: /*i18n*/ { id: 'Couldn’t work out what a downgrade blocks' },
  previewFailedChange: /*i18n*/ { id: 'Couldn’t work out what this change costs' },
  previewFailedMessage: /*i18n*/ { id: 'Your usage didn’t load — try again.' },
  changedBanner: /*i18n*/ { id: 'Your usage changed while this was open' },
  changedMark: /*i18n*/ { id: 'changed just now' },
  pay: /*i18n*/ { id: 'Pay {amount}' },
  switchToYearly: /*i18n*/ { id: 'Switch to yearly' },
  switchToMonthly: /*i18n*/ { id: 'Switch to monthly' },
  scheduleDowngrade: /*i18n*/ { id: 'Schedule the downgrade' },
  lineNow: /*i18n*/ { id: 'Paid on your provider’s own page — new limits apply at once.' },
  lineAtStart: /*i18n*/ { id: 'Paid on your provider’s own page when it starts.' },
  failedPayment: /*i18n*/ { id: 'Your payment didn’t go through' },
  failedPaymentLine: /*i18n*/ { id: 'You can also pay with another card.' },
  notPossible: /*i18n*/ {
    id: 'Your plan can’t change while a payment is due. Pay it on Billing first.',
  },
  notSold: /*i18n*/ { id: 'This plan is sold through our team. Talk to sales.' },
  enterpriseFromMonth: /*i18n*/ { id: 'From {price} / mo' },
  enterpriseFromYear: /*i18n*/ { id: 'From {price} / yr' },
  changeThisPlan: /*i18n*/ { id: 'change this plan' },
  /** Billing's scheduled change (`SCR-M12-02` frame 16). */
  movingTo: /*i18n*/ { id: 'Moving to {plan}' },
  movingToYearly: /*i18n*/ { id: 'Moving to yearly' },
  movingToMonthly: /*i18n*/ { id: 'Moving to monthly' },
  scheduled: /*i18n*/ { id: 'Scheduled' },
  on: /*i18n*/ { id: 'On' },
  keepInstead: /*i18n*/ { id: 'Keep {plan} instead' },
  nothingUntil: /*i18n*/ { id: 'Nothing changes until {date}.' },
  /** The in-app notice the cycle's end sends when a scheduled change met changed usage (`M12-49`). */
  noticeTitle: /*i18n*/ { id: 'Your plan moved to {plan}' },
  noticeBody: /*i18n*/ {
    id: 'Your usage changed after you confirmed. Billing shows what the new plan blocks. Reading and exporting stay open.',
  },
} satisfies Record<string, MessageRef>;

/** A plan's name: the same in every language (`BM-11`). */
export function tierName(tier: Tier): TranslatedText {
  return TIER_LABEL[tier] as TranslatedText;
}

/**
 * The in-app `system` notice the cycle's end sends when a scheduled change moved the plan after
 * the usage under its preview changed (`M12-49`: the tenant is told if the picture changed).
 */
export function planChangeNoticeWords(
  t: T,
  change: { readonly tier: Tier },
): { title: TranslatedText; body: TranslatedText } {
  return {
    title: t(PLAN_SELECTION.noticeTitle, { plan: tierName(change.tier) }),
    body: t(PLAN_SELECTION.noticeBody),
  };
}

/** Billing's scheduled change (`SCR-M12-02` frame 16), as `BillingHome`'s needs builder takes it. */
export function scheduledChangeWords(t: T) {
  return {
    movingTo: (tier: Tier) => t(PLAN_SELECTION.movingTo, { plan: tierName(tier) }),
    movingToCycle: (cycle: BillingCycle) =>
      t(cycle === 'yearly' ? PLAN_SELECTION.movingToYearly : PLAN_SELECTION.movingToMonthly),
    scheduled: t(PLAN_SELECTION.scheduled),
    on: t(PLAN_SELECTION.on),
    keepInstead: (tier: Tier) => t(PLAN_SELECTION.keepInstead, { plan: tierName(tier) }),
    nothingUntil: (date: string) => t(PLAN_SELECTION.nothingUntil, { date }),
  };
}
