/**
 * The Leads list's words (`SCR-M02-03`): its head and summary, whose leads, the pipeline meter
 * (`packages/ui`'s `StageMeterWords`), the filters, the table's columns, each listed lead
 * (`LeadListRowWords`) and what comes next on it, and its first run, no match and failure.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import {
  type FormatPack,
  formatClockAt,
  formatDayMonth,
  isTenantToday,
  LEAD_SOURCES,
  type LeadRowNext,
  type LeadSource,
  type LeadStage,
  type LeadsListSort,
  type LeadsWhose,
  TASK_KINDS,
  type TaskKind,
  type UiLanguage,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { LEAD_STAGE_WORD, TASK_KIND_WORD } from './crm-vocabulary';
import { LEAD_DETAIL } from './lead-detail';
import { lastContactWord, leadSourceWord, leadStateLabel, stageTrackWords } from './lead-marks';

type T = Translator['t'];

const LIST = {
  title: /*i18n*/ { id: 'Leads' },
  loading: /*i18n*/ { id: 'Loading your leads' },
  failedTitle: /*i18n*/ { id: 'Couldn’t load your leads' },
  failedMessage: /*i18n*/ { id: 'Check your connection, then try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  firstRunSummary: /*i18n*/ { id: 'No leads yet' },
  summaryOpen: /*i18n*/ { id: '{open, plural, one {# open} other {# open}}' },
  summaryWaiting: /*i18n*/ {
    id: '{open, plural, one {# open} other {# open}} · {waiting, plural, one {# waiting in the inbox} other {# waiting in the inbox}}',
  },
  summaryFiltered: /*i18n*/ {
    id: '{matching, plural, one {# match} other {# match}} · {filters, plural, one {# filter on} other {# filters on}}',
  },
  whoseLabel: /*i18n*/ { id: 'Whose leads' },
  mine: /*i18n*/ { id: 'Mine' },
  team: /*i18n*/ { id: 'Team' },
  all: /*i18n*/ { id: 'All' },
  inbox: /*i18n*/ { id: 'Inbox' },
  inboxSpoken: /*i18n*/ {
    id: '{count, plural, one {Inbox, # waiting} other {Inbox, # waiting}}',
  },
  pipeline: /*i18n*/ { id: '{open, plural, one {Pipeline · # open} other {Pipeline · # open}}' },
  pipelineHint: /*i18n*/ { id: 'Tap a stage to filter' },
  stageSpoken: /*i18n*/ {
    id: '{count, plural, one {{stage}, # lead} other {{stage}, # leads}}',
  },
  filters: /*i18n*/ { id: 'Filters' },
  dormant: /*i18n*/ { id: 'Dormant' },
  bill: /*i18n*/ { id: 'Bill' },
  billLargest: /*i18n*/ { id: 'Bill, largest first' },
  billSmallest: /*i18n*/ { id: 'Bill, smallest first' },
  source: /*i18n*/ { id: 'Source' },
  anySource: /*i18n*/ { id: 'Any source' },
  search: /*i18n*/ { id: 'Search leads' },
  searchHint: /*i18n*/ { id: 'Name, phone or city' },
  clearSearch: /*i18n*/ { id: 'Clear search' },
  selected: /*i18n*/ { id: 'Selected' },
  addLead: /*i18n*/ { id: 'Add lead' },
  import: /*i18n*/ { id: 'Import' },
  lead: /*i18n*/ { id: 'Lead' },
  stage: /*i18n*/ { id: 'Stage' },
  monthlyBill: /*i18n*/ { id: 'Monthly bill' },
  owner: /*i18n*/ { id: 'Owner' },
  next: /*i18n*/ { id: 'Next' },
  lastActivity: /*i18n*/ { id: 'Last activity' },
  noBill: /*i18n*/ { id: 'No bill yet' },
  openThis: /*i18n*/ { id: 'Open this lead' },
  openNamed: /*i18n*/ { id: 'Open {name}' },
  quiet: /*i18n*/ { id: '{days, plural, one {Quiet # day} other {Quiet # days}}' },
  taskAt: /*i18n*/ { id: '{task} {time}' },
  taskOn: /*i18n*/ { id: '{task} {day}' },
  taskOverdue: /*i18n*/ { id: '{task}, overdue' },
  firstRunTitle: /*i18n*/ { id: 'Your leads will be listed here' },
  firstRunBody: /*i18n*/ {
    id: 'Add a lead with just a number, or bring your old list in from a file.',
  },
  addALead: /*i18n*/ { id: 'Add a lead' },
  importAFile: /*i18n*/ { id: 'Import a file' },
  noMatchTitle: /*i18n*/ { id: 'No leads match these filters' },
  noMatchBody: /*i18n*/ { id: 'Clear them to see every lead again.' },
  clearFilters: /*i18n*/ { id: 'Clear filters' },
  showMore: /*i18n*/ { id: '{count, plural, one {Show # more} other {Show # more}}' },
  loadingMore: /*i18n*/ { id: 'Loading more leads' },
} as const;

