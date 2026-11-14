import type { TranslatedText } from '@heliogrid/contracts';
import { customerShortNameOf, type DealSegment } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

/**
 * The customer's page while it is a proposal (`SCR-F5-01`, `F5-32`), in the customer's voice and
 * the READER's language (`F5-08`). The figures and their honesty lines are the document's own
 * (`proposalPageWords(…).blocks`); these are the page's words around them. What the customer wrote
 * is shown as sent, never translated (`F5-53`).
 */
type T = Translator['t'];

const PAGE = {
  hello: /*i18n*/ { id: 'Hello {name},' },
  helloPlain: /*i18n*/ { id: 'Hello,' },
  title: /*i18n*/ { id: 'Your {size} kW solar proposal' },
  titlePlain: /*i18n*/ { id: 'Your solar proposal' },
  withTax: /*i18n*/ { id: 'with {tax}' },
  yourPrice: /*i18n*/ { id: 'your price' },
  savedMonth: /*i18n*/ { id: 'saved a month' },
  paybackValue: /*i18n*/ { id: '{years} yrs' },
  payback: /*i18n*/ { id: 'payback' },
  parts: /*i18n*/ { id: 'What goes on your roof' },
  emi: /*i18n*/ { id: 'If you pay by EMI' },
  timeline: /*i18n*/ { id: 'From today to switch-on' },
  terms: /*i18n*/ { id: 'Terms' },
  questions: /*i18n*/ { id: 'Your questions' },
  received: /*i18n*/ { id: 'Received' },
  sent: /*i18n*/ { id: 'Sent' },
  willCall: /*i18n*/ { id: '{person} will call you with the answer.' },
  willCallPlain: /*i18n*/ { id: 'We will call you with the answer.' },
  accept: /*i18n*/ { id: 'Accept' },
  acceptWide: /*i18n*/ { id: 'Accept proposal' },
  askOrChange: /*i18n*/ { id: 'Ask or change' },
  askWide: /*i18n*/ { id: 'Ask, change or decline' },
  askOnly: /*i18n*/ { id: 'Ask a question or request a call' },
  sideOver: /*i18n*/ { id: 'Your price' },
  afterSubsidy: /*i18n*/ { id: 'After the {subsidy} subsidy: {net}' },
  energyAndPayback: /*i18n*/ { id: '{energy} kWh a year · payback {years} years' },
  energyOnly: /*i18n*/ { id: '{energy} kWh a year' },
  versionLine: /*i18n*/ { id: '{number} · version {version}' },
  versionOnly: /*i18n*/ { id: 'Version {version}' },
  validFor: /*i18n*/ { id: '{line} · valid for {days, plural, one {# day} other {# days}}' },
  pdf: /*i18n*/ { id: 'PDF' },
  pdfMaking: /*i18n*/ { id: 'Making the PDF…' },
  pdfLate: /*i18n*/ { id: 'The PDF is taking long. Try again in a minute.' },
  pdfFailed: /*i18n*/ { id: 'The PDF did not open. Try again.' },
  contactAt: /*i18n*/ { id: 'Your contact at {company}' },
  managerAt: /*i18n*/ { id: 'Your project manager at {company}' },
  call: /*i18n*/ { id: 'Call {name}' },
  loading: /*i18n*/ { id: 'Loading your page' },
  failedTitle: /*i18n*/ { id: 'The page did not load fully' },
  failedLine: /*i18n*/ { id: 'Your proposal is safe. Try again, or call {person} on {phone}.' },
  failedLinePlain: /*i18n*/ { id: 'Nothing is lost. Try again in a moment.' },
  retry: /*i18n*/ { id: 'Try again' },
  language: /*i18n*/ { id: 'Language' },
  when: /*i18n*/ { id: '{date}, {time}' },
} satisfies Record<string, MessageRef>;

