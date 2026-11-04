import type { PublicPricingRead, TenantOwners, TranslatedText } from '@heliogrid/contracts';
import type { BillingCycle, PackLabel, ScaledPower, Tier, TierLimit } from '@heliogrid/domain';
import type { BillingPageStripWords, BillingViewWords } from '../BillingHome/BillingHome.words';
import type { CompareGridWords } from '../CompareGrid';
import type { DerivationKindWords } from '../Derivation/Derivation.types';
import type { MoneySummaryWords } from '../MoneySummary/MoneySummary.types';
import type { PlanCardFigure, PlanCardLine } from '../PlanCard/PlanCard.types';

export type BookPlan = PublicPricingRead['plans'][number];
export type PlanPower = ScaledPower | 'unlimited' | 'custom';

/** A plan's book values in the reader's words — `@heliogrid/i18n`'s `planWords` (`SCR-M12-01`'s too). */
export interface PlanBookWords {
  // biome-ignore lint/plugin/copy-prop-type: a book value — a figure in the market's grouping
  limit(limit: TierLimit): string;
  // biome-ignore lint/plugin/copy-prop-type: a book value — a figure in the market's grouping
  power(power: PlanPower): string;
  // biome-ignore lint/plugin/copy-prop-type: a book value — a figure in the market's grouping
  storage(limit: TierLimit): string;
  // biome-ignore lint/plugin/copy-prop-type: a book value — a figure in the market's grouping
  voiceIncluded(limit: TierLimit): string;
  voiceRate(plan: Pick<BookPlan, 'voiceMinuteRate'>): TranslatedText | null;
  // biome-ignore lint/plugin/copy-prop-type: a book value — a figure in the market's grouping
  money(value: string): string;
}

/**
 * Every word the plans screen says — `@heliogrid/i18n`'s `planSelectionWords` gives them. A
 * sentence holding a figure carries it as `FIGURE_SLOT`, so the reader's language places it and the
 * screen draws it in mono (`F7-09`).
 */
export interface PlanSelectionWords {
  readonly view: BillingViewWords;
  readonly strip: BillingPageStripWords;
  readonly moneySummary: MoneySummaryWords;
  readonly compareGrid: CompareGridWords;
  readonly compareSelect: TranslatedText;
  readonly compareSelected: TranslatedText;
  readonly compareCurrent: TranslatedText;
  readonly compareEmpty: TranslatedText;
  readonly compareError: TranslatedText;
  readonly compareUnavailable: TranslatedText;
  readonly derivationKinds: DerivationKindWords;
  readonly close: TranslatedText;
  bannerMore(hidden: number): TranslatedText;
  readonly book: PlanBookWords;
  figure(plan: Pick<BookPlan, 'price'>, cycle: BillingCycle): PlanCardFigure;
  limitsLine(plan: Pick<BookPlan, 'proposalsPerMonth'>, power: PlanPower): PlanCardLine;
  /** `1,500 / mo` in the comparison, which carries the period with the value. */
  perMonth(value: string): TranslatedText;
  readonly proposals: TranslatedText;
  readonly notPublished: TranslatedText;

  readonly yourPlan: TranslatedText;
  readonly aboutReading: TranslatedText;
  readonly readingTitle: TranslatedText;
  readonly readingBody: TranslatedText;
  readonly loadingPlan: TranslatedText;
  readonly failedPlanTitle: TranslatedText;
  readonly failedPlanMessage: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly billingCycle: TranslatedText;
  readonly monthly: TranslatedText;
  readonly yearly: TranslatedText;
  readonly choosePlan: TranslatedText;
  readonly plans: TranslatedText;
  readonly loadingPlans: TranslatedText;
  readonly failedPlansTitle: TranslatedText;
  readonly failedPlansMessage: TranslatedText;
  readonly upgrade: TranslatedText;
  readonly downgrade: TranslatedText;
  readonly annualContract: TranslatedText;
  readonly pricedWithYou: TranslatedText;
  readonly talkToSales: TranslatedText;
  readonly noPrice: TranslatedText;
  readonly reviewChange: TranslatedText;
  readonly pickReason: TranslatedText;
  readonly heldReason: TranslatedText;
  readonly compareAll: TranslatedText;
  readonly compareLineOwner: TranslatedText;
  readonly compareLineMember: TranslatedText;
  readonly compareWith: TranslatedText;
  /** A trial's two strips, the pricing page's own words: `Plan` and `Against`. */
  readonly comparePlanLabel: TranslatedText;
  readonly compareAgainstLabel: TranslatedText;
  readonly show: TranslatedText;
  readonly setLimits: TranslatedText;
  readonly setIncluded: TranslatedText;
  readonly setCharges: TranslatedText;
  readonly review: TranslatedText;
  readonly whatChanges: TranslatedText;
  readonly whatYouPayToday: TranslatedText;
  readonly whenItStarts: TranslatedText;
  readonly totalToday: TranslatedText;
  readonly partOfCycle: TranslatedText;
  readonly howWorkedOut: TranslatedText;
  readonly days: TranslatedText;
  readonly difference: TranslatedText;
  readonly rates: TranslatedText;
  /** `Trial ended`, the label of the day an expired trial ended (frame s4). */
  readonly trialEnded: TranslatedText;
  readonly tax: TranslatedText;
  readonly refund: TranslatedText;
  readonly noRefundMidCycle: TranslatedText;
  readonly planSwaps: TranslatedText;
  readonly paidCycleStarts: TranslatedText;
  readonly cycleRow: TranslatedText;
  readonly unchanged: TranslatedText;
  readonly everyLimit: TranslatedText;
  readonly perMinute: TranslatedText;
  readonly from: TranslatedText;
  readonly thisCycle: TranslatedText;
  readonly noRefund: TranslatedText;
  readonly today: TranslatedText;
  readonly nothingToPay: TranslatedText;
  readonly nothing: TranslatedText;
  readonly changedBanner: TranslatedText;
  readonly changedMark: TranslatedText;
  readonly scheduleDowngrade: TranslatedText;
  readonly lineNow: TranslatedText;
  readonly lineAtStart: TranslatedText;
  readonly failedPayment: TranslatedText;
  readonly failedPaymentLine: TranslatedText;
  readonly previewFailedMessage: TranslatedText;

