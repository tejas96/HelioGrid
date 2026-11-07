import type { TranslatedText } from '@heliogrid/contracts';
import type { BillingCycle, BillingNeed, BillingState, Tier } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { BillingStripWords } from '../BillingStrip/BillingStrip.types';

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
  readonly minutes: TranslatedText;
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
  /** The page's summary on a trial — *Trial · 14 days left · ends 21 Nov 2026*. */
  summaryTrial(plan: string, left: string, days: number, date: string): TranslatedText;
  /** The page's summary on a running plan — *Growth · renews 21 Dec 2026*. */
  summaryRenews(plan: string, date: string): TranslatedText;
  daysOf(left: string, total: string): TranslatedText;
  /** The plan ring's caption and spoken name, on a trial and on a paid period. */
  readonly ringDaysLeft: TranslatedText;
  readonly ringToRenewal: TranslatedText;
  ringSpokenLeft(left: string, total: string): TranslatedText;
  ringSpokenRenewal(left: string): TranslatedText;
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

/** The strip's words, and the record chips' words the invoice rows use. */
export interface BillingPageStripWords extends BillingStripWords {
  readonly paid: TranslatedText;
  readonly failed: TranslatedText;
  readonly issued: TranslatedText;
  readonly refunded: TranslatedText;
  readonly creditNote: TranslatedText;
}

/** What every builder reads. */
export interface BillingInput {
  readonly need: BillingNeed;
  readonly words: BillingViewWords;
  readonly stripWords: BillingPageStripWords;
  readonly format: MarketFormat;
  /** The market's name in the reader's language — the price list's source line. */
  readonly marketName: string;
  /** The mandate's rail in the reader's words — the pack's label for `home.method.label`. */
  readonly methodName: TranslatedText | null;
  readonly now: number;
}
