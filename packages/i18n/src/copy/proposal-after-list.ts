import type { ProposalEntryDesign, ProposalRow, TranslatedText } from '@heliogrid/contracts';
import type { ProposalEntryFilter, ProposalStanding } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { dataTableWords } from './data-table';
import { designPreviewWord, designStatusWord } from './lead-designs';
import { proposalStandingWord } from './proposal-after-standing';

type T = Translator['t'];

/** What the caller holds for the tenant: money, a size, a moment, and how long ago one was. */
export interface ProposalListFormats {
  readonly money: (amount: string) => string;
  readonly number: (value: number) => string;
  readonly when: (instant: string) => string;
  readonly ago: (instant: string) => string;
}

const LIST = {
  title: /*i18n*/ { id: 'Proposals' },
  summary: /*i18n*/ {
    id: '{count, plural, =0 {None waiting for an answer} one {# waiting for an answer} other {# waiting for an answer}} · {amount} in all',
  },
  newProposal: /*i18n*/ { id: 'New proposal' },
  filterLabel: /*i18n*/ { id: 'Filter' },
  customer: /*i18n*/ { id: 'Customer' },
  number: /*i18n*/ { id: 'Number' },
  system: /*i18n*/ { id: 'System' },
  price: /*i18n*/ { id: 'Price' },
  status: /*i18n*/ { id: 'Status' },
  latest: /*i18n*/ { id: 'Latest' },
  copy: /*i18n*/ { id: 'Copy' },
  noName: /*i18n*/ { id: 'No name yet' },
  draft: /*i18n*/ { id: 'Draft' },
  kw: /*i18n*/ { id: '{size} kW' },
  noSize: /*i18n*/ { id: 'No size yet' },
  stale: /*i18n*/ { id: 'Not current' },
  newVersion: /*i18n*/ { id: 'Make a new version' },
  newVersionNamed: /*i18n*/ { id: 'Make a new version of {number}' },
  open: /*i18n*/ { id: 'Open the proposal for {name}' },
  openPlain: /*i18n*/ { id: 'Open this proposal' },
  copyNamed: /*i18n*/ { id: 'Use {number} for another lead' },
  copyDraft: /*i18n*/ { id: 'Use this draft for another lead' },
  more: /*i18n*/ { id: 'Show more' },
  openDesign: /*i18n*/ { id: 'Open the design for {name}' },
  openDesignPlain: /*i18n*/ { id: 'Open this design' },
  noPanels: /*i18n*/ { id: 'No panels yet' },
  byWhen: /*i18n*/ { id: '{name} · {when}' },
  you: /*i18n*/ { id: 'You' },
  empty3dTitle: /*i18n*/ { id: 'No 3D design yet' },
  empty3dLine: /*i18n*/ { id: 'Pick With 3D design in New proposal.' },
  emptyTitle: /*i18n*/ { id: 'No proposals here' },
  emptyLine: /*i18n*/ { id: 'A proposal starts on a lead, or with New proposal.' },
  loading: /*i18n*/ { id: 'Loading the proposals' },
  failedTitle: /*i18n*/ { id: 'Proposals did not load' },
  failedMessage: /*i18n*/ { id: 'Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
} as const;

const FILTER: Record<ProposalEntryFilter, MessageRef> = {
  '3d': /*i18n*/ { id: '3D' },
  all: /*i18n*/ { id: 'All' },
  waiting: /*i18n*/ { id: 'Waiting' },
  draft: /*i18n*/ { id: 'Draft' },
  accepted: /*i18n*/ { id: 'Accepted' },
  closed: /*i18n*/ { id: 'Closed' },
};

const LATEST = {
  drafted: /*i18n*/ { id: '{done} of {of} steps · saved {when}' },
  generated: /*i18n*/ { id: 'Generated {when} · not shared yet' },
  shared: /*i18n*/ { id: 'Shared {when} · not opened yet' },
  opened: /*i18n*/ { id: 'Opened {when}' },
  read: /*i18n*/ { id: 'Read for {count} min · {when}' },
  change_asked: /*i18n*/ { id: 'Asked for a change {when}' },
  accepted: /*i18n*/ { id: 'Accepted {when} · confirm won' },
  declined: /*i18n*/ { id: 'Declined {when}' },
  won: /*i18n*/ { id: 'Won {when}' },
  replaced: /*i18n*/ { id: 'Replaced by a newer proposal' },
  withdrawn: /*i18n*/ { id: 'Withdrawn {when}' },
} as const;

const WHOLE_MINUTE = 60;

function latestOf(t: T, formats: ProposalListFormats, row: ProposalRow): TranslatedText {
  const when = formats.ago(row.latest.at);
  const seconds = row.latest.viewedSeconds ?? 0;
  switch (row.latest.event) {
    case 'drafted':
      return t(LATEST.drafted, { done: row.progress.complete, of: row.progress.of, when });
    case 'opened':
      return seconds >= WHOLE_MINUTE
        ? t(LATEST.read, { count: Math.round(seconds / WHOLE_MINUTE), when })
        : t(LATEST.opened, { when });
    case 'replaced':
      return t(LATEST.replaced);
    default: {
      const word = (LATEST as Record<string, MessageRef | undefined>)[row.latest.event];
      /* An event a newer server learned: its standing's word, and when. */
      return word === undefined
        ? shownAsSent(`${proposalStandingWord(t, row.standing)} · ${when}`)
        : t(word, { when });
    }
  }
}

/** The table's own words, named so the list's words can be typed without reaching into them. */
export interface ProposalTableWords extends ReturnType<typeof dataTableWords> {}

/** A design's last change: who and when — "You · just now" for the reader's own. */
function designLatestOf(
  t: T,
  formats: ProposalListFormats,
  readerId: string | null,
  row: ProposalEntryDesign,
): TranslatedText {
  const when = formats.ago(row.changedAt);
  const by = row.changedBy;
  if (by === null) return shownAsSent(when);
  const name = by.userId === readerId ? t(LIST.you) : by.name;
  return t(LIST.byWhen, { name, when });
}

/** Who a row is for: the customer's name, and the lead's number for a row with no name. */
interface Named {
  readonly customerName: string | null;
  readonly customerPhone: string | null;
}

/** The name; else the number in the company's grouping, so two unnamed rows read apart; else `null`. */
const nameOrNumber = (row: Named, phone: (e164: string) => string): string | null =>
  row.customerName ?? (row.customerPhone === null ? null : phone(row.customerPhone));

/**
 * `ProposalList`'s words (`SCR-M06-19`, `T-M05-001b`); `readerId` is who reads, so their own
 * designs say "You".
 */
export function proposalListWords(
  t: T,
  formats: ProposalListFormats & { readonly phone: (e164: string) => string },
  readerId: string | null,
) {
  const named = (row: Named) => nameOrNumber(row, formats.phone);
  const table: ProposalTableWords = dataTableWords(t);
  return {
    filterLabel: t(LIST.filterLabel),
    filter: (filter: ProposalEntryFilter) => t(FILTER[filter]),
    columns: {
      customer: t(LIST.customer),
      number: t(LIST.number),
      system: t(LIST.system),
      price: t(LIST.price),
      status: t(LIST.status),
      latest: t(LIST.latest),
      copy: t(LIST.copy),
    },
    caption: t(LIST.title),
    standing: (standing: ProposalStanding | (string & {})) => proposalStandingWord(t, standing),
    customer: (row: Named) => {
      const name = named(row);
      return name === null ? t(LIST.noName) : shownAsSent(name);
    },
    number: (row: ProposalRow) => (row.number === null ? t(LIST.draft) : shownAsSent(row.number)),
    system: (row: ProposalRow) =>
      row.capacityKw === null
        ? t(LIST.noSize)
        : t(LIST.kw, { size: formats.number(row.capacityKw) }),
    price: (row: ProposalRow) => (row.payable === null ? null : formats.money(row.payable)),
    latest: (row: ProposalRow) => latestOf(t, formats, row),
    stale: t(LIST.stale),
    newVersion: t(LIST.newVersion),
    newVersionNamed: (row: ProposalRow) =>
      row.number === null ? t(LIST.newVersion) : t(LIST.newVersionNamed, { number: row.number }),
    open: (row: ProposalRow) => {
      const name = named(row);
      return name === null ? t(LIST.openPlain) : t(LIST.open, { name });
    },
    copyNamed: (row: ProposalRow) =>
      row.number === null ? t(LIST.copyDraft) : t(LIST.copyNamed, { number: row.number }),
    /** A design with no proposal yet (`T-M05-001b`): its spoken name, size, status and last change. */
    design: {
      open: (row: ProposalEntryDesign) => {
        const name = named(row);
        return name === null ? t(LIST.openDesignPlain) : t(LIST.openDesign, { name });
      },
      noPanels: t(LIST.noPanels),
      preview: designPreviewWord(t),
      /** A design's number and price cells: a dash, not yet — never an empty cell. */
      noFigure: shownAsSent('—'),
      status: (status: string) => designStatusWord(t, status),
      latest: (row: ProposalEntryDesign) => designLatestOf(t, formats, readerId, row),
    },
    more: t(LIST.more),
    emptyTitle: t(LIST.emptyTitle),
    emptyLine: t(LIST.emptyLine),
    empty3dTitle: t(LIST.empty3dTitle),
    empty3dLine: t(LIST.empty3dLine),
    loading: t(LIST.loading),
    failedTitle: t(LIST.failedTitle),
    failedMessage: t(LIST.failedMessage),
    retry: t(LIST.retry),
    table,
  };
}

/** The list page's head: its title, its one summary line and its main act. */
export function proposalListPageWords(
  t: T,
  formats: Pick<ProposalListFormats, 'money'>,
  facts: { readonly waiting: number; readonly waitingValue: string },
) {
  return {
    title: t(LIST.title),
    summary: t(LIST.summary, {
      count: facts.waiting,
      amount: formats.money(facts.waitingValue),
    }),
    newProposal: t(LIST.newProposal),
  };
}

const PICK = {
  title: /*i18n*/ { id: 'Copy for which customer?' },
  close: /*i18n*/ { id: 'Close' },
  searchLabel: /*i18n*/ { id: 'Search your leads' },
  searchPlaceholder: /*i18n*/ { id: 'Name or number' },
  clearSearch: /*i18n*/ { id: 'Clear the search' },
  newCustomer: /*i18n*/ { id: 'A new customer' },
  newCustomerLine: /*i18n*/ { id: 'Type their number first' },
  hint: /*i18n*/ {
    id: 'A copy brings every step filled. The customer’s name, phone and address come from the lead you pick.',
  },
  none: /*i18n*/ { id: 'No lead matches.' },
  loading: /*i18n*/ { id: 'Loading your leads' },
  failedTitle: /*i18n*/ { id: 'Your leads did not load' },
  failedMessage: /*i18n*/ { id: 'Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  copied: /*i18n*/ { id: 'Copied for {name}. Every step is filled.' },
} as const;

/** `PickLeadSheet`'s words (`M06-48`). */
export function pickLeadWords(t: T) {
  return {
    title: t(PICK.title),
    close: t(PICK.close),
    searchLabel: t(PICK.searchLabel),
    searchPlaceholder: t(PICK.searchPlaceholder),
    clearSearch: t(PICK.clearSearch),
    newCustomer: t(PICK.newCustomer),
    newCustomerLine: t(PICK.newCustomerLine),
    hint: t(PICK.hint),
    none: t(PICK.none),
    loading: t(PICK.loading),
    failedTitle: t(PICK.failedTitle),
    failedMessage: t(PICK.failedMessage),
    retry: t(PICK.retry),
    copied: (name: string) => t(PICK.copied, { name }),
  };
}

const WHO = {
  title: /*i18n*/ { id: 'Who is it for?' },
  save: /*i18n*/ { id: 'Save and build the proposal' },
  saveNote: /*i18n*/ { id: 'This also makes a lead, so nothing is typed twice.' },
  known: /*i18n*/ { id: '{name} is already a lead' },
  knownPlain: /*i18n*/ { id: 'This number is already a lead' },
  use: /*i18n*/ { id: 'Use {name}' },
  usePlain: /*i18n*/ { id: 'Use this lead' },
} as const;

/** What *New proposal*'s quick add says beyond the capture's own words (`T-M06-001`). */
export function proposalQuickAddWords(t: T, knownName: string | null) {
  return {
    title: t(WHO.title),
    save: t(WHO.save),
    saveNote: t(WHO.saveNote),
    known: {
      line: knownName === null ? t(WHO.knownPlain) : t(WHO.known, { name: knownName }),
      use: knownName === null ? t(WHO.usePlain) : t(WHO.use, { name: knownName }),
    },
  };
}