const ANSWER = {
  acceptedTitle: /*i18n*/ { id: 'Accepted. Thank you, {name}.' },
  acceptedTitlePlain: /*i18n*/ { id: 'Accepted. Thank you.' },
  acceptedMeta: /*i18n*/ { id: '{when} · version {version} · {amount}' },
  callsYou: /*i18n*/ { id: '{person} calls you to confirm the next steps.' },
  weCallYou: /*i18n*/ { id: 'We call you to confirm the next steps.' },
  advanceAsked: /*i18n*/ {
    id: 'Then the advance of {amount} is requested. You pay nothing now.',
  },
  nothingNow: /*i18n*/ { id: 'You pay nothing now. The call tells you the next steps.' },
  sameLink: /*i18n*/ { id: 'This same link will show your progress.' },
  declinedTitle: /*i18n*/ { id: 'You declined this proposal' },
  declinedLine: /*i18n*/ {
    id: '{when}. Thank you for telling us. If you change your mind, call {person}.',
  },
  declinedLinePlain: /*i18n*/ { id: '{when}. Thank you for telling us.' },
  changeTitle: /*i18n*/ { id: '{person} has your request' },
  changeTitlePlain: /*i18n*/ { id: 'We have your request' },
  changeLine: /*i18n*/ { id: 'A new version will show on this same link.' },
  callTitle: /*i18n*/ { id: 'Call requested' },
  callLine: /*i18n*/ { id: '{person} will call you: {when}.' },
  callLinePlain: /*i18n*/ { id: 'We will call you: {when}.' },
} satisfies Record<string, MessageRef>;

const REFUSED = {
  already_answered: /*i18n*/ { id: 'This version already has its answer. The page now shows it.' },
  version_not_current: /*i18n*/ {
    id: 'A newer version was shared. The page now shows it. Please read it and answer again.',
  },
  figures_not_current: /*i18n*/ {
    id: 'The figures on this page need updating before it can be accepted. Nothing was recorded. Please call us for a fresh version.',
  },
  deal_won: /*i18n*/ { id: 'This proposal is already confirmed. Nothing more is needed here.' },
  lead_closed: /*i18n*/ { id: 'This proposal is no longer active.' },
  link_off: /*i18n*/ { id: 'This link was turned off.' },
  ceiling_met: /*i18n*/ { id: 'Too many tries in one hour. Please call instead.' },
} satisfies Record<string, MessageRef>;

const FAILED = {
  notTaken: /*i18n*/ { id: 'This was not recorded. The page now shows what stands.' },
  busy: /*i18n*/ { id: 'Too many visits right now. Please try again in a few minutes.' },
  offline: /*i18n*/ { id: 'No connection. Nothing was sent. Try again.' },
  failed: /*i18n*/ { id: 'This was not sent. Try again.' },
} satisfies Record<string, MessageRef>;

/** What the page knows of the people on it. A name that is absent is never invented. */
export interface CustomerPageFacts {
  readonly companyName: string;
  /** The customer's name, from the document; `null` where it holds none. The words shorten it. */
  readonly customerName: string | null;
  /** The deal's segment: a business is called by its whole name (`customerShortNameOf`). */
  readonly customerSegment: DealSegment | null;
  /** The named person (`F5-55`); `null` where the company has no active member left to name. */
  readonly personName: string | null;
  readonly personPhone: string | null;
}

/** Why an act was not recorded, said where the person acted (`F5-47`). */
export function customerActFailureWords(
  t: T,
  failure:
    | { readonly kind: 'not_taken'; readonly refusal: string }
    | { readonly kind: 'busy' }
    | { readonly kind: 'failed'; readonly offline: boolean },
): TranslatedText {
  if (failure.kind === 'busy') return t(FAILED.busy);
  if (failure.kind === 'failed') return t(failure.offline ? FAILED.offline : FAILED.failed);
  const known = (REFUSED as Record<string, MessageRef | undefined>)[failure.refusal];
  return known === undefined ? t(FAILED.notTaken) : t(known);
}

