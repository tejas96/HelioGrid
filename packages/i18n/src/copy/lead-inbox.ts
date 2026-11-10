/**
 * The Lead Inbox's words (`SCR-M02-02`): its head, the deck (`LeadDeckCardWords`), the docked team
 * (`TeamDockWords`), each queued lead (`LeadTileWords`), the selection bar and the teaching empty
 * inbox (`InboxTeachingWords`, `M02-25`). What an act says while out and when it comes back is
 * `lead-inbox-acts.ts`'s.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';
import { assembled } from './assembled';
import { type AssignPickerSubject, assignPickerWords } from './assign-picker';
import { inboxActWords } from './lead-inbox-acts';
import { leadAgeWords, leadSourceWord } from './lead-marks';
import { SHELL } from './shell';

type T = Translator['t'];

const INBOX = {
  title: /*i18n*/ { id: 'Inbox' },
  summary: /*i18n*/ {
    id: '{waiting, plural, one {# waiting} other {# waiting}} · {pastDay, plural, one {# past 24 h} other {# past 24 h}}',
  },
  summaryOldest: /*i18n*/ {
    id: '{waiting, plural, one {# waiting} other {# waiting}} · {pastDay, plural, one {# past 24 h} other {# past 24 h}} · oldest {age}',
  },
  nothingWaiting: /*i18n*/ { id: 'Nothing waiting yet' },
  backToLeads: /*i18n*/ { id: 'Back to leads' },
  openInbox: /*i18n*/ { id: 'Open the inbox' },
  upNext: /*i18n*/ { id: 'Up next' },
  select: /*i18n*/ { id: 'Select' },
  doneSelecting: /*i18n*/ { id: 'Done' },
  showMore: /*i18n*/ { id: '{count, plural, one {Show # more} other {Show # more}}' },
  loading: /*i18n*/ { id: 'Loading your inbox' },
  failedTitle: /*i18n*/ { id: "Couldn't load your inbox" },
  noName: /*i18n*/ { id: 'No name yet' },
  noCity: /*i18n*/ { id: 'No city yet' },
  noBill: /*i18n*/ { id: 'No bill yet' },
  bill: /*i18n*/ { id: 'Monthly bill' },
  billNote: /*i18n*/ { id: "The customer's word" },
  noBillNote: /*i18n*/ { id: 'Ask on the first call' },
  junk: /*i18n*/ { id: 'Junk' },
  junkThis: /*i18n*/ { id: 'Junk this lead' },
  junkNamed: /*i18n*/ { id: 'Junk {name}' },
  assignThis: /*i18n*/ { id: 'Assign this lead' },
  assignNamed: /*i18n*/ { id: 'Assign {name}' },
  selectThis: /*i18n*/ { id: 'Select this lead' },
  selectNamed: /*i18n*/ { id: 'Select {name}' },
  openThis: /*i18n*/ { id: 'Open this lead' },
  openNamed: /*i18n*/ { id: 'Open {name}' },
  giveHint: /*i18n*/ { id: 'One click assigns. No confirm.' },
  keyGive: /*i18n*/ { id: 'give' },
  keyJunk: /*i18n*/ { id: 'junk' },
  keyNext: /*i18n*/ { id: 'next' },
  place: /*i18n*/ { id: '{place} of {total}' },
  previous: /*i18n*/ { id: 'Previous lead' },
  next: /*i18n*/ { id: 'Next lead' },
  waiting: /*i18n*/ { id: 'waiting' },
  alertAt: /*i18n*/ { id: 'Owner alert at 24 h' },
  pastDay: /*i18n*/ { id: 'Past 24 h' },
  you: /*i18n*/ { id: 'You' },
  giveTo: /*i18n*/ {
    id: 'Give to {name}: {open, plural, one {# open} other {# open}}, {overdue, plural, one {# overdue} other {# overdue}}',
  },
  all: /*i18n*/ { id: 'All {count}' },
  selected: /*i18n*/ { id: '{count, plural, one {# selected} other {# selected}}' },
  assign: /*i18n*/ { id: 'Assign' },
  clearSelection: /*i18n*/ { id: 'Clear selection' },
  teachTitle: /*i18n*/ { id: 'New leads wait here' },
  teachBody: /*i18n*/ {
    id: 'Every new lead lands here first, newest on top. You give each one to someone with one tap, or bin it.',
  },
  addLead: /*i18n*/ { id: 'Add a lead' },
  waysTitle: /*i18n*/ { id: 'How a lead arrives' },
  quickAddTitle: /*i18n*/ { id: 'Quick add' },
  quickAddLine: /*i18n*/ { id: 'Tap + on any screen. A number is enough.' },
  importTitle: /*i18n*/ { id: 'Import a file' },
  importLine: /*i18n*/ { id: 'Bring your old spreadsheet in, once.' },
  referralTitle: /*i18n*/ { id: 'A referral' },
  referralLine: /*i18n*/ {
    id: 'A customer sends a friend. Add the friend and pick who sent them.',
  },
} as const;

