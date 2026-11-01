import type { TenantOwners, TranslatedText } from '@heliogrid/contracts';
import { type BillingCycle, type BillingState, FIGURE_SLOT, type Tier } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { bannerWords } from './banner';
import { DATA_TABLE, dataTableWords } from './data-table';
import { derivationWords } from './derivation';
import { TIER_LABEL } from './invoice-document';
import { PRICING } from './pricing';
import { ownersHolder } from './role-card';
import { scopeNoteWords } from './scope-note';
import { usageMeterWords } from './usage-meter';

/**
 * The billing home's words (`SCR-M12-02`). Plan names are `TIER_LABEL`'s (`BM-11`); the limits'
 * labels are the pricing page's own (`PRICING`). A figure sits in a sentence as domain's
 * `FIGURE_SLOT`, so the reader's language places it and the screen draws it in mono (`F7-09`).
 */

type T = Translator['t'];

export const BILLING_HOME = {
  needsYou: /*i18n*/ { id: 'Needs you' },
  wayBack: /*i18n*/ { id: 'The way back' },
  needsOwner: /*i18n*/ { id: 'Needs the owner' },
  yourPlan: /*i18n*/ { id: 'Your plan' },
  usageThisCycle: /*i18n*/ { id: 'Usage this cycle' },
  allUsage: /*i18n*/ { id: 'All usage' },
  paymentMethod: /*i18n*/ { id: 'Payment method' },
  method: /*i18n*/ { id: 'Method' },
  update: /*i18n*/ { id: 'Update' },
  aboutMethod: /*i18n*/ { id: 'About your payment method' },
  aboutMethodTitle: /*i18n*/ { id: 'Where your payment details live' },
  aboutMethodBody: /*i18n*/ {
    id: 'Your payment provider keeps your UPI and bank details. HelioGrid never sees or stores them.',
  },
  methodLater: /*i18n*/ { id: 'Set up when you choose a plan' },
  autoPay: /*i18n*/ { id: 'AutoPay' },
  paymentLink: /*i18n*/ { id: 'Payment link' },
  linkCycle: /*i18n*/ { id: 'Payment link · {cycle}' },
  invoices: /*i18n*/ { id: 'Invoices' },
  whatMyPlanIncludes: /*i18n*/ { id: 'What my plan includes' },
  changePlan: /*i18n*/ { id: 'Change plan' },
  talkToUs: /*i18n*/ { id: 'Talk to us' },
  namedContact: /*i18n*/ { id: 'Your named contact' },
  paymentReminders: /*i18n*/ { id: 'Payment reminders' },
  paymentRemindersLine: /*i18n*/ { id: 'Every reminder sent, and when' },
  planHistory: /*i18n*/ { id: 'Plan history' },
  planHistoryLine: /*i18n*/ { id: 'Every state, when, and why' },
  cancelSubscription: /*i18n*/ { id: 'Cancel subscription' },
  loading: /*i18n*/ { id: 'Loading your billing' },
  failedTitle: /*i18n*/ { id: 'Couldn’t load your billing' },
  failedMessage: /*i18n*/ {
    id: 'Try again. If it keeps failing, you can still pay from the link in your last reminder.',
  },
  tryAgain: /*i18n*/ { id: 'Try again' },
  theAmount: /*i18n*/ { id: 'The amount' },
  amount: /*i18n*/ { id: 'Amount' },
  charged: /*i18n*/ { id: 'Charged' },
  nextBill: /*i18n*/ { id: 'Next bill' },
  plan: /*i18n*/ { id: 'Plan' },
  price: /*i18n*/ { id: 'Price' },
  trial: /*i18n*/ { id: 'Trial' },
  daysLeft: /*i18n*/ { id: 'Days left' },
  daysOf: /*i18n*/ { id: '{left} of {total}' },
  ends: /*i18n*/ { id: 'Ends' },
  ended: /*i18n*/ { id: 'Ended' },
  haltedSince: /*i18n*/ { id: 'Halted since' },
  runsUntil: /*i18n*/ { id: 'Runs until' },
  renews: /*i18n*/ { id: 'Renews' },
  perMonth: /*i18n*/ { id: '{price} / mo' },
  perYear: /*i18n*/ { id: '{price} / yr' },
  perMonthTax: /*i18n*/ { id: '{price} / mo + {tax}' },
  perYearTax: /*i18n*/ { id: '{price} / yr + {tax}' },
  perMinute: /*i18n*/ { id: '{rate} / min' },
  notCapped: /*i18n*/ { id: 'Not capped' },
  paymentFailed: /*i18n*/ { id: 'Payment failed' },
  pastDue: /*i18n*/ { id: 'Past due' },
  graceEnds: /*i18n*/ { id: 'Grace ends' },
  paidOnProvider: /*i18n*/ { id: 'Paid on your provider’s own page.' },
  pay: /*i18n*/ { id: 'Pay' },
  renewalInvoice: /*i18n*/ { id: 'Renewal invoice' },
  due: /*i18n*/ { id: 'Due' },
  refundAvailable: /*i18n*/ { id: 'Refund available' },
  firstCycle: /*i18n*/ { id: 'First cycle' },
  until: /*i18n*/ { id: 'Until' },
  askRefund: /*i18n*/ { id: 'Ask for a refund' },
  refundLine: /*i18n*/ { id: 'The full first payment goes back to where it came from.' },
  account: /*i18n*/ { id: 'Account' },
  subscription: /*i18n*/ { id: 'Subscription' },
  toReactivate: /*i18n*/ { id: 'To reactivate' },
  reactivate: /*i18n*/ { id: 'Reactivate' },
  reactivateLine: /*i18n*/ {
    id: 'One payment. Everything returns the moment the payment confirms.',
  },
  pickPlan: /*i18n*/ { id: 'Pick a plan' },
  pickPlanLine: /*i18n*/ { id: 'Everything returns the moment the first payment confirms.' },
  carriesOn: /*i18n*/ { id: 'Your plan carries on past {date} as if nothing changed.' },
  yourData: /*i18n*/ { id: 'Your data' },
  dataKept: /*i18n*/ { id: 'Every lead, design, proposal and project — kept' },
  noInvoicesYet: /*i18n*/ { id: 'No invoices yet' },
  firstOnConvert: /*i18n*/ { id: 'The first one arrives when your trial converts to a plan.' },
  firstOnChoose: /*i18n*/ { id: 'The first one arrives when you choose a plan.' },
  allInvoices: /*i18n*/ { id: 'All invoices' },
  allCountInvoices: /*i18n*/ { id: 'All {count} invoices' },
  invoicePdf: /*i18n*/ { id: 'Invoice {number} as PDF' },
  forPlan: /*i18n*/ { id: '{plan}, {cycle}' },
  monthly: /*i18n*/ { id: 'monthly' },
  yearly: /*i18n*/ { id: 'yearly' },
  actualUsage: /*i18n*/ { id: 'Actual usage' },
  limitsFrom: /*i18n*/ { id: 'Limits and rates · {source}' },
  priceList: /*i18n*/ { id: '{market} price list · {date}' },
  withTax: /*i18n*/ { id: '{source} · {rate}% {tax}' },
  yourContract: /*i18n*/ { id: 'Your contract' },
  gb: /*i18n*/ { id: 'GB' },
  colDate: /*i18n*/ { id: 'Date' },
  colFor: /*i18n*/ { id: 'For' },
  colState: /*i18n*/ { id: 'State' },
  colPdf: /*i18n*/ { id: 'PDF' },
  ownerAct: /*i18n*/ { id: 'pay or manage billing' },
  /** The plans page's way back (`SCR-M12-03`), opened from this page. */
  backToBilling: /*i18n*/ { id: 'Back to billing' },
} as const;

