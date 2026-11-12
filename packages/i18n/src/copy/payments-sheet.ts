/**
 * The money sheets' words (`MoneySheetWords`, `SCR-M11-02`, `SCR-M11-03`): collect a part, record
 * money that arrived, and say why for a reversal or a waiver. The market's words — a payment
 * mode, its bank routing label — arrive from the pack; every figure arrives formatted.
 */

import type { TranslatedText } from '@heliogrid/contracts';
import { type FormatPack, type UiLanguage, UNDO_TOAST_MS } from '@heliogrid/domain';
import { type MessageRef, projectPackWords, type Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { datePickerWords } from './date-picker';
import { numberFieldWords } from './number-field';
import { PAYMENT_ACTS } from './payment-acts';
import { PAYMENT_REFUSAL_WORDS, PAYMENTS } from './payments-screen';
import { qrCodeWords } from './qr-code';
import { SHELL } from './shell';

type T = Translator['t'];

const SHEET = {
  amountHint: /*i18n*/ { id: 'Starts as what is left on this part' },
  recordLead: /*i18n*/ { id: '{part} · {amount} left' },
  settingsFailed: /*i18n*/ { id: 'Payment settings did not load' },
  settingsLoading: /*i18n*/ { id: 'Loading payment settings' },
  recorded: /*i18n*/ { id: 'Payment recorded' },
  discard: /*i18n*/ { id: 'Discard changes' },
  receiptFailed: /*i18n*/ { id: 'The receipt did not load. Try again.' },
  photoFailed: /*i18n*/ { id: 'The photo did not open. Try again.' },
  summaryNoName: /*i18n*/ { id: '{number} · {count, plural, one {# part} other {# parts}}' },
} satisfies Record<string, MessageRef>;

/** The market a sheet speaks for: its pack, read in the person's language. */
interface MarketOf {
  readonly pack: FormatPack;
  readonly language: UiLanguage;
}

/** The pack's words a money sheet shows: the bank routing code's name and each payment mode's. */
function marketWordsOf({ pack, language }: MarketOf) {
  const word = projectPackWords(pack, language);
  return {
    routing: shownAsSent(pack.bankRoutingLabel),
    mode: (mode: string) => word('mode', mode),
  };
}

/** How the pay message leaves: the phone's own share sheet, or the web's copy (no product send). */
export type PaySendWay = 'share' | 'copy';

export function moneySheetWords(t: T, market: MarketOf, way: PaySendWay) {
  const p = PAYMENTS;
  const { routing, mode } = marketWordsOf(market);
  const qr = qrCodeWords(t, 'upi');
  return {
    close: t(SHELL.close),
    collectTitle: (amount: string) => t(p.collectTitle, { amount }),
    collectLead: (name: string, part: string) => t(p.collectLead, { name, part }),
    upiTab: t(p.upiTab),
    bankTab: t(p.bankTab),
    qrLabel: (amount: string) => t(p.qrLabel, { amount }),
    qrFailedTitle: qr.errorTitle,
    qrFailedMessage: qr.errorMessage,
    noteOnPayment: (note: string) => t(p.noteOnPayment, { note }),
    send: way === 'share' ? t(p.share) : t(p.copyMessage),
    sendChat: t(PAYMENT_ACTS.sendChat),
    fullScreen: t(p.fullScreen),
    scanAny: t(p.scanAny),
    overLimit: (limit: string) => t(p.overLimit, { limit }),
    noUpi: t(p.noUpi),
    noBank: t(p.noBank),
    accountName: t(p.accountName),
    accountNumber: t(p.accountNumber),
    bankName: t(p.bankName),
    routing,
    paidRecord: t(p.paidRecord),
    recordTitle: t(p.recordTitle),
    recordLead: (part: string, left: string) => t(SHEET.recordLead, { part, amount: left }),
    amount: t(p.amount),
    amountHint: t(SHEET.amountHint),
    amountMatches: t(PAYMENT_ACTS.amountMatches),
    amountLess: t(PAYMENT_ACTS.amountLess),
    amountMore: t(PAYMENT_ACTS.amountMore),
    paidBy: t(p.paidBy),
    mode,
    reference: t(p.reference),
    referenceHint: t(p.referenceHint),
    referenceNew: t(PAYMENT_ACTS.referenceNew),
    referenceUsed: (receipt: string) => t(PAYMENT_REFUSAL_WORDS.reference_used, { receipt }),
    receivedOn: t(p.receivedOnField),
    photo: t(p.photo),
    addPhoto: t(p.addPhoto),
    replacePhoto: t(p.replacePhoto),
    removePhoto: t(p.removePhoto),
    save: (amount: string) => t(p.save, { amount }),
    savedAs: (name: string) => t(p.savedAs, { name }),
    reverseTitle: (amount: string) => t(p.reverseTitle, { amount }),
    reverseLine: t(p.reverseLine),
    waiveTitle: (part: string) => t(p.waiveTitle, { part }),
    waiveLine: (amount: string) => t(p.waiveLine, { amount }),
    why: t(p.why),
    reverse: t(p.reverse),
    waive: t(p.waive),
    number: numberFieldWords(t),
    calendar: datePickerWords(t),
  };
}

/**
 * How customers pay you (`CollectionsSettingsWords`, `SCR-M11-04`). `oneUnit` is one of the
 * currency's main unit, formatted — what the test request asks for.
 */
export function collectionsSettingsWords(
  t: T,
  market: MarketOf,
  money: { readonly oneUnit: string },
) {
  const p = PAYMENTS;
  const { routing, mode } = marketWordsOf(market);
  const qr = qrCodeWords(t, 'upi');
  const oneUnit = money.oneUnit;
  return {
    title: t(p.howPayTitle),
    lead: t(p.howPayLead),
    upi: t(p.upi),
    upiId: t(p.upiId),
    upiIdHint: t(p.upiIdHint),
    payee: t(p.payee),
    testTitle: t(p.testTitle, { amount: oneUnit }),
    testLine: (payee: string) => t(p.testLine, { payee }),
    qrLabel: t(p.qrLabel, { amount: oneUnit }),
    qrFailedTitle: qr.errorTitle,
    qrFailedMessage: qr.errorMessage,
    bank: t(p.bankTab),
    bankLine: (limit: string) => t(p.bankLine, { limit }),
    noBankYet: t(p.noBankYet),
    editBank: t(p.editBank),
    accountName: t(p.accountName),
    accountNumber: t(p.accountNumber),
    bankName: t(p.bankName),
    routing,
    ways: t(p.ways),
    waysLine: t(p.waysLine),
    mode,
    save: t(p.saveSettings),
    discard: t(SHEET.discard),
    malformed: t(p.malformed),
    failed: t(p.failed),
    ownerOnly: t(p.ownerOnly),
    loading: t(SHEET.settingsLoading),
    failedTitle: t(SHEET.settingsFailed),
    failedMessage: t(p.failedMessage),
    retry: t(SHELL.tryAgain),
  };
}

/** What the payments page's toast reports, as the screen holds it. */
export type PaymentToastFact =
  | { readonly kind: 'recorded'; readonly receiptNumber: string | null }
  | { readonly kind: 'askSent'; readonly partId: string }
  | {
      readonly kind:
        | 'reversed'
        | 'waived'
        | 'shared'
        | 'copied'
        | 'notCopied'
        | 'receiptFailed'
        | 'photoFailed'
        | 'photoNotStored'
        | 'photoAdded'
        | 'receiptPreparing';
    };

/** A toast that says something did not happen, or is not done yet: a warning, never a success. */
export function failedPaymentToast(toast: PaymentToastFact): boolean {
  return [
    'notCopied',
    'receiptFailed',
    'photoFailed',
    'photoNotStored',
    'receiptPreparing',
    'askSent',
  ].includes(toast.kind);
}

/**
 * The payments page's own words: its title, the line under it, and each act's toast with its one
 * act. A request left for another app is recorded as shared only on the person's *Yes, sent*, so
 * its toast says shared on both platforms.
 */
export function paymentsPageWords(t: T) {
  const p = PAYMENTS;
  const toastOf = (toast: PaymentToastFact): TranslatedText => {
    switch (toast.kind) {
      case 'recorded':
        return toast.receiptNumber === null
          ? t(SHEET.recorded)
          : t(p.toastRecorded, { receipt: toast.receiptNumber });
      case 'reversed':
        return t(p.toastReversed);
      case 'waived':
        return t(p.toastWaived);
      case 'shared':
        return t(p.toastShared);
      case 'copied':
        return t(p.toastCopied);
      case 'notCopied':
        return t(p.toastNotCopied);
      case 'receiptFailed':
        return t(SHEET.receiptFailed);
      case 'photoFailed':
        return t(SHEET.photoFailed);
      case 'photoNotStored':
        return t(PAYMENT_ACTS.photoNotStored);
      case 'photoAdded':
        return t(PAYMENT_ACTS.photoAdded);
      case 'receiptPreparing':
        return t(PAYMENT_ACTS.receiptPreparing);
      case 'askSent':
        return t(PAYMENT_ACTS.askSent);
    }
  };
  return {
    title: t(p.title),
    /** The customer, the number and the parts; a project with no name says its number once. */
    summary: (name: string | null, number: string, count: number) =>
      name === null
        ? t(SHEET.summaryNoName, { number, count })
        : t(p.summary, { name, number, count }),
    toast: toastOf,
    /**
     * The toast's line: a warning where something did not happen, and its one act — *Yes, sent*
     * after a hand-off, *Try again* after a photo that failed — held long enough to press.
     */
    line: (toast: PaymentToastFact, act: (() => void) | null) => {
      const label =
        toast.kind === 'askSent'
          ? t(PAYMENT_ACTS.yesSent)
          : toast.kind === 'photoNotStored'
            ? t(SHELL.tryAgain)
            : null;
      return {
        tone: failedPaymentToast(toast) ? ('warning' as const) : ('success' as const),
        title: toastOf(toast),
        ...(label === null || act === null
          ? {}
          : { undo: { label, onUndo: act }, duration: UNDO_TOAST_MS }),
      };
    },
  };
}
