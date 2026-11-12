/**
 * A project's money on screen (`SCR-M11-01`…`04`): the payments screen, its sheets, the project's
 * Money card, Money due and the settings for how customers pay — every word both platforms say.
 * Every figure, day and pack word arrives already formatted; a sentence holds its value (`From
 * {price}`), never a word beside it.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { PaymentRefusal, TrancheState } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { PAYMENT_ACTS } from './payment-acts';
import { PROJECT_DAYS } from './projects';
import { SHELL } from './shell';

type T = Translator['t'];

export const PAYMENTS = {
  title: /*i18n*/ { id: 'Payments' },
  summary: /*i18n*/ { id: '{name} · {number} · {count, plural, one {# part} other {# parts}}' },
  toCollectNow: /*i18n*/ { id: 'To collect now' },
  dueFor: /*i18n*/ { id: 'Due {days}' },
  partOf: /*i18n*/ { id: '{part} · part {position} of {count}' },
  partOfWithIn: /*i18n*/ { id: '{part} · part {position} of {count} · {amount} already in' },
  partShare: /*i18n*/ { id: '{part} · {share}%' },
  nothingDue: /*i18n*/ { id: 'Nothing to collect now' },
  nothingDueLine: /*i18n*/ { id: 'The next part falls due at {stage}.' },
  allIn: /*i18n*/ { id: 'Every part is paid' },
  legendIn: /*i18n*/ { id: 'In {amount}' },
  legendDue: /*i18n*/ { id: 'Due {amount}' },
  legendNext: /*i18n*/ { id: 'Next {amount}' },
  moneyBar: /*i18n*/ { id: 'Received {in}, due {due}, still to come {next}' },
  collect: /*i18n*/ { id: 'Collect' },
  record: /*i18n*/ { id: 'Record' },
  parts: /*i18n*/ { id: 'Parts' },
  fromTerms: /*i18n*/ { id: 'from your payment terms' },
  dueAt: /*i18n*/ { id: 'Due when {stage} is reached' },
  dueSince: /*i18n*/ { id: 'Due since {date}' },
  left: /*i18n*/ { id: '{amount} left' },
  receivedOn: /*i18n*/ { id: 'Received {date}' },
  waivedBecause: /*i18n*/ { id: 'Waived: {reason}' },
  extra: /*i18n*/ { id: '{amount} more than this part' },
  sharedBy: /*i18n*/ { id: 'Shared by {name} · {date}' },
  received: /*i18n*/ { id: 'Received' },
  nothingReceived: /*i18n*/ { id: 'Nothing received yet' },
  entryLine: /*i18n*/ { id: '{date} · recorded by {name}' },
  entryReference: /*i18n*/ { id: '{mode} · {reference}' },
  reversal: /*i18n*/ { id: 'Reversed: {reason}' },
  reversedMark: /*i18n*/ { id: 'Reversed' },
  shareReceipt: /*i18n*/ { id: 'Share receipt' },
  reverse: /*i18n*/ { id: 'Reverse' },
  waive: /*i18n*/ { id: 'Waive' },
  shareRequest: /*i18n*/ { id: 'Share request' },
  partMenu: /*i18n*/ { id: 'More for {part}' },
  entryMenu: /*i18n*/ { id: 'More for {receipt}' },
  photo: /*i18n*/ { id: 'Receipt photo' },
  noScheduleTitle: /*i18n*/ { id: 'No payment schedule' },
  noScheduleBody: /*i18n*/ {
    id: 'This project was won before your payment terms were set. Set them in Settings → Payment terms for the next one.',
  },
  failedTitle: /*i18n*/ { id: 'Payments did not load' },
  failedMessage: /*i18n*/ { id: 'Check your connection and try again.' },
  loading: /*i18n*/ { id: 'Loading payments' },
  offline: /*i18n*/ { id: 'Needs internet — money is never saved offline.' },
  failed: /*i18n*/ { id: 'That did not save. Try again.' },
  collectTitle: /*i18n*/ { id: 'Collect {amount}' },
  collectLead: /*i18n*/ { id: '{name} · {part}' },
  upiTab: /*i18n*/ { id: 'UPI QR' },
  bankTab: /*i18n*/ { id: 'Bank transfer' },
  qrLabel: /*i18n*/ { id: 'UPI QR for {amount}' },
  noteOnPayment: /*i18n*/ { id: 'Note on the payment: {note}' },
  share: /*i18n*/ { id: 'Share' },
  copyMessage: /*i18n*/ { id: 'Copy message' },
  fullScreen: /*i18n*/ { id: 'Show full screen to the customer' },
  overLimit: /*i18n*/ {
    id: 'Above {limit}, many banks stop one UPI payment. Use bank transfer — the message carries the account and IFSC.',
  },
  noUpi: /*i18n*/ { id: 'Add your UPI ID in Settings → How customers pay you to show a QR.' },
  noBank: /*i18n*/ { id: 'Add your bank details in Settings → Business profile.' },
  accountName: /*i18n*/ { id: 'Account name' },
  accountNumber: /*i18n*/ { id: 'Account' },
  bankName: /*i18n*/ { id: 'Bank' },
  scanAny: /*i18n*/ { id: 'Scan with any UPI app · the amount is filled in' },
  paidRecord: /*i18n*/ { id: 'Paid — record it' },
  recordTitle: /*i18n*/ { id: 'Record payment' },
  amount: /*i18n*/ { id: 'Amount' },
  paidBy: /*i18n*/ { id: 'Paid by' },
  reference: /*i18n*/ { id: 'UTR or reference' },
  referenceHint: /*i18n*/ { id: 'Checked so one payment is never recorded twice' },
  receivedOnField: /*i18n*/ { id: 'Received on' },
  addPhoto: /*i18n*/ { id: 'Add photo' },
  replacePhoto: /*i18n*/ { id: 'Change photo' },
  removePhoto: /*i18n*/ { id: 'Remove photo' },
  save: /*i18n*/ { id: 'Save {amount}' },
  savedAs: /*i18n*/ {
    id: 'Saved as “recorded by {name}”. A mistake is fixed with Reverse — never deleted.',
  },
  reverseTitle: /*i18n*/ { id: 'Reverse {amount}' },
  reverseLine: /*i18n*/ {
    id: 'The payment stays on the record, with this reversal beside it. The part owes the money again.',
  },
  waiveTitle: /*i18n*/ { id: 'Waive {part}' },
  waiveLine: /*i18n*/ {
    id: '{amount} will no longer be asked for. It never counts as collected, and this cannot be undone.',
  },
  why: /*i18n*/ { id: 'Why' },
  toastRecorded: /*i18n*/ { id: 'Recorded · {receipt}' },
  toastReversed: /*i18n*/ { id: 'Payment reversed' },
  toastWaived: /*i18n*/ { id: 'Part waived' },
  toastShared: /*i18n*/ { id: 'Request shared' },
  toastCopied: /*i18n*/ { id: 'Message copied — paste it in WhatsApp or SMS' },
  toastNotCopied: /*i18n*/ { id: 'Could not copy. Select the message and copy it.' },
  money: /*i18n*/ { id: 'Money' },
  collectedOf: /*i18n*/ { id: '{collected} of {total} in' },
  duePartLine: /*i18n*/ { id: '{part} · {amount} due' },
  openPayments: /*i18n*/ { id: 'Open payments' },
  moneyDue: /*i18n*/ { id: 'Money due' },
  moneyDueSummary: /*i18n*/ {
    id: '{count, plural, =0 {Nothing waiting} one {# part needs you} other {# parts need you}}',
  },
  toCollect: /*i18n*/ { id: 'To collect' },
  collectedThisMonth: /*i18n*/ { id: 'Collected this month {amount}' },
  dueRowLine: /*i18n*/ { id: '{number} · {part}' },
  showAll: /*i18n*/ { id: 'Show all {count}' },
  moneyDueEmptyTitle: /*i18n*/ { id: 'Nothing to collect' },
  moneyDueEmptyBody: /*i18n*/ { id: 'Every part that is due is paid.' },
  moneyDueFailed: /*i18n*/ { id: 'Money due did not load' },
  openRow: /*i18n*/ { id: 'Open payments for {name}' },
  howPayTitle: /*i18n*/ { id: 'How customers pay you' },
  howPayLead: /*i18n*/ { id: 'Money goes straight to your bank. HelioGrid never holds it.' },
  upi: /*i18n*/ { id: 'UPI' },
  upiId: /*i18n*/ { id: 'UPI ID' },
  upiIdHint: /*i18n*/ { id: 'name@bank — the one your bank or UPI app shows' },
  payee: /*i18n*/ { id: 'Name shown' },
  testTitle: /*i18n*/ { id: 'Test it with {amount}' },
  testLine: /*i18n*/ { id: 'Scan from your own phone. If it shows {payee}, the ID is right.' },
  bankLine: /*i18n*/ { id: 'Sent with every request, and the only way above {limit}' },
  editBank: /*i18n*/ { id: 'Edit bank details' },
  noBankYet: /*i18n*/ { id: 'No bank details yet' },
  ways: /*i18n*/ { id: 'Ways you record' },
  waysLine: /*i18n*/ { id: 'Set by your market' },
  saveSettings: /*i18n*/ { id: 'Save' },
  malformed: /*i18n*/ { id: 'A UPI ID reads as name@bank.' },
  ownerOnly: /*i18n*/ { id: 'Only the owner changes where money goes.' },
  editUpi: /*i18n*/ { id: 'Edit UPI' },
} satisfies Record<string, MessageRef>;