function answerWords(t: T, facts: CustomerPageFacts) {
  const person = facts.personName;
  const name = customerShortNameOf(facts.customerName, facts.customerSegment);
  return {
    acceptedTitle: name === null ? t(ANSWER.acceptedTitlePlain) : t(ANSWER.acceptedTitle, { name }),
    acceptedMeta: (when: string, version: number, amount: string) =>
      t(ANSWER.acceptedMeta, { when, version, amount }),
    /**
     * The three next steps (`F5-48`), each one whole sentence so a translation orders it its own
     * way. The advance is named only where the plan has one.
     */
    steps: (advance: string | null): readonly TranslatedText[] => [
      person === null ? t(ANSWER.weCallYou) : t(ANSWER.callsYou, { person }),
      advance === null ? t(ANSWER.nothingNow) : t(ANSWER.advanceAsked, { amount: advance }),
      t(ANSWER.sameLink),
    ],
    declinedTitle: t(ANSWER.declinedTitle),
    declinedLine: (when: string) =>
      person === null
        ? t(ANSWER.declinedLinePlain, { when })
        : t(ANSWER.declinedLine, { when, person }),
    changeTitle: person === null ? t(ANSWER.changeTitlePlain) : t(ANSWER.changeTitle, { person }),
    changeWords: (words: string) => shownAsSent(words),
    changeLine: t(ANSWER.changeLine),
    callTitle: t(ANSWER.callTitle),
    callLine: (when: string) =>
      person === null ? t(ANSWER.callLinePlain, { when }) : t(ANSWER.callLine, { when, person }),
  };
}

/** The proposal page's own words, for one reader. */
export function customerProposalWords(t: T, facts: CustomerPageFacts) {
  const person = facts.personName;
  return {
    hello:
      facts.customerName === null
        ? t(PAGE.helloPlain)
        : t(PAGE.hello, {
            name: customerShortNameOf(facts.customerName, facts.customerSegment),
          }),
    title: (size: string | null) => (size === null ? t(PAGE.titlePlain) : t(PAGE.title, { size })),
    hero: {
      withTax: (tax: string) => t(PAGE.withTax, { tax }),
      yourPrice: t(PAGE.yourPrice),
      savedMonth: t(PAGE.savedMonth),
      paybackValue: (years: string) => t(PAGE.paybackValue, { years }),
      payback: t(PAGE.payback),
    },
    cards: {
      parts: t(PAGE.parts),
      emi: t(PAGE.emi),
      timeline: t(PAGE.timeline),
      terms: t(PAGE.terms),
      questions: t(PAGE.questions),
    },
    question: {
      asked: (text: string) => shownAsSent(text),
      received: t(PAGE.received),
      sent: t(PAGE.sent),
      willCall: person === null ? t(PAGE.willCallPlain) : t(PAGE.willCall, { person }),
    },
    acts: {
      accept: t(PAGE.accept),
      acceptWide: t(PAGE.acceptWide),
      askOrChange: t(PAGE.askOrChange),
      askWide: t(PAGE.askWide),
      askOnly: t(PAGE.askOnly),
    },
    side: {
      over: t(PAGE.sideOver),
      afterSubsidy: (subsidy: string, net: string) => t(PAGE.afterSubsidy, { subsidy, net }),
      facts: (energy: string, years: string | null) =>
        years === null
          ? t(PAGE.energyOnly, { energy })
          : t(PAGE.energyAndPayback, { energy, years }),
    },
    answer: answerWords(t, facts),
    foot: {
      /** `PRP-0042 · version 1 · valid for 30 days`; no validity where the company wrote its own terms. */
      version: (number: string | null, version: number, validityDays: number | null) => {
        const line =
          number === null
            ? t(PAGE.versionOnly, { version })
            : t(PAGE.versionLine, { number, version });
        return validityDays === null ? line : t(PAGE.validFor, { line, days: validityDays });
      },
      pdf: t(PAGE.pdf),
      pdfMaking: t(PAGE.pdfMaking),
      pdfLate: t(PAGE.pdfLate),
      pdfFailed: t(PAGE.pdfFailed),
    },
    person: {
      contact: t(PAGE.contactAt, { company: facts.companyName }),
      manager: t(PAGE.managerAt, { company: facts.companyName }),
      call: (name: string) => t(PAGE.call, { name }),
    },
    read: {
      loading: t(PAGE.loading),
      failedTitle: t(PAGE.failedTitle),
      failedLine:
        person === null || facts.personPhone === null
          ? t(PAGE.failedLinePlain)
          : t(PAGE.failedLine, { person, phone: facts.personPhone }),
      retry: t(PAGE.retry),
    },
    language: t(PAGE.language),
    /** A moment as the page says it: the day, then the time, each as the market writes it. */
    when: (date: string, time: string) => t(PAGE.when, { date, time }),
  };
}
export type CustomerProposalWords = ReturnType<typeof customerProposalWords>;
