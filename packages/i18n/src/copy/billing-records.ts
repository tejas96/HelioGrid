import type { TenantOwners, TranslatedText, UiLanguage } from '@heliogrid/contracts';
import {
  BILLING_NOTICES,
  type BillingNotice,
  type CancellationReason,
  type PackLabel,
  type SubscriptionCause,
} from '@heliogrid/domain';
import { type MessageRef, packWords, type Translator } from '../runtime';
import {
  BILLING_HOME,
  billingHomeWords,
  billingScopeWords,
  billingViewWords,
} from './billing-home';
import { billingNoticeWords } from './billing-notices';
import { billingStripWords } from './billing-strip';
import { SHELL } from './shell';

/**
 * Billing's records, its strip and its two asks (`SCR-M12-02` decisions 12–15, D9): the invoice
 * list's search and chips, each state history's reason, the reminders, the cancel sheet with its
 * reasons, the refund's one ask, and what each act says when it lands or fails. The strip's words
 * are `billing-strip.ts`'s.
 */

type T = Translator['t'];

export const BILLING_RECORDS = {
  findInList: /*i18n*/ { id: 'Find in this list' },
  invoiceState: /*i18n*/ { id: 'Invoice state' },
  all: /*i18n*/ { id: 'All' },
  paid: /*i18n*/ { id: 'Paid' },
  failed: /*i18n*/ { id: 'Failed' },
  issued: /*i18n*/ { id: 'Issued' },
  refunded: /*i18n*/ { id: 'Refunded' },
  creditNote: /*i18n*/ { id: 'Credit note' },
  noMatch: /*i18n*/ { id: 'No invoice matches {query}' },
  noMatchLine: /*i18n*/ { id: 'Try a part of the invoice number.' },
  clearSearch: /*i18n*/ { id: 'Clear search' },
  range: /*i18n*/ { id: '{from}–{to} of {total}' },
  showMore: /*i18n*/ { id: 'Show more' },
  nothingYet: /*i18n*/ { id: 'Nothing here yet' },
  paymentReceived: /*i18n*/ { id: 'Payment received' },
  next: /*i18n*/ { id: 'Next' },
  cancelTitle: /*i18n*/ { id: 'Cancel subscription' },
  cancelSubtitle: /*i18n*/ { id: 'Why are you leaving? Optional.' },
  whyLeaving: /*i18n*/ { id: 'Why are you leaving' },
  skip: /*i18n*/ { id: 'Skip' },
  kept: /*i18n*/ { id: 'Kept' },
  refundTitle: /*i18n*/ { id: 'Ask for a refund' },
  refundSubtitle: /*i18n*/ { id: 'Your plan ends today, and the payment goes back to its source.' },
  refund: /*i18n*/ { id: 'Refund' },
  today: /*i18n*/ { id: 'Today' },
  refundAct: /*i18n*/ { id: 'Refund and end my plan' },
  keepPlan: /*i18n*/ { id: 'Keep my plan' },
  cancelledToast: /*i18n*/ { id: 'Cancelled. Your plan runs until {date}.' },
  refundedToast: /*i18n*/ { id: 'Refunded. Credit note {number} is in your invoices.' },
  gatewayDown: /*i18n*/ {
    id: 'The payment service did not answer. Nothing was changed. Try again.',
  },
  notPossibleCancel: /*i18n*/ { id: 'This plan can no longer be cancelled. Reload to see why.' },
  notPossibleRefund: /*i18n*/ { id: 'The refund window has closed. Reload to see your plan.' },
  actFailed: /*i18n*/ { id: 'That did not go through. Try again.' },
  pdfFailed: /*i18n*/ { id: 'The PDF could not open. Try again.' },
} as const;

const REASON: Record<CancellationReason, MessageRef> = {
  too_expensive: /*i18n*/ { id: 'Too expensive' },
  missing_something: /*i18n*/ { id: 'Missing something I need' },
  moving_tool: /*i18n*/ { id: 'Moving to another tool' },
  business_pausing: /*i18n*/ { id: 'Business is pausing' },
  something_else: /*i18n*/ { id: 'Something else' },
};

/** Why each state was entered, as the plan history says it (§M12.2). */
const CAUSE: Record<SubscriptionCause, MessageRef> = {
  trial_started: /*i18n*/ { id: 'Signed up · 14-day trial' },
  paid: BILLING_RECORDS.paymentReceived,
  charge_failed: /*i18n*/ { id: 'A charge failed' },
  cancelled: /*i18n*/ { id: 'Cancelled by the owner' },
  trial_expired: /*i18n*/ { id: 'The trial ended' },
  grace_expired: /*i18n*/ { id: 'The grace window closed' },
  refunded: /*i18n*/ { id: 'Refunded in the first cycle' },
};

/** A cause the release does not know yet still reads as a reason, never as a code. */
const ANOTHER_CAUSE = /*i18n*/ { id: 'Changed' };

export function billingRecordWords(t: T) {
  const fixed = Object.fromEntries(
    Object.entries(BILLING_RECORDS).map(([key, message]) => [key, t(message)]),
  ) as Record<keyof typeof BILLING_RECORDS, TranslatedText>;
  return {
    ...fixed,
    reason: (reason: CancellationReason) => t(REASON[reason]),
    cause: (cause: string) => t(cause in CAUSE ? CAUSE[cause as SubscriptionCause] : ANOTHER_CAUSE),
    noMatch: (query: string) => t(BILLING_RECORDS.noMatch, { query }),
    range: (from: string, to: string, total: string) =>
      t(BILLING_RECORDS.range, { from, to, total }),
    cancelledToast: (date: string) => t(BILLING_RECORDS.cancelledToast, { date }),
    refundedToast: (number: string) => t(BILLING_RECORDS.refundedToast, { number }),
  };
}
export type BillingRecordWords = ReturnType<typeof billingRecordWords>;