/** Each state's chip word (`BM-33`); the trial's end reads as one, not as `expired`. */
export const BILLING_STATE_WORD: Record<BillingState, MessageRef> = {
  trialing: BILLING_HOME.trial,
  active: /*i18n*/ { id: 'Active' },
  past_due: BILLING_HOME.pastDue,
  halted: /*i18n*/ { id: 'Halted' },
  expired: /*i18n*/ { id: 'Trial ended' },
  cancelled: /*i18n*/ { id: 'Cancelled' },
};

/** A plan's name: the same in every language (`BM-11`). */
function tierWord(tier: Tier): TranslatedText {
  return TIER_LABEL[tier] as TranslatedText;
}

/** The invoice table's words and its blocked states' titles. */
export interface BillingTableWords extends ReturnType<typeof dataTableWords> {
  readonly emptyTitle: TranslatedText;
  readonly errorTitle: TranslatedText;
  readonly unavailableTitle: TranslatedText;
}

/** Every word `BillingHome` draws itself, as its `words` prop takes them. */
export function billingHomeWords(t: T) {
  const derivation = derivationWords(t);
  const table: BillingTableWords = {
    ...dataTableWords(t),
    emptyTitle: t(DATA_TABLE.emptyTitle),
    errorTitle: t(DATA_TABLE.errorTitle),
    unavailableTitle: t(DATA_TABLE.unavailableTitle),
  };
  return {
    yourPlan: t(BILLING_HOME.yourPlan),
    usageThisCycle: t(BILLING_HOME.usageThisCycle),
    allUsage: t(BILLING_HOME.allUsage),
    paymentMethod: t(BILLING_HOME.paymentMethod),
    method: t(BILLING_HOME.method),
    update: t(BILLING_HOME.update),
    aboutMethod: t(BILLING_HOME.aboutMethod),
    aboutMethodTitle: t(BILLING_HOME.aboutMethodTitle),
    aboutMethodBody: t(BILLING_HOME.aboutMethodBody),
    invoices: t(BILLING_HOME.invoices),
    whatMyPlanIncludes: t(BILLING_HOME.whatMyPlanIncludes),
    paymentReminders: t(BILLING_HOME.paymentReminders),
    paymentRemindersLine: t(BILLING_HOME.paymentRemindersLine),
    planHistory: t(BILLING_HOME.planHistory),
    planHistoryLine: t(BILLING_HOME.planHistoryLine),
    cancelSubscription: t(BILLING_HOME.cancelSubscription),
    loading: t(BILLING_HOME.loading),
    failedTitle: t(BILLING_HOME.failedTitle),
    failedMessage: t(BILLING_HOME.failedMessage),
    tryAgain: t(BILLING_HOME.tryAgain),
    howWorkedOut: derivation.kinds.formula,
    invoiceColumns: {
      date: t(BILLING_HOME.colDate),
      forWhat: t(BILLING_HOME.colFor),
      state: t(BILLING_HOME.colState),
      pdf: t(BILLING_HOME.colPdf),
      amount: t(BILLING_HOME.amount),
    },
    derivationKinds: derivation.kinds,
    usageMeter: usageMeterWords(t),
    table,
    bannerMore: bannerWords(t).moreLabel,
  };
}

