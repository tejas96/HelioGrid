/**
 * The handover (`SCR-M08-06`): what still waits, the ready message the person sends themselves —
 * no delivery claimed — and the referral ask in the same flow (`M08-47`).
 */
import { LANGUAGES, uiLanguageOrSource } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { phoneFieldWords } from './phone-field';
import type { PackWord } from './projects';
import { PROJECT_FAILED_MESSAGE } from './projects';
import { SHELL } from './shell';

type T = Translator['t'];

const HANDOVER = {
  title: /*i18n*/ { id: 'Hand over' },
  summary: /*i18n*/ { id: '{name} · {place}' },
  ready: /*i18n*/ { id: 'Every document is done' },
  readyLine: /*i18n*/ { id: '{done} done · {notNeeded} not needed' },
  waitingTitle: /*i18n*/ { id: 'These still wait' },
  waitingLine: /*i18n*/ { id: 'Upload them or mark them not needed, then hand over.' },
  notYet: /*i18n*/ { id: 'You can hand over once the project reaches {stage}.' },
  closed: /*i18n*/ { id: 'This project is closed. Nothing more moves it.' },
  packTitle: /*i18n*/ { id: 'Handover pack' },
  packUnmade: /*i18n*/ {
    id: 'PDF · {files, plural, one {# file} other {# files}} · made when you hand over',
  },
  packMade: /*i18n*/ { id: 'PDF · {files, plural, one {# file} other {# files}}' },
  packMadeLeftOut: /*i18n*/ {
    id: 'PDF · {files, plural, one {# file} other {# files}} · {leftOut, plural, one {# file could not be read and is left out} other {# files could not be read and are left out}}',
  },
  packUnreadable: /*i18n*/ {
    id: 'No file could be read into the pack. Open each document on the project.',
  },
  packEmpty: /*i18n*/ { id: 'No files to put in a pack' },
  packMaking: /*i18n*/ { id: 'Making the pack…' },
  packLate: /*i18n*/ { id: 'The pack is not ready yet. Try again.' },
  download: /*i18n*/ { id: 'Download' },
  message: /*i18n*/ { id: 'Message · in {language}' },
  share: /*i18n*/ { id: 'Share the message' },
  copy: /*i18n*/ { id: 'Copy' },
  copied: /*i18n*/ { id: 'Copied — paste it where you talk to the customer.' },
  noDelivery: /*i18n*/ { id: 'HelioGrid never claims it was delivered.' },
  send: /*i18n*/ { id: 'Hand over' },
  done: /*i18n*/ { id: 'Handed over' },
  doneLine: /*i18n*/ { id: '{name} · the pack stays on the project.' },
  doneLineNoPack: /*i18n*/ { id: '{name} · its history stays on the project.' },
  referralTitle: /*i18n*/ { id: 'Ask while they are happy' },
  referralLine: /*i18n*/ { id: 'Does {name} know someone who wants solar?' },
  referralLineNoName: /*i18n*/ { id: 'Do they know someone who wants solar?' },
  referralName: /*i18n*/ { id: 'Name' },
  referralPhone: /*i18n*/ { id: 'Mobile' },
  referralAdd: /*i18n*/ { id: 'Add as a lead' },
  referralSkip: /*i18n*/ { id: 'Not now' },
  referralNote: /*i18n*/ { id: 'The lead is marked as referred by them. No credits, no points.' },
  referralAdded: /*i18n*/ { id: '{name} added as a lead' },
  referralKnown: /*i18n*/ { id: 'That number is already a customer. Nothing new was added.' },
  referralFailed: /*i18n*/ { id: 'The lead was not added. Try again.' },
  loading: /*i18n*/ { id: 'Checking the documents' },
  failedTitle: /*i18n*/ { id: 'The handover did not load' },
} satisfies Record<string, MessageRef>;