/** The reader's clock and calendar, for the days and times a row names. */
export interface LeadsListClock {
  readonly pack: FormatPack;
  readonly language: UiLanguage;
  readonly now: number;
}

/** What the summary under the title counts. */
export interface LeadsListSummaryFacts {
  /** Active and snoozed leads under the chosen owner. */
  readonly open: number;
  /** Waiting in the inbox; null where the inbox is not offered or not read yet. */
  readonly waiting: number | null;
  readonly matching: number;
  readonly filtersOn: number;
}

/** "46 open · 6 waiting in the inbox", or, with filters on, "3 match · 2 filters on". */
export function leadsListSummary(t: T, facts: LeadsListSummaryFacts): TranslatedText {
  if (facts.filtersOn > 0) {
    return t(LIST.summaryFiltered, { matching: facts.matching, filters: facts.filtersOn });
  }
  return facts.waiting === null || facts.waiting === 0
    ? t(LIST.summaryOpen, { open: facts.open })
    : t(LIST.summaryWaiting, { open: facts.open, waiting: facts.waiting });
}

/** A task's word: its kind's, a custom task's own, or a kind a newer server learned as sent. */
function taskWord(t: T, task: string, title: string | null): TranslatedText {
  if (task === 'custom' && title !== null) return shownAsSent(title);
  const known = TASK_KINDS.find((kind): kind is TaskKind => kind === task);
  return known === undefined ? shownAsSent(task.replace(/_/g, ' ')) : t(TASK_KIND_WORD[known]);
}

/** What comes next on a lead, worded on the tenant's calendar — `null` when nothing does. */
function nextWord(t: T, next: LeadRowNext, clock: LeadsListClock): TranslatedText | null {
  const { pack, language, now } = clock;
  switch (next.kind) {
    case 'snoozed':
      return leadStateLabel(
        t,
        'snoozed',
        next.wakeOn === null ? null : formatDayMonth(pack, next.wakeOn, language),
      );
    case 'dormant':
      return t(LIST.quiet, { days: next.quietDays });
    case 'tries':
      return t(LEAD_DETAIL.tries, { count: next.count });
    case 'task': {
      const task = taskWord(t, next.task, next.title);
      if (next.overdue) return t(LIST.taskOverdue, { task });
      return isTenantToday(pack, next.dueAt, now)
        ? t(LIST.taskAt, { task, time: formatClockAt(pack, next.dueAt) })
        : t(LIST.taskOn, { task, day: formatDayMonth(pack, next.dueAt, language) });
    }
    case 'none':
      return null;
  }
}

/** The whose control's value that opens the inbox rather than choosing whose leads to list. */
export const LEADS_INBOX_CHOICE = 'inbox';

/** What the whose control offers: the scopes the reader may choose, and the inbox beside them. */
export interface LeadsWhoseFacts {
  readonly whoseChoices: readonly LeadsWhose[];
  readonly inboxOffered: boolean;
  /** Waiting in the inbox; null while it is not read. */
  readonly inboxWaiting: number | null;
}

