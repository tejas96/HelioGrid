import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

/**
 * The customer's page after the proposal (`SCR-F5-02`, `SCR-F5-03`) and the page of a link that
 * cannot serve (`SCR-F5-04`). No percentage and no invented date: a date nobody published reads
 * "not yet known" (`F5-66`); a payment reads as recorded by the company, never confirmed by a bank
 * (`F5-59`); the referral ask names a number and no money (`F5-72`).
 */
type T = Translator['t'];

const OFF = {
  endedTitle: /*i18n*/ { id: 'This proposal is no longer active' },
  endedLine: /*i18n*/ { id: '{company} closed it. {person} can send you a new one.' },
  endedLinePlain: /*i18n*/ { id: '{company} closed it. Ask them for a new one.' },
  revokedTitle: /*i18n*/ { id: 'This link was turned off' },
  revokedLine: /*i18n*/ { id: 'Ask {person} for a new link.' },
  revokedLinePlain: /*i18n*/ { id: 'Ask {company} for a new link.' },
  busyTitle: /*i18n*/ { id: 'Too many visits right now' },
  busyLine: /*i18n*/ { id: 'Please try again in a few minutes.' },
  noneTitle: /*i18n*/ { id: 'No proposal here yet' },
  noneLine: /*i18n*/ { id: '{person} will send you one.' },
  noneLinePlain: /*i18n*/ { id: '{company} will send you one.' },
  retry: /*i18n*/ { id: 'Try again' },
} satisfies Record<string, MessageRef>;

const PROGRESS = {
  over: /*i18n*/ { id: 'Your {size} kW solar' },
  overPlain: /*i18n*/ { id: 'Your solar' },
  stepWaiting: /*i18n*/ { id: 'Step {step} of {count}. We wait for {party}.' },
  stepNow: /*i18n*/ { id: 'Step {step} of {count}. {stage}.' },
  allDone: /*i18n*/ { id: 'Every step is done.' },
  waitingSince: /*i18n*/ { id: 'Waiting on {party} since {date} · {reason}' },
  usually: /*i18n*/ {
    id: '{days, plural, one {usually # day} other {usually # days}}',
  },
  endNotKnown: /*i18n*/ { id: 'The end date is not yet known' },
  inProgress: /*i18n*/ { id: 'In progress' },
  stage: /*i18n*/ { id: 'Step {step} of {count}: {label}' },
  dayTitle: /*i18n*/ { id: 'Your installation day' },
  when: /*i18n*/ { id: 'When' },
  whenValue: /*i18n*/ { id: '{date}, {time}' },
  who: /*i18n*/ { id: 'Who' },
  howLong: /*i18n*/ { id: 'How long' },
  days: /*i18n*/ { id: '{days, plural, one {# day} other {# days}}' },
  expect: /*i18n*/ { id: 'What to expect' },
  notKnown: /*i18n*/ { id: 'Not yet known' },
  notScheduled: /*i18n*/ { id: 'Not yet scheduled. {person} will tell you the day.' },
  notScheduledPlain: /*i18n*/ { id: 'Not yet scheduled. We will tell you the day.' },
  crewLead: /*i18n*/ { id: 'Crew lead: {name}, {phone}' },
  payments: /*i18n*/ { id: 'Payments' },
  paidLine: /*i18n*/ { id: 'Paid {date} · receipt {number} · recorded by {company}' },
  paidLineUndated: /*i18n*/ { id: 'Receipt {number} · recorded by {company}' },
  reversedLine: /*i18n*/ { id: 'Reversed on {date}' },
  dueLine: /*i18n*/ { id: 'Due now' },
  partLine: /*i18n*/ { id: '{received} received · {outstanding} still to pay' },
  paid: /*i18n*/ { id: 'Paid' },
  due: /*i18n*/ { id: 'Due' },
  partPaid: /*i18n*/ { id: 'Part paid' },
  waived: /*i18n*/ { id: 'Waived' },
  upi: /*i18n*/ { id: 'UPI' },
  bank: /*i18n*/ { id: 'Bank' },
  bankValue: /*i18n*/ { id: '{bank} · {account} · {routing}' },
  payee: /*i18n*/ { id: 'Pay to' },
  payExactly: /*i18n*/ { id: 'Pay exactly' },
  receipt: /*i18n*/ { id: 'Receipt {number}' },
  cancelledTitle: /*i18n*/ { id: 'This project was cancelled on {date}' },
  cancelledLine: /*i18n*/ {
    id: 'Nothing more will happen on site. Your receipts stay here. Call {person} for any question about a refund.',
  },
  cancelledLinePlain: /*i18n*/ {
    id: 'Nothing more will happen on site. Your receipts stay here.',
  },
} satisfies Record<string, MessageRef>;

const FILE = {
  switchedOn: /*i18n*/ { id: 'Switched on {date}' },
  title: /*i18n*/ { id: 'Your solar file' },
  documents: /*i18n*/ { id: 'Your documents' },
  none: /*i18n*/ { id: 'No document is here yet.' },
  notOpened: /*i18n*/ { id: 'The file did not open. Try again.' },
  keep: /*i18n*/ { id: 'This link stays yours. Keep it for the life of the system.' },
  referTitle: /*i18n*/ { id: 'Happy with your solar?' },
  referLine: /*i18n*/ {
    id: 'Tell a neighbour. A good word helps a small company more than any advert.',
  },
  copy: /*i18n*/ { id: 'Copy number' },
  copied: /*i18n*/ { id: 'Number copied' },
  /** The browser refused the clipboard: the share sheets' own line, as it stands. */
  notCopied: /*i18n*/ { id: 'Not copied. Copy it by hand.' },
} satisfies Record<string, MessageRef>;