/** A part's state as its mark says it: glyph, word and tint, never colour alone (`F7-12`). */
export const TRANCHE_STATE_WORDS: Record<TrancheState, MessageRef> = {
  upcoming: /*i18n*/ { id: 'Upcoming' },
  due: /*i18n*/ { id: 'Due' },
  part_received: /*i18n*/ { id: 'Part received' },
  received: /*i18n*/ { id: 'Received' },
  waived: /*i18n*/ { id: 'Waived' },
};

/** Why a money act was refused, said where the person is (`F4-16`). */
export const PAYMENT_REFUSAL_WORDS: Record<PaymentRefusal, MessageRef> = {
  amount_not_positive: /*i18n*/ {
    id: 'Enter the money that arrived. A mistake is undone with Reverse — never a minus amount.',
  },
  tranche_waived: /*i18n*/ { id: 'This part was waived, so it takes no more money.' },
  reference_used: /*i18n*/ { id: 'This UTR is already on {receipt}.' },
  mode_unknown: /*i18n*/ { id: 'Pick how it was paid.' },
  already_reversed: /*i18n*/ { id: 'This payment was already reversed.' },
  not_a_payment: /*i18n*/ { id: 'Only a payment can be reversed.' },
  tranche_received: /*i18n*/ { id: 'This part is fully paid, so there is nothing to waive.' },
  reason_needed: /*i18n*/ { id: 'Say why, so the record explains itself.' },
  date_in_future: /*i18n*/ { id: 'The money cannot arrive after today.' },
};