/** `All invoices`' words, as `BillingInvoiceList`'s `words` takes them (decision 12). */
export function billingInvoiceListWords(t: T) {
  const records = billingRecordWords(t);
  const home = billingHomeWords(t);
  return {
    title: t(BILLING_HOME.allInvoices),
    findInList: records.findInList,
    invoiceState: records.invoiceState,
    all: records.all,
    paid: records.paid,
    failed: records.failed,
    noMatchLine: records.noMatchLine,
    clearSearch: records.clearSearch,
    showMore: records.showMore,
    loading: home.loading,
    failedTitle: home.failedTitle,
    tryAgain: home.tryAgain,
    close: t(SHELL.close),
    columns: home.invoiceColumns,
    table: home.table,
    noMatch: records.noMatch,
    range: records.range,
  };
}

/** `Payment reminders`' or `Plan history`'s words, as `BillingTimeline`'s `words` takes them. */
export function billingTimelineWords(t: T, list: 'reminders' | 'history') {
  const home = billingHomeWords(t);
  return {
    title: list === 'reminders' ? home.paymentReminders : home.planHistory,
    loading: home.loading,
    failedTitle: home.failedTitle,
    tryAgain: home.tryAgain,
    showMore: t(BILLING_RECORDS.showMore),
    nothingYet: t(BILLING_RECORDS.nothingYet),
    close: t(SHELL.close),
  };
}

/** What each reminder entry reads as: a notice by its own title, a cleared payment, the next one. */
export function billingReminderWords(t: T) {
  return {
    noticeTitle: (notice: string): TranslatedText =>
      (BILLING_NOTICES as readonly string[]).includes(notice)
        ? billingNoticeWords(t, notice as BillingNotice).title
        : t(ANOTHER_CAUSE),
    paymentReceived: t(BILLING_RECORDS.paymentReceived),
    next: t(BILLING_RECORDS.next),
  };
}

/** The cancel ask's words (decision 15), as `BillingCancelAsk`'s `words` takes them. */
export function billingCancelWords(t: T) {
  return {
    title: t(BILLING_RECORDS.cancelTitle),
    subtitle: t(BILLING_RECORDS.cancelSubtitle),
    whyLeaving: t(BILLING_RECORDS.whyLeaving),
    runsUntil: t(BILLING_HOME.runsUntil),
    yourData: t(BILLING_HOME.yourData),
    kept: t(BILLING_RECORDS.kept),
    skip: t(BILLING_RECORDS.skip),
    act: t(BILLING_HOME.cancelSubscription),
    close: t(SHELL.close),
    reason: (reason: CancellationReason) => t(REASON[reason]),
  };
}

/** The refund's one ask (D9), as `BillingRefundAsk`'s `words` takes them. */
export function billingRefundWords(t: T) {
  return {
    title: t(BILLING_RECORDS.refundTitle),
    subtitle: t(BILLING_RECORDS.refundSubtitle),
    refund: t(BILLING_RECORDS.refund),
    ends: t(BILLING_HOME.ends),
    today: t(BILLING_RECORDS.today),
    yourData: t(BILLING_HOME.yourData),
    kept: t(BILLING_RECORDS.kept),
    keep: t(BILLING_RECORDS.keepPlan),
    act: t(BILLING_RECORDS.refundAct),
    close: t(SHELL.close),
  };
}

const ACT_FAILURE: Record<string, MessageRef> = {
  gateway_down: BILLING_RECORDS.gatewayDown,
  cancel_not_possible: BILLING_RECORDS.notPossibleCancel,
  refund_not_possible: BILLING_RECORDS.notPossibleRefund,
  pdf: BILLING_RECORDS.pdfFailed,
};

/** Why a billing act did not land, said where the person acted (`F7-23` N10). */
export function billingActFailureWords(t: T, why: string): TranslatedText {
  return t(ACT_FAILURE[why] ?? BILLING_RECORDS.actFailed);
}

/** The billing page's words in the reader's language, as `BillingHome`'s `billingPageOf` takes them. */
export function billingPageWords(t: T, reader: UiLanguage) {
  return {
    home: billingHomeWords(t),
    view: billingViewWords(t),
    strip: { ...billingRecordWords(t), ...billingStripWords(t) },
    packText: (label: PackLabel) => packWords(label, reader),
    scope: (owners: TenantOwners | null) => billingScopeWords(t, owners),
    failure: (why: string) => billingActFailureWords(t, why),
  };
}

/** The record lists' and the two asks' words, as `BillingHome`'s `billingSheetsViewOf` takes them. */
export function billingSheetsWords(t: T) {
  return {
    invoiceList: billingInvoiceListWords(t),
    reminders: billingTimelineWords(t, 'reminders'),
    history: billingTimelineWords(t, 'history'),
    reminder: billingReminderWords(t),
    cause: billingRecordWords(t).cause,
    cancel: billingCancelWords(t),
    refund: billingRefundWords(t),
  };
}
