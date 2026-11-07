import type { TenantOwners, TranslatedText, UiLanguage } from '@heliogrid/contracts';
import { type BillingCycle, FIGURE_SLOT, type PackLabel, type Tier } from '@heliogrid/domain';
import { packWords, type Translator } from '../runtime';
import { bannerWords } from './banner';
import { BILLING_HOME, BILLING_STATE_WORD, billingViewWords } from './billing-home';
import { BILLING_RECORDS, billingActFailureWords, billingRecordWords } from './billing-records';
import { billingStripWords } from './billing-strip';
import { COMPARE_GRID, compareGridWords } from './compare-grid';
import { derivationWords } from './derivation';
import { moneySummaryWords } from './money-summary';
import { PLAN_SELECTION as P, tierName } from './plan-selection';
import { type PlanFormat, planFigure, planLimitsLine, planWords } from './plan-words';
import { PRICING } from './pricing';
import { ownersHolder } from './role-card';
import { scopeNoteWords } from './scope-note';
import { SHELL } from './shell';

type T = Translator['t'];
type PlanSet = 'limits' | 'included' | 'charges';

const PAIR: Record<PlanSet, typeof P.pairLimits> = {
  limits: P.pairLimits,
  included: P.pairIncluded,
  charges: P.pairCharges,
};
/** A cycle switch's two day rates, always the cycle switched to first. */
const RATES = {
  yearly: { plain: P.yearlyAgainstMonthly, nothing: P.yearlyAgainstMonthlyNothing },
  monthly: { plain: P.monthlyAgainstYearly, nothing: P.monthlyAgainstYearlyNothing },
} as const;
const ALL: Record<PlanSet, typeof P.allLimits> = {
  limits: P.allLimits,
  included: P.allIncluded,
  charges: P.allCharges,
};

/** Why the plans' act did not land (`@heliogrid/data`'s `PlanActFailure`). */
function failureWords(t: T, why: string): TranslatedText {
  if (why === 'not_possible') return t(P.notPossible);
  if (why === 'not_sold') return t(P.notSold);
  return billingActFailureWords(t, why);
}

/**
 * Every word the plans screen says, as `@heliogrid/ui`'s `PlanSelectionWords` takes them. The
 * market format places the book's figures (`planWords`), the same as the pricing page's.
 */