/** The payments screen's words (`ProjectMoneyWords`); every value it takes is already formatted. */
export function projectMoneyWords(t: T) {
  const p = PAYMENTS;
  return {
    toCollectNow: t(p.toCollectNow),
    dueFor: (days: string) => t(p.dueFor, { days }),
    partOf: (part: string, position: number, count: number) =>
      t(p.partOf, { part, position, count }),
    partOfWithIn: (part: string, position: number, count: number, amount: string) =>
      t(p.partOfWithIn, { part, position, count, amount }),
    partShare: (part: string, share: string) => t(p.partShare, { part, share }),
    nothingDue: t(p.nothingDue),
    nothingDueLine: (stage: string) => t(p.nothingDueLine, { stage }),
    allIn: t(p.allIn),
    legendIn: (amount: string) => t(p.legendIn, { amount }),
    legendDue: (amount: string) => t(p.legendDue, { amount }),
    legendNext: (amount: string) => t(p.legendNext, { amount }),
    moneyBar: (received: string, due: string, next: string) =>
      t(p.moneyBar, { in: received, due, next }),
    collect: t(p.collect),
    record: t(p.record),
    parts: t(p.parts),
    fromTerms: t(p.fromTerms),
    dueAt: (stage: string) => t(p.dueAt, { stage }),
    dueSince: (date: string) => t(p.dueSince, { date }),
    left: (amount: string) => t(p.left, { amount }),
    receivedOn: (date: string) => t(p.receivedOn, { date }),
    waivedBecause: (reason: string) => t(p.waivedBecause, { reason }),
    extra: (amount: string) => t(p.extra, { amount }),
    sharedBy: (name: string, date: string) => t(p.sharedBy, { name, date }),
    received: t(p.received),
    nothingReceived: t(p.nothingReceived),
    entryLine: (date: string, name: string) => t(p.entryLine, { date, name }),
    entryReference: (mode: string, reference: string) => t(p.entryReference, { mode, reference }),
    reversal: (reason: string) => t(p.reversal, { reason }),
    reversedMark: t(p.reversedMark),
    shareReceipt: t(p.shareReceipt),
    receiptPdf: t(PAYMENT_ACTS.receiptPdf),
    receiptPhoto: t(p.photo),
    addReceiptPhoto: t(PAYMENT_ACTS.addReceiptPhoto),
    photoAttaching: t(PAYMENT_ACTS.photoAttaching),
    reverse: t(p.reverse),
    waive: t(p.waive),
    shareRequest: t(p.shareRequest),
    partMenu: (part: string) => t(p.partMenu, { part }),
    entryMenu: (receipt: string) => t(p.entryMenu, { receipt }),
    noScheduleTitle: t(p.noScheduleTitle),
    noScheduleBody: t(p.noScheduleBody),
    failedTitle: t(p.failedTitle),
    failedMessage: t(p.failedMessage),
    loading: t(p.loading),
    retry: t(SHELL.tryAgain),
    offline: t(p.offline),
    days: (count: number) => t(PROJECT_DAYS, { count }),
    state: (state: string) =>
      state in TRANCHE_STATE_WORDS
        ? t(TRANCHE_STATE_WORDS[state as TrancheState])
        : shownAsSent(state),
  };
}