/**
 * Whose act billing is, for a person who is not the Owner (`M12-56`): *Only Mahesh Bhosale (owner)
 * can pay or manage billing.* — `null` while the owners' names are not read.
 */
export function billingScopeWords(t: T, owners: TenantOwners | null): TranslatedText | null {
  if (owners === null) return null;
  const holder = ownersHolder(t, {
    names: owners.owners.map((owner) => owner.name),
    more: owners.more,
  });
  return holder === null ? null : scopeNoteWords(t).onlyHolder(holder, [t(BILLING_HOME.ownerAct)]);
}

/**
 * The words the view is built from: each row's label, each chip, each act and its line. A figure
 * inside a sentence is `FIGURE_SLOT`; `BillingHome`'s logic places it.
 */
export function billingViewWords(t: T) {
  const fixed = Object.fromEntries(
    Object.entries(BILLING_HOME).map(([key, message]) => [key, t(message)]),
  ) as Record<keyof typeof BILLING_HOME, TranslatedText>;
  const cycleWord = (cycle: BillingCycle) =>
    t(cycle === 'yearly' ? BILLING_HOME.yearly : BILLING_HOME.monthly);
  return {
    ...fixed,
    stateWord: (state: BillingState) => t(BILLING_STATE_WORD[state]),
    tier: tierWord,
    forPlan: (tier: Tier, cycle: BillingCycle) =>
      t(BILLING_HOME.forPlan, { plan: tierWord(tier), cycle: cycleWord(cycle) }),
    daysOf: (left: string, total: string) => t(BILLING_HOME.daysOf, { left, total }),
    /** `₹3,999 / mo` — the price is the slot. */
    perCycle: (cycle: BillingCycle, tax: string | null) =>
      tax === null
        ? t(cycle === 'yearly' ? BILLING_HOME.perYear : BILLING_HOME.perMonth, {
            price: FIGURE_SLOT,
          })
        : t(cycle === 'yearly' ? BILLING_HOME.perYearTax : BILLING_HOME.perMonthTax, {
            price: FIGURE_SLOT,
            tax,
          }),
    perMinute: () => t(BILLING_HOME.perMinute, { rate: FIGURE_SLOT }),
    carriesOn: (date: string) => t(BILLING_HOME.carriesOn, { date }),
    allCountInvoices: (count: number) => t(BILLING_HOME.allCountInvoices, { count }),
    invoicePdf: (number: string) => t(BILLING_HOME.invoicePdf, { number }),
    limitsFrom: (source: string) => t(BILLING_HOME.limitsFrom, { source }),
    priceList: (market: string, date: string) => t(BILLING_HOME.priceList, { market, date }),
    withTax: (source: string, rate: string, tax: string) =>
      t(BILLING_HOME.withTax, { source, rate, tax }),
    power: (amount: string, unit: string) => t(PRICING.power, { amount, unit }),
    linkCycle: (cycle: BillingCycle) => t(BILLING_HOME.linkCycle, { cycle: cycleWord(cycle) }),
    limits: {
      biggestDesign: t(PRICING.biggestDesign),
      proposalsMonth: t(PRICING.proposalsMonth),
      activeProjects: t(PRICING.activeProjects),
      users: t(PRICING.users),
      voiceMinutes: t(PRICING.voiceMinutes),
      storage: t(PRICING.storage),
      unlimited: t(PRICING.unlimited),
    },
  };
}
export type BillingViewWords = ReturnType<typeof billingViewWords>;