  cycleWord(cycle: BillingCycle): TranslatedText;
  /** `Growth to Pro · monthly`; a trial's `Trial to Growth · monthly`. */
  changeSubtitle(from: Tier | null, to: Tier, cycle: BillingCycle): TranslatedText;
  /** `Growth · monthly to yearly`. */
  cycleSubtitle(tier: Tier, from: BillingCycle, to: BillingCycle): TranslatedText;
  pairCaption(plan: Tier, against: Tier, set: 'limits' | 'included' | 'charges'): TranslatedText;
  /** `Growth · Pro` — a trial's pair, neither plan its own (the pricing page's caption). */
  pairOnlyCaption(plan: Tier, against: Tier): TranslatedText;
  allCaption(count: number, set: 'limits' | 'included' | 'charges'): TranslatedText;
  /** `Part of this cycle · 16 of 30 days`. */
  partOfCycleDays(left: string, total: string): TranslatedText;
  /** `Growth · first month`. */
  firstCycleOf(tier: Tier, cycle: BillingCycle): TranslatedText;
  /** `GST 18%`. */
  taxLine(tax: string, rate: string): TranslatedText;
  /** `with GST`, under an amount that carries it. */
  withTax(tax: string): TranslatedText;
  daysText(left: string, total: string, date: string): TranslatedText;
  /** `₹6,000.00 a month between Growth's ₹3,999.00 and Pro's ₹9,999.00.` — three `FIGURE_SLOT`s. */
  differenceText(cycle: BillingCycle, from: Tier, to: Tier): TranslatedText;
  /** `Yearly's ₹109.56 a day against monthly's ₹133.30 a day leaves nothing to pay.` — two slots. */
  ratesText(to: BillingCycle, nothingToPay: boolean): TranslatedText;
  /** `14-day trial`. */
  trialPlan(days: number): TranslatedText;
  /** `GST 18% on the ₹3,200.00 part-cycle charge.` — the amount is a `FIGURE_SLOT`. */
  taxText(tax: string, rate: string): TranslatedText;
  fromThen(cycle: BillingCycle): TranslatedText;
  /** `Yearly starts`. */
  cycleStarts(cycle: BillingCycle): TranslatedText;
  arrow(from: string, to: string): TranslatedText;
  /** `300 → 1,500 a month`. */
  arrowMonth(from: string, to: string): TranslatedText;
  /** `₹3,999 a month → ₹39,990 a year`: two `FIGURE_SLOT`s. */
  priceChange(from: BillingCycle, to: BillingCycle): TranslatedText;
  joined(labels: readonly TranslatedText[]): TranslatedText;
  blocksTitle(tier: Tier): TranslatedText;
  overLimits(tier: Tier): TranslatedText;
  usedOf(used: string, limit: string): TranslatedText;
  workingOutBlocks(tier: Tier): TranslatedText;
  workingOutChange: TranslatedText;
  previewFailedBlocks: TranslatedText;
  previewFailedChange: TranslatedText;
  /** `Pay ₹3,200.00`. */
  pay(amount: string): TranslatedText;
  switchTo(cycle: BillingCycle): TranslatedText;
  /** `From ₹24,999 / mo`: the price is a `FIGURE_SLOT`. */
  enterpriseFrom(cycle: BillingCycle): TranslatedText;
  failure(why: string): TranslatedText;
  /** `Prices exclude GST`, once the platform is registered for the scheme (`F1-29`). */
  pricesExclude(scheme: string): TranslatedText;
  /** Whose act a plan change is, for a person who is not the Owner (`M12-56`). */
  scope(owners: TenantOwners | null): TranslatedText | null;
  /** A pack's own label in the reader's language — the market's name in the source line. */
  packText(label: PackLabel): TranslatedText;
}