/** The project's Money card's words (`MoneyCardWords`). */
export function moneyCardWords(t: T) {
  const p = PAYMENTS;
  return {
    money: t(p.money),
    collectedOf: (collected: string, total: string) => t(p.collectedOf, { collected, total }),
    duePartLine: (part: string, amount: string) => t(p.duePartLine, { part, amount }),
    dueFor: (days: string) => t(p.dueFor, { days }),
    days: (count: number) => t(PROJECT_DAYS, { count }),
    sharedBy: (name: string, date: string) => t(p.sharedBy, { name, date }),
    nothingDue: t(p.nothingDue),
    noScheduleTitle: t(p.noScheduleTitle),
    shareRequest: t(p.shareRequest),
    openPayments: t(p.openPayments),
  };
}

/** Why the last money act did not land, in the person's words. */
export function paymentFailureWords(
  t: T,
  failure:
    | { readonly kind: 'refused'; readonly refusal: string; readonly receiptNumber: string | null }
    | { readonly kind: 'offline' }
    | { readonly kind: 'failed' },
): TranslatedText {
  if (failure.kind === 'offline') return t(PAYMENTS.offline);
  if (failure.kind === 'failed' || !(failure.refusal in PAYMENT_REFUSAL_WORDS)) {
    return t(PAYMENTS.failed);
  }
  return t(PAYMENT_REFUSAL_WORDS[failure.refusal as PaymentRefusal], {
    receipt: failure.receiptNumber ?? '',
  });
}