/** Each scope by its word, then the inbox with how many wait in it when that is known. */
function whoseOptionsOf(t: T, facts: LeadsWhoseFacts) {
  const scopes = facts.whoseChoices.map((whose) => ({ value: whose, label: t(LIST[whose]) }));
  if (!facts.inboxOffered) return scopes;
  const waiting = facts.inboxWaiting === null ? {} : { count: facts.inboxWaiting };
  return [...scopes, { value: LEADS_INBOX_CHOICE, label: t(LIST.inbox), ...waiting }];
}

/** The list's words; each row's next step on the reader's calendar. */
export function leadsListWords(t: T, clock: LeadsListClock) {
  const stage = (one: LeadStage) => t(LEAD_STAGE_WORD[one]);
  return {
    title: t(LIST.title),
    loading: t(LIST.loading),
    failedTitle: t(LIST.failedTitle),
    failedMessage: t(LIST.failedMessage),
    retry: t(LIST.retry),
    firstRunSummary: t(LIST.firstRunSummary),
    summary: (facts: LeadsListSummaryFacts) => leadsListSummary(t, facts),
    whoseLabel: t(LIST.whoseLabel),
    inbox: t(LIST.inbox),
    inboxSpoken: (count: number) => t(LIST.inboxSpoken, { count }),
    whoseOptions: (facts: LeadsWhoseFacts) => whoseOptionsOf(t, facts),
    meter: (open: number) => ({
      heading: t(LIST.pipeline, { open }),
      hint: t(LIST.pipelineHint),
      stage,
      spoken: (one: LeadStage, count: number) => t(LIST.stageSpoken, { stage: stage(one), count }),
    }),
    filters: t(LIST.filters),
    dormant: t(LIST.dormant),
    /** The Bill chip's words by the order the list is in. */
    bill: (sort: LeadsListSort) =>
      sort.key !== 'monthly_bill'
        ? t(LIST.bill)
        : t(sort.order === 'desc' ? LIST.billLargest : LIST.billSmallest),
    source: t(LIST.source),
    /** The source menu's choices: any source, then each by its word. */
    sourceChoices: [
      { key: 'any', label: t(LIST.anySource), source: null },
      ...LEAD_SOURCES.map((one: LeadSource) => ({
        key: one,
        label: leadSourceWord(t, one),
        source: one,
      })),
    ],
    sourceWord: (source: string) => leadSourceWord(t, source),
    search: t(LIST.search),
    searchHint: t(LIST.searchHint),
    clearSearch: t(LIST.clearSearch),
    selected: t(LIST.selected),
    addLead: t(LIST.addLead),
    import: t(LIST.import),
    columns: {
      lead: t(LIST.lead),
      stage: t(LIST.stage),
      source: t(LIST.source),
      bill: t(LIST.monthlyBill),
      owner: t(LIST.owner),
      next: t(LIST.next),
      lastActivity: t(LIST.lastActivity),
    },
    row: {
      noName: t(LEAD_DETAIL.noName),
      noCity: t(LEAD_DETAIL.noCity),
      noBill: t(LIST.noBill),
      noOwner: t(LEAD_DETAIL.noOwner),
      stage,
      track: stageTrackWords(t),
      open: (name: string | null) =>
        name === null ? t(LIST.openThis) : t(LIST.openNamed, { name }),
    },
    next: (next: LeadRowNext) => nextWord(t, next, clock),
    lastActivity: (elapsedMs: number) => lastContactWord(t, elapsedMs),
    firstRun: {
      title: t(LIST.firstRunTitle),
      body: t(LIST.firstRunBody),
      add: t(LIST.addALead),
      import: t(LIST.importAFile),
    },
    noMatch: {
      title: t(LIST.noMatchTitle),
      body: t(LIST.noMatchBody),
      clear: t(LIST.clearFilters),
    },
    showMore: (count: number) => t(LIST.showMore, { count }),
    loadingMore: t(LIST.loadingMore),
  };
}

export type LeadsListWords = ReturnType<typeof leadsListWords>;