export function planSelectionWords(t: T, reader: UiLanguage, format: PlanFormat) {
  const book = planWords(t, format);
  const cycleWord = (cycle: BillingCycle) =>
    t(cycle === 'yearly' ? BILLING_HOME.yearly : BILLING_HOME.monthly);
  const fixed = {
    yourPlan: t(BILLING_HOME.yourPlan),
    aboutReading: t(P.aboutReading),
    readingTitle: t(P.readingTitle),
    readingBody: t(P.readingBody),
    loadingPlan: t(BILLING_HOME.loading),
    failedPlanTitle: t(BILLING_HOME.failedTitle),
    failedPlanMessage: t(BILLING_HOME.failedMessage),
    tryAgain: t(BILLING_HOME.tryAgain),
    billingCycle: t(PRICING.cycle),
    monthly: t(PRICING.monthly),
    yearly: t(PRICING.yearly),
    choosePlan: t(P.choosePlan),
    plans: t(PRICING.plans),
    loadingPlans: t(P.loadingPlans),
    failedPlansTitle: t(P.failedPlansTitle),
    failedPlansMessage: t(P.failedPlansMessage),
    upgrade: t(P.upgrade),
    downgrade: t(P.downgrade),
    annualContract: t(PRICING.annual),
    pricedWithYou: t(P.pricedWithYou),
    talkToSales: t(PRICING.talkToSales),
    noPrice: t(P.noPrice),
    reviewChange: t(P.reviewChange),
    pickReason: t(P.pickReason),
    heldReason: t(P.heldReason),
    compareAll: t(P.compareAll),
    compareLineOwner: t(P.compareLineOwner),
    compareLineMember: t(P.compareLineMember),
    compareWith: t(P.compareWith),
    comparePlanLabel: t(PRICING.plan),
    compareAgainstLabel: t(PRICING.against),
    show: t(PRICING.show),
    setLimits: t(PRICING.setLimits),
    setIncluded: t(PRICING.setIncluded),
    setCharges: t(PRICING.setCharges),
    review: t(P.review),
    whatChanges: t(P.whatChanges),
    whatYouPayToday: t(P.whatYouPayToday),
    whenItStarts: t(P.whenItStarts),
    totalToday: t(P.totalToday),
    partOfCycle: t(P.partOfCycle),
    howWorkedOut: t(P.howWorkedOut),
    days: t(P.days),
    difference: t(P.difference),
    rates: t(P.rates),
    trialEnded: t(BILLING_STATE_WORD.expired),
    tax: t(P.tax),
    refund: t(P.refund),
    noRefundMidCycle: t(P.noRefundMidCycle),
    planSwaps: t(P.planSwaps),
    paidCycleStarts: t(P.paidCycleStarts),
    cycleRow: t(P.cycleRow),
    unchanged: t(P.unchanged),
    everyLimit: t(P.everyLimit),
    perMinute: t(P.perMinute),
    from: t(P.from),
    thisCycle: t(P.thisCycle),
    noRefund: t(P.noRefund),
    today: t(BILLING_RECORDS.today),
    nothingToPay: t(P.nothingToPay),
    nothing: t(P.nothing),
    changedBanner: t(P.changedBanner),
    changedMark: t(P.changedMark),
    scheduleDowngrade: t(P.scheduleDowngrade),
    lineNow: t(P.lineNow),
    lineAtStart: t(P.lineAtStart),
    failedPayment: t(P.failedPayment),
    failedPaymentLine: t(P.failedPaymentLine),
    previewFailedMessage: t(P.previewFailedMessage),
    workingOutChange: t(P.workingOutChange),
    previewFailedBlocks: t(P.previewFailedBlocks),
    previewFailedChange: t(P.previewFailedChange),
    proposals: t(PRICING.proposals),
    notPublished: t(PRICING.notPublished),
    close: t(SHELL.close),
    compareSelect: t(COMPARE_GRID.select),
    compareSelected: t(COMPARE_GRID.selected),
    compareCurrent: t(BILLING_HOME.yourPlan),
    compareEmpty: t(COMPARE_GRID.emptyTitle),
    compareError: t(COMPARE_GRID.errorTitle),
    compareUnavailable: t(COMPARE_GRID.unavailableTitle),
  };
  return {
    ...fixed,
    view: billingViewWords(t),
    strip: { ...billingRecordWords(t), ...billingStripWords(t) },
    moneySummary: moneySummaryWords(t),
    compareGrid: compareGridWords(t),
    derivationKinds: derivationWords(t).kinds,
    bannerMore: bannerWords(t).moreLabel,
    book,
    figure: (plan: Parameters<typeof planFigure>[0], cycle: BillingCycle) =>
      planFigure(plan, cycle, t, book),
    limitsLine: (
      plan: Parameters<typeof planLimitsLine>[0],
      power: Parameters<typeof planLimitsLine>[1],
    ) => planLimitsLine(plan, power, t, book),
    perMonth: (value: string) => t(PRICING.perMonth, { value }),
    cycleWord,
    changeSubtitle: (from: Tier | null, to: Tier, cycle: BillingCycle) =>
      from === null
        ? t(P.trialSubtitle, { to: tierName(to), cycle: cycleWord(cycle) })
        : t(P.changeSubtitle, { from: tierName(from), to: tierName(to), cycle: cycleWord(cycle) }),
    cycleSubtitle: (tier: Tier, from: BillingCycle, to: BillingCycle) =>
      t(P.cycleSubtitle, { plan: tierName(tier), from: cycleWord(from), to: cycleWord(to) }),
    pairCaption: (plan: Tier, against: Tier, set: PlanSet) =>
      t(PAIR[set], { plan: tierName(plan), against: tierName(against) }),
    pairOnlyCaption: (plan: Tier, against: Tier) =>
      t(PRICING.pairCaption, { plan: tierName(plan), against: tierName(against) }),
    allCaption: (count: number, set: PlanSet) => t(ALL[set], { count }),
    partOfCycleDays: (left: string, total: string) => t(P.partOfCycleDays, { left, total }),
    firstCycleOf: (tier: Tier, cycle: BillingCycle) =>
      t(cycle === 'yearly' ? P.firstYear : P.firstMonth, { plan: tierName(tier) }),
    taxLine: (tax: string, rate: string) => t(P.taxLine, { tax, rate }),
    withTax: (tax: string) => t(P.withTax, { tax }),
    daysText: (left: string, total: string, date: string) => t(P.daysText, { left, total, date }),
    differenceText: (cycle: BillingCycle, from: Tier, to: Tier) =>
      t(cycle === 'yearly' ? P.differenceYear : P.differenceMonth, {
        difference: FIGURE_SLOT,
        from: tierName(from),
        fromPrice: FIGURE_SLOT,
        to: tierName(to),
        toPrice: FIGURE_SLOT,
      }),
    ratesText: (to: BillingCycle, nothingToPay: boolean) =>
      t(RATES[to][nothingToPay ? 'nothing' : 'plain'], {
        toRate: FIGURE_SLOT,
        fromRate: FIGURE_SLOT,
      }),
    trialPlan: (days: number) => t(P.trialPlan, { days }),
    taxText: (tax: string, rate: string) => t(P.taxText, { tax, rate, amount: FIGURE_SLOT }),
    fromThen: (cycle: BillingCycle) => t(cycle === 'yearly' ? P.fromThenYear : P.fromThenMonth),
    cycleStarts: (cycle: BillingCycle) => t(cycle === 'yearly' ? P.yearlyStarts : P.monthlyStarts),
    arrow: (from: string, to: string) => t(P.arrow, { from, to }),
    arrowMonth: (from: string, to: string) => t(P.arrowMonth, { from, to }),
    priceChange: (from: BillingCycle, to: BillingCycle) =>
      t(from === 'monthly' && to === 'yearly' ? P.monthToYear : P.yearToMonth, {
        from: FIGURE_SLOT,
        to: FIGURE_SLOT,
      }),
    joined: (labels: readonly TranslatedText[]) => labels.join(' · ') as TranslatedText,
    blocksTitle: (tier: Tier) => t(P.blocksTitle, { plan: tierName(tier) }),
    overLimits: (tier: Tier) => t(P.overLimits, { plan: tierName(tier) }),
    usedOf: (used: string, limit: string) => t(P.usedOf, { used, limit }),
    workingOutBlocks: (tier: Tier) => t(P.workingOutBlocks, { plan: tierName(tier) }),
    pay: (amount: string) => t(P.pay, { amount }),
    switchTo: (cycle: BillingCycle) => t(cycle === 'yearly' ? P.switchToYearly : P.switchToMonthly),
    enterpriseFrom: (cycle: BillingCycle) =>
      t(cycle === 'yearly' ? P.enterpriseFromYear : P.enterpriseFromMonth, { price: FIGURE_SLOT }),
    failure: (why: string) => failureWords(t, why),
    pricesExclude: (scheme: string) => t(PRICING.pricesExclude, { scheme }),
    scope: (owners: TenantOwners | null) => planSelectionScope(t, owners),
    packText: (label: PackLabel) => packWords(label, reader),
  };
}

/**
 * Whose act a plan change is, for a person who is not the Owner (`M12-56`): *Only Mahesh Bhosale
 * (owner) can change this plan.* — `null` while the owners' names are not read.
 */
export function planSelectionScope(t: T, owners: TenantOwners | null): TranslatedText | null {
  if (owners === null) return null;
  const holder = ownersHolder(t, {
    names: owners.owners.map((owner) => owner.name),
    more: owners.more,
  });
  return holder === null ? null : scopeNoteWords(t).onlyHolder(holder, [t(P.changeThisPlan)]);
}