/** One of two sentences: the lead's name in it, or the words for a lead with none yet. */
function named(t: T, name: string | null, withName: { id: string }, without: { id: string }) {
  return name === null ? t(without) : t(withName, { name });
}

/** The inbox's head line — "148 waiting · 12 past 24 h" — and, on the desktop, the oldest's age. */
export function leadInboxSummary(
  t: T,
  facts: { waiting: number; pastDay: number; oldest: TranslatedText | null },
): TranslatedText {
  const counts = { waiting: facts.waiting, pastDay: facts.pastDay };
  return facts.oldest === null
    ? t(INBOX.summary, counts)
    : t(INBOX.summaryOldest, { ...counts, age: facts.oldest });
}

/** Every word the inbox screen draws, for both platforms. */
export function leadInboxWords(t: T) {
  const age = leadAgeWords(t);
  const gaps = {
    noName: t(INBOX.noName),
    noCity: t(INBOX.noCity),
    noBill: t(INBOX.noBill),
    age,
  };
  return {
    act: inboxActWords(t),
    source: (source: string) => leadSourceWord(t, source),
    picker: (subject: AssignPickerSubject) => assignPickerWords(t, subject),
    title: t(INBOX.title),
    nothingWaiting: t(INBOX.nothingWaiting),
    backToLeads: t(INBOX.backToLeads),
    upNext: t(INBOX.upNext),
    select: t(INBOX.select),
    doneSelecting: t(INBOX.doneSelecting),
    billColumn: t(INBOX.bill),
    showMore: (count: number) => t(INBOX.showMore, { count }),
    loading: t(INBOX.loading),
    failedTitle: t(INBOX.failedTitle),
    failedMessage: t(SHELL.keepsFailing),
    retry: t(SHELL.tryAgain),
    deck: {
      ...gaps,
      region: (name: string | null) => (name === null ? t(INBOX.noName) : assembled(name)),
      bill: t(INBOX.bill),
      billNote: t(INBOX.billNote),
      noBillNote: t(INBOX.noBillNote),
      junk: t(INBOX.junk),
      junkThis: t(INBOX.junkThis),
      give: assignPickerWords(t, { name: null }).title,
      giveHint: t(INBOX.giveHint),
      keys: { give: t(INBOX.keyGive), junk: t(INBOX.keyJunk), next: t(INBOX.keyNext) },
      place: (place: number, total: number) => t(INBOX.place, { place, total }),
      previous: t(INBOX.previous),
      next: t(INBOX.next),
      waiting: t(INBOX.waiting),
      alertAt: t(INBOX.alertAt),
      pastDay: t(INBOX.pastDay),
    },
    dock: {
      you: t(INBOX.you),
      open: assignPickerWords(t, { name: null }).open,
      overdue: assignPickerWords(t, { name: null }).overdue,
      giveTo: (name: string, open: number, overdue: number) =>
        t(INBOX.giveTo, { name, open, overdue }),
      all: (count: number) => t(INBOX.all, { count }),
    },
    tile: {
      ...gaps,
      assign: (name: string | null) => named(t, name, INBOX.assignNamed, INBOX.assignThis),
      junk: (name: string | null) => named(t, name, INBOX.junkNamed, INBOX.junkThis),
      select: (name: string | null) => named(t, name, INBOX.selectNamed, INBOX.selectThis),
      open: (name: string | null) => named(t, name, INBOX.openNamed, INBOX.openThis),
    },
    selection: {
      selected: (count: number) => t(INBOX.selected, { count }),
      assign: t(INBOX.assign),
      clear: t(INBOX.clearSelection),
    },
    teaching: {
      title: t(INBOX.teachTitle),
      body: t(INBOX.teachBody),
      add: t(INBOX.addLead),
      waysTitle: t(INBOX.waysTitle),
      ways: {
        quick_add: { title: t(INBOX.quickAddTitle), line: t(INBOX.quickAddLine) },
        import: { title: t(INBOX.importTitle), line: t(INBOX.importLine) },
        referral: { title: t(INBOX.referralTitle), line: t(INBOX.referralLine) },
      },
    },
  };
}

export type LeadInboxWords = ReturnType<typeof leadInboxWords>;

/** The Leads screen's way into the inbox — "Open the inbox". */
export function openLeadInboxWord(t: T): TranslatedText {
  return t(INBOX.openInbox);
}
