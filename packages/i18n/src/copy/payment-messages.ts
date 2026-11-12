import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';

/**
 * Payments' server-written words (`M11`): the notices the api writes in each RECIPIENT's language
 * (`F6-08`), and the pay request and the receipt it writes in the CUSTOMER's language (`F3-06`)
 * for a person to share. Every figure arrives already formatted; nothing here works one out.
 */

const PAYMENT_WORDS = {
  dueTitle: /*i18n*/ { id: '{name}: {part} is due' },
  dueBody: /*i18n*/ { id: '{amount} to collect. Share the pay request.' },
  recordedTitle: /*i18n*/ { id: '{name}: {amount} received' },
  recordedBody: /*i18n*/ { id: '{recorder} recorded it against {part}.' },
  reversedTitle: /*i18n*/ { id: '{name}: a payment was reversed' },
  reversedBody: /*i18n*/ { id: '{recorder} reversed {amount}: {reason}' },
  requestGreeting: /*i18n*/ { id: 'Hello {customer},' },
  requestGreetingNoName: /*i18n*/ { id: 'Hello,' },
  requestDue: /*i18n*/ { id: '{part} of your solar project {number} is due: {amount}.' },
  requestUpi: /*i18n*/ { id: 'Pay by any UPI app to {upiId} ({payee}). Note: {note}' },
  requestBank: /*i18n*/ {
    id: 'Bank transfer: {accountName}, account {accountNumber}, {routingLabel} {routing}, {bankName}.',
  },
  requestThanks: /*i18n*/ { id: 'Thank you — {company}' },
  receiptTitle: /*i18n*/ { id: 'Receipt {number} — {company}' },
  receiptReceived: /*i18n*/ {
    id: 'Received {amount} from {customer} for {part} of project {project}.',
  },
  receiptHow: /*i18n*/ { id: 'Paid by {mode} on {date}.' },
  receiptHowWithReference: /*i18n*/ { id: 'Paid by {mode} on {date}, reference {reference}.' },
  receiptRecorded: /*i18n*/ { id: 'Recorded by {recorder}.' },
  receiptNotInvoice: /*i18n*/ { id: 'This is a payment receipt, not a tax invoice.' },
} satisfies Record<string, MessageRef>;

interface NoticeText {
  title: TranslatedText;
  body: TranslatedText;
}

/** A part fell due (`F6` `payment_due`): who it is, which part, and what to collect. */
export function paymentDueNotice(
  t: Translator['t'],
  due: { readonly name: string; readonly part: string; readonly amount: string },
): NoticeText {
  return {
    title: t(PAYMENT_WORDS.dueTitle, { name: due.name, part: due.part }),
    body: t(PAYMENT_WORDS.dueBody, { amount: due.amount }),
  };
}

/** Money came in: the manager hears who recorded what, against which part. */
export function paymentRecordedNotice(
  t: Translator['t'],
  paid: {
    readonly name: string;
    readonly part: string;
    readonly amount: string;
    readonly recorder: string;
  },
): NoticeText {
  return {
    title: t(PAYMENT_WORDS.recordedTitle, { name: paid.name, amount: paid.amount }),
    body: t(PAYMENT_WORDS.recordedBody, { recorder: paid.recorder, part: paid.part }),
  };
}

/** A payment was taken back (`M11-46`), with its reason. */
export function paymentReversedNotice(
  t: Translator['t'],
  reversed: {
    readonly name: string;
    readonly amount: string;
    readonly recorder: string;
    readonly reason: string;
  },
): NoticeText {
  return {
    title: t(PAYMENT_WORDS.reversedTitle, { name: reversed.name }),
    body: t(PAYMENT_WORDS.reversedBody, {
      recorder: reversed.recorder,
      amount: reversed.amount,
      reason: reversed.reason,
    }),
  };
}

/** What a pay request carries: the part, the amount, and the ways to pay that the company has. */
export interface PayRequestWords {
  readonly customer: string | null;
  readonly part: string;
  readonly number: string;
  readonly amount: string;
  readonly company: string;
  readonly upi: { readonly upiId: string; readonly payee: string; readonly note: string } | null;
  readonly bank: {
    readonly accountName: string;
    readonly accountNumber: string;
    readonly routingLabel: string;
    readonly routing: string;
    readonly bankName: string;
  } | null;
}

/**
 * The pay request a person shares from their own phone (owner ruling 2026-11-11): the part and
 * exactly what it owes, then each way to pay the company has set up, one per line.
 */
export function payRequestMessage(t: Translator['t'], request: PayRequestWords): string {
  const lines = [
    request.customer === null
      ? t(PAYMENT_WORDS.requestGreetingNoName)
      : t(PAYMENT_WORDS.requestGreeting, { customer: request.customer }),
    t(PAYMENT_WORDS.requestDue, {
      part: request.part,
      number: request.number,
      amount: request.amount,
    }),
  ];
  if (request.upi !== null) lines.push(t(PAYMENT_WORDS.requestUpi, { ...request.upi }));
  if (request.bank !== null) lines.push(t(PAYMENT_WORDS.requestBank, { ...request.bank }));
  lines.push(t(PAYMENT_WORDS.requestThanks, { company: request.company }));
  return lines.join('\n');
}

/** What a receipt says (`M11-41`): who paid what for which part, how, and who recorded it. */
export interface ReceiptWords {
  readonly number: string;
  readonly company: string;
  readonly customer: string;
  readonly project: string;
  readonly part: string;
  readonly amount: string;
  readonly mode: string;
  readonly date: string;
  readonly reference: string | null;
  readonly recorder: string;
}

/** The receipt as text, to share — a payment receipt, never a tax invoice. */
export function receiptMessage(t: Translator['t'], receipt: ReceiptWords): string {
  return [
    t(PAYMENT_WORDS.receiptTitle, { number: receipt.number, company: receipt.company }),
    t(PAYMENT_WORDS.receiptReceived, {
      amount: receipt.amount,
      customer: receipt.customer,
      part: receipt.part,
      project: receipt.project,
    }),
    receipt.reference === null
      ? t(PAYMENT_WORDS.receiptHow, { mode: receipt.mode, date: receipt.date })
      : t(PAYMENT_WORDS.receiptHowWithReference, {
          mode: receipt.mode,
          date: receipt.date,
          reference: receipt.reference,
        }),
    t(PAYMENT_WORDS.receiptRecorded, { recorder: receipt.recorder }),
    t(PAYMENT_WORDS.receiptNotInvoice),
  ].join('\n');
}