/** The handover's words, with the referral ask in the same flow (`M08-47`). */
export function handoverWords(t: T, word: PackWord) {
  return {
    title: t(HANDOVER.title),
    /** Whose job it is — the customer's name, else the project's number — and where. */
    summary: (name: string, place: string | null) =>
      place === null ? shownAsSent(name) : t(HANDOVER.summary, { name, place }),
    ready: t(HANDOVER.ready),
    readyLine: (done: number, notNeeded: number) => t(HANDOVER.readyLine, { done, notNeeded }),
    waitingTitle: t(HANDOVER.waitingTitle),
    waitingLine: t(HANDOVER.waitingLine),
    /** Before the stage handover opens at: that stage, named. */
    notYet: (stage: string) => t(HANDOVER.notYet, { stage: word('stage', stage) }),
    closed: t(HANDOVER.closed),
    row: (row: string) => word('row', row),
    packTitle: t(HANDOVER.packTitle),
    /** Before the handover: what the pack will hold, made at the handover itself. */
    packUnmade: (files: number) => t(HANDOVER.packUnmade, { files }),
    packMade: (files: number) => t(HANDOVER.packMade, { files }),
    packMadeLeftOut: (files: number, leftOut: number) =>
      t(HANDOVER.packMadeLeftOut, { files, leftOut }),
    packUnreadable: t(HANDOVER.packUnreadable),
    /** Every row was not needed: the server makes no pack. */
    packEmpty: t(HANDOVER.packEmpty),
    packMaking: t(HANDOVER.packMaking),
    packLate: t(HANDOVER.packLate),
    download: t(HANDOVER.download),
    /** The customer's language by its own name — never its code. */
    message: (language: string) =>
      t(HANDOVER.message, { language: LANGUAGES[uiLanguageOrSource(language)].endonym }),
    share: t(HANDOVER.share),
    copy: t(HANDOVER.copy),
    copied: t(HANDOVER.copied),
    noDelivery: t(HANDOVER.noDelivery),
    send: t(HANDOVER.send),
    done: t(HANDOVER.done),
    /** Under the moment: whose job, and that the pack — or, with none, the history — stays. */
    doneLine: (name: string, packed: boolean) =>
      t(packed ? HANDOVER.doneLine : HANDOVER.doneLineNoPack, { name }),
    referralTitle: t(HANDOVER.referralTitle),
    referralLine: (name: string | null) =>
      name === null ? t(HANDOVER.referralLineNoName) : t(HANDOVER.referralLine, { name }),
    referralName: t(HANDOVER.referralName),
    referralPhone: t(HANDOVER.referralPhone),
    referralAdd: t(HANDOVER.referralAdd),
    referralSkip: t(HANDOVER.referralSkip),
    referralNote: t(HANDOVER.referralNote),
    referralAdded: (name: string) => t(HANDOVER.referralAdded, { name }),
    referralKnown: t(HANDOVER.referralKnown),
    referralFailed: t(HANDOVER.referralFailed),
    phoneField: phoneFieldWords(t),
    loading: t(HANDOVER.loading),
    failedTitle: t(HANDOVER.failedTitle),
    failedMessage: t(PROJECT_FAILED_MESSAGE),
    retry: t(SHELL.tryAgain),
    close: t(SHELL.close),
  };
}
export type HandoverCopy = ReturnType<typeof handoverWords>;

/**
 * The words HelioGrid hands a person to send the customer themselves (owner ruling 2026-11-10):
 * the phone's share sheet or a copy carries them, so no delivery is ever claimed (`M08-46`).
 * Rendered by the api in the CUSTOMER's language (`F3-06`), once, for that send.
 */
const PROJECT_MESSAGES = {
  handover: /*i18n*/ {
    id: 'Hello {customer}! Your solar system is now handed over to you. Your documents: {documents}. Thank you for choosing us. — {company}',
  },
  handoverNoName: /*i18n*/ {
    id: 'Hello! Your solar system is now handed over to you. Your documents: {documents}. Thank you for choosing us. — {company}',
  },
  handoverNoDocuments: /*i18n*/ {
    id: 'Hello {customer}! Your solar system is now handed over to you. Thank you for choosing us. — {company}',
  },
  handoverNoNameNoDocuments: /*i18n*/ {
    id: 'Hello! Your solar system is now handed over to you. Thank you for choosing us. — {company}',
  },
} satisfies Record<string, MessageRef>;

/**
 * The handover message: who, which documents, and the company that sends it. A project handed over
 * with no document done names none — never an empty list.
 */
export function handoverMessage(
  translate: Translator['t'],
  facts: { readonly customer: string | null; readonly documents: string; readonly company: string },
): string {
  const { customer, documents, company } = facts;
  const named = customer !== null;
  if (documents.trim() === '') {
    return named
      ? translate(PROJECT_MESSAGES.handoverNoDocuments, { customer, company })
      : translate(PROJECT_MESSAGES.handoverNoNameNoDocuments, { company });
  }
  return named
    ? translate(PROJECT_MESSAGES.handover, { customer, documents, company })
    : translate(PROJECT_MESSAGES.handoverNoName, { documents, company });
}