interface PhaseFacts {
  readonly companyName: string;
  readonly personName: string | null;
}

/** Why the link cannot serve, in two sentences — nothing about the proposal (`F5-25`). */
export function customerOffWords(t: T, facts: PhaseFacts, reason: string) {
  const { companyName: company, personName: person } = facts;
  const named = <A extends MessageRef, B extends MessageRef>(withPerson: A, plain: B) =>
    person === null ? t(plain, { company }) : t(withPerson, { company, person });
  switch (reason) {
    case 'revoked':
      return {
        title: t(OFF.revokedTitle),
        line: named(OFF.revokedLine, OFF.revokedLinePlain),
        retry: null,
      };
    case 'busy':
      return { title: t(OFF.busyTitle), line: t(OFF.busyLine), retry: t(OFF.retry) };
    case 'none':
      return {
        title: t(OFF.noneTitle),
        line: named(OFF.noneLine, OFF.noneLinePlain),
        retry: null,
      };
    default:
      return {
        title: t(OFF.endedTitle),
        line: named(OFF.endedLine, OFF.endedLinePlain),
        retry: null,
      };
  }
}

/** The busy page of an address whose company the page never learned (`F5-78`). */
export function customerBusyWords(t: T) {
  return { title: t(OFF.busyTitle), line: t(OFF.busyLine), retry: t(OFF.retry) };
}

/** The progress page's own words. Stage, party and reason names are the market pack's. */
export function customerProgressWords(t: T, facts: PhaseFacts) {
  const { companyName: company, personName: person } = facts;
  return {
    over: (size: string | null) =>
      size === null ? t(PROGRESS.overPlain) : t(PROGRESS.over, { size }),
    headline: {
      waiting: (step: number, count: number, party: string) =>
        t(PROGRESS.stepWaiting, { step, count, party }),
      now: (step: number, count: number, stage: string) =>
        t(PROGRESS.stepNow, { step, count, stage }),
      allDone: t(PROGRESS.allDone),
    },
    stage: {
      name: (step: number, count: number, label: string) =>
        t(PROGRESS.stage, { step, count, label }),
      waitingSince: (party: string, date: string, reason: string) =>
        t(PROGRESS.waitingSince, { party, date, reason }),
      usually: (days: number) => t(PROGRESS.usually, { days }),
      endNotKnown: t(PROGRESS.endNotKnown),
      inProgress: t(PROGRESS.inProgress),
    },
    day: {
      title: t(PROGRESS.dayTitle),
      when: t(PROGRESS.when),
      whenValue: (date: string, time: string | null) =>
        time === null ? shownAsSent(date) : t(PROGRESS.whenValue, { date, time }),
      who: t(PROGRESS.who),
      howLong: t(PROGRESS.howLong),
      days: (days: number) => t(PROGRESS.days, { days }),
      expect: t(PROGRESS.expect),
      expectValue: (words: string) => shownAsSent(words),
      notKnown: t(PROGRESS.notKnown),
      notScheduled:
        person === null ? t(PROGRESS.notScheduledPlain) : t(PROGRESS.notScheduled, { person }),
      crewLead: (name: string, phone: string) => t(PROGRESS.crewLead, { name, phone }),
    },
    payments: {
      title: t(PROGRESS.payments),
      paidLine: (date: string | null, number: string) =>
        date === null
          ? t(PROGRESS.paidLineUndated, { number, company })
          : t(PROGRESS.paidLine, { date, number, company }),
      reversedLine: (date: string) => t(PROGRESS.reversedLine, { date }),
      dueLine: t(PROGRESS.dueLine),
      partLine: (received: string, outstanding: string) =>
        t(PROGRESS.partLine, { received, outstanding }),
      state: {
        received: t(PROGRESS.paid),
        due: t(PROGRESS.due),
        part_received: t(PROGRESS.partPaid),
        waived: t(PROGRESS.waived),
      } as Readonly<Record<string, TranslatedText | undefined>>,
      upi: t(PROGRESS.upi),
      bank: t(PROGRESS.bank),
      bankValue: (bank: string, account: string, routing: string) =>
        t(PROGRESS.bankValue, { bank, account, routing }),
      payee: t(PROGRESS.payee),
      payExactly: t(PROGRESS.payExactly),
      receipt: (number: string) => t(PROGRESS.receipt, { number }),
      /** A receipt whose file did not open: the solar file's own line, as it stands. */
      notOpened: t(FILE.notOpened),
    },
    cancelled: {
      title: (date: string) => t(PROGRESS.cancelledTitle, { date }),
      line:
        person === null ? t(PROGRESS.cancelledLinePlain) : t(PROGRESS.cancelledLine, { person }),
    },
  };
}
export type CustomerProgressWords = ReturnType<typeof customerProgressWords>;

/** The solar file's own words (`F5-70`…`F5-73`). */
export function customerSolarFileWords(t: T) {
  return {
    switchedOn: (date: string) => t(FILE.switchedOn, { date }),
    title: t(FILE.title),
    documents: t(FILE.documents),
    none: t(FILE.none),
    notOpened: t(FILE.notOpened),
    keep: t(FILE.keep),
    referTitle: t(FILE.referTitle),
    referLine: t(FILE.referLine),
    copy: t(FILE.copy),
    copied: t(FILE.copied),
    notCopied: t(FILE.notCopied),
  };
}
export type CustomerSolarFileWords = ReturnType<typeof customerSolarFileWords>;
