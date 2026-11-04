import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BillingCycle,
  BillingNeed,
  BillingPhase,
  BillingState,
  Tier,
} from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';

/**
 * The words the view is built from — `@heliogrid/i18n`'s `billingViewWords` and
 * `billingRecordWords` give them. A sentence holding a figure carries it as `FIGURE_SLOT`.
 */
export interface BillingViewWords {
  readonly needsYou: TranslatedText;
  readonly wayBack: TranslatedText;
  readonly needsOwner: TranslatedText;
  readonly plan: TranslatedText;
  readonly price: TranslatedText;
  readonly trial: TranslatedText;
  readonly daysLeft: TranslatedText;
  readonly ends: TranslatedText;
  readonly ended: TranslatedText;
  readonly haltedSince: TranslatedText;
  readonly runsUntil: TranslatedText;
  readonly renews: TranslatedText;
  readonly nextBill: TranslatedText;
  readonly notCapped: TranslatedText;
  readonly paymentFailed: TranslatedText;
  readonly pastDue: TranslatedText;
  readonly graceEnds: TranslatedText;
  readonly paidOnProvider: TranslatedText;
  readonly pay: TranslatedText;
  readonly renewalInvoice: TranslatedText;
  readonly due: TranslatedText;
  readonly refundAvailable: TranslatedText;
  readonly firstCycle: TranslatedText;
  readonly until: TranslatedText;
  readonly askRefund: TranslatedText;
  readonly refundLine: TranslatedText;
  readonly account: TranslatedText;
  readonly subscription: TranslatedText;
  readonly toReactivate: TranslatedText;
  readonly reactivate: TranslatedText;
  readonly reactivateLine: TranslatedText;
  readonly pickPlan: TranslatedText;
  readonly pickPlanLine: TranslatedText;
  readonly yourData: TranslatedText;
  readonly dataKept: TranslatedText;
  readonly theAmount: TranslatedText;
  readonly amount: TranslatedText;
  readonly charged: TranslatedText;
  readonly changePlan: TranslatedText;
  readonly talkToUs: TranslatedText;
  readonly namedContact: TranslatedText;
  readonly yourContract: TranslatedText;
  readonly methodLater: TranslatedText;
  readonly autoPay: TranslatedText;
  readonly paymentLink: TranslatedText;
  readonly noInvoicesYet: TranslatedText;
  readonly firstOnConvert: TranslatedText;
  readonly firstOnChoose: TranslatedText;
  readonly allInvoices: TranslatedText;
  readonly actualUsage: TranslatedText;
  readonly gb: TranslatedText;
  readonly ownerAct: TranslatedText;
  readonly limits: {
    readonly biggestDesign: TranslatedText;
    readonly proposalsMonth: TranslatedText;
    readonly activeProjects: TranslatedText;
    readonly users: TranslatedText;
    readonly voiceMinutes: TranslatedText;
    readonly storage: TranslatedText;
    readonly unlimited: TranslatedText;
  };
  stateWord(state: BillingState): TranslatedText;
  tier(tier: Tier): TranslatedText;
  forPlan(tier: Tier, cycle: BillingCycle): TranslatedText;
  daysOf(left: string, total: string): TranslatedText;
  perCycle(cycle: BillingCycle, tax: string | null): TranslatedText;
  perMinute(): TranslatedText;
  carriesOn(date: string): TranslatedText;
  allCountInvoices(count: number): TranslatedText;
  invoicePdf(number: string): TranslatedText;
  limitsFrom(source: string): TranslatedText;
  priceList(market: string, date: string): TranslatedText;
  withTax(source: string, rate: string, tax: string): TranslatedText;
  power(amount: string, unit: string): TranslatedText;
  /** `Payment link · yearly`. */
  linkCycle(cycle: BillingCycle): TranslatedText;
  /** A downgrade or cycle switch waiting for the paid period's end (frame 16). */
  readonly scheduledChange: {
    movingTo(tier: Tier): TranslatedText;
    movingToCycle(cycle: BillingCycle): TranslatedText;
    readonly scheduled: TranslatedText;
    readonly on: TranslatedText;
    keepInstead(tier: Tier): TranslatedText;
    nothingUntil(date: string): TranslatedText;
  };
}

/** The record words the view and the strip use. */
export interface BillingStripWords {
  readonly paused: TranslatedText;
  readonly stillWorks: TranslatedText;
  readonly everything: TranslatedText;
  readonly until: TranslatedText;
  readonly haltedTitle: TranslatedText;
  readonly subscriptionEnded: TranslatedText;
  readonly paid: TranslatedText;
  readonly failed: TranslatedText;
  readonly issued: TranslatedText;
  readonly refunded: TranslatedText;
  readonly creditNote: TranslatedText;
  graceDay(day: number, early: boolean): TranslatedText;
  trialEndedOn(date: string): TranslatedText;
  matrix(phase: BillingPhase): {
    readonly paused: TranslatedText;
    readonly stillWorks: TranslatedText;
  };
}

/** What every builder reads. */
export interface BillingInput {
  readonly need: BillingNeed;
  readonly words: BillingViewWords;
  readonly stripWords: BillingStripWords;
  readonly format: MarketFormat;
  /** The market's name in the reader's language — the price list's source line. */
  readonly marketName: string;
  /** The mandate's rail in the reader's words — the pack's label for `home.method.label`. */
  readonly methodName: TranslatedText | null;
  readonly now: number;
}
