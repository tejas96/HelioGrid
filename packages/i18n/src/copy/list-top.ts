/**
 * The words of the top every list page shares (`packages/ui`'s `ListTop`): the summary hero's
 * figures and their spoken phrases, the order's sheet and its choices, and the filter body's
 * dimensions — for the Leads list (`SCR-M02-03`) and the Projects board (`SCR-M08-01`).
 */
import type { TranslatedText } from '@heliogrid/contracts';
import {
  formatDayMonth,
  formatWeekday,
  LEAD_SOURCES,
  type LeadSource,
  type LeadStage,
  type ProjectBoardSort,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { LEAD_STAGE_WORD } from './crm-vocabulary';
import { filterBarWords } from './filter-bar';
import { filterPanelWords } from './filter-panel';
import { leadSourceWord } from './lead-marks';
import type { LeadsListClock } from './leads-list';

type T = Translator['t'];

const TOP = {
  close: /*i18n*/ { id: 'Close' },
  sortNamed: /*i18n*/ { id: 'Sort: {order}' },
  stages: /*i18n*/ { id: 'Stages' },
  all: /*i18n*/ { id: 'All' },
  newest: /*i18n*/ { id: 'Newest first' },
  today: /*i18n*/ { id: 'Today · {weekday}, {date}' },
} as const;

const LEADS_TOP = {
  name: /*i18n*/ { id: 'Your leads at a glance' },
  open: /*i18n*/ { id: 'open leads' },
  openSpoken: /*i18n*/ { id: '{count, plural, one {# open lead} other {# open leads}}' },
  inbox: /*i18n*/ { id: 'in the inbox' },
  inboxSpoken: /*i18n*/ {
    id: '{count, plural, one {# lead waiting in the inbox, open the inbox} other {# leads waiting in the inbox, open the inbox}}',
  },
  dormant: /*i18n*/ { id: 'dormant' },
  dormantSpoken: /*i18n*/ {
    id: '{count, plural, one {# dormant lead, show it} other {# dormant leads, show them}}',
  },
  sortTitle: /*i18n*/ { id: 'Sort leads' },
  billLargest: /*i18n*/ { id: 'Bill, largest first' },
  billSmallest: /*i18n*/ { id: 'Bill, smallest first' },
  lastActivity: /*i18n*/ { id: 'Latest activity first' },
  source: /*i18n*/ { id: 'Source' },
  anySource: /*i18n*/ { id: 'Any source' },
  dormantFilter: /*i18n*/ { id: 'Dormant' },
  dormantOnly: /*i18n*/ { id: 'Only dormant leads' },
} as const;

const BOARD_TOP = {
  name: /*i18n*/ { id: 'Your projects at a glance' },
  live: /*i18n*/ { id: 'live projects' },
  liveSpoken: /*i18n*/ { id: '{count, plural, one {# live project} other {# live projects}}' },
  toDo: /*i18n*/ { id: 'to do' },
  toDoSpoken: /*i18n*/ { id: '{count, plural, one {# to do} other {# to do}}' },
  waiting: /*i18n*/ { id: 'waiting' },
  waitingSpoken: /*i18n*/ {
    id: '{count, plural, one {# waiting on others} other {# waiting on others}}',
  },
  sortTitle: /*i18n*/ { id: 'Sort projects' },
  longest: /*i18n*/ { id: 'Longest in stage first' },
  install: /*i18n*/ { id: 'Install date, soonest first' },
  manager: /*i18n*/ { id: 'Manager' },
  anyManager: /*i18n*/ { id: 'Any manager' },
} as const;

/** The words every list top says, whichever list it heads. */
function listTopShared(t: T) {
  const bar = filterBarWords(t);
  return {
    close: t(TOP.close),
    sortNamed: (order: TranslatedText) => t(TOP.sortNamed, { order }),
    stages: t(TOP.stages),
    all: t(TOP.all),
    newest: t(TOP.newest),
    filters: bar.filters,
    filtersActive: bar.filtersActive,
    panel: filterPanelWords(t),
  };
}

/** The Leads list's top: its day, its figures, its four orders, and the source and dormant filters. */
export function leadsListTopWords(t: T, clock: LeadsListClock) {
  const { pack, language, now } = clock;
  return {
    ...listTopShared(t),
    today: t(TOP.today, {
      weekday: formatWeekday(pack, now, language),
      date: formatDayMonth(pack, now, language),
    }),
    name: t(LEADS_TOP.name),
    open: t(LEADS_TOP.open),
    openSpoken: (count: number) => t(LEADS_TOP.openSpoken, { count }),
    inbox: t(LEADS_TOP.inbox),
    inboxSpoken: (count: number) => t(LEADS_TOP.inboxSpoken, { count }),
    dormant: t(LEADS_TOP.dormant),
    dormantSpoken: (count: number) => t(LEADS_TOP.dormantSpoken, { count }),
    sortTitle: t(LEADS_TOP.sortTitle),
    billLargest: t(LEADS_TOP.billLargest),
    billSmallest: t(LEADS_TOP.billSmallest),
    lastActivity: t(LEADS_TOP.lastActivity),
    stage: (stage: LeadStage) => t(LEAD_STAGE_WORD[stage]),
    source: t(LEADS_TOP.source),
    anySource: t(LEADS_TOP.anySource),
    sourceWord: (source: LeadSource) => leadSourceWord(t, source),
    sources: LEAD_SOURCES,
    dormantFilter: t(LEADS_TOP.dormantFilter),
    dormantOnly: t(LEADS_TOP.dormantOnly),
  };
}

export type LeadsListTopWords = ReturnType<typeof leadsListTopWords>;

/** The Projects board's top: its figures, its three orders, and the manager filter. */
export function projectBoardTopWords(t: T) {
  const shared = listTopShared(t);
  const order: Record<ProjectBoardSort, TranslatedText> = {
    longest: t(BOARD_TOP.longest),
    install: t(BOARD_TOP.install),
  };
  return {
    ...shared,
    name: t(BOARD_TOP.name),
    live: t(BOARD_TOP.live),
    liveSpoken: (count: number) => t(BOARD_TOP.liveSpoken, { count }),
    toDo: t(BOARD_TOP.toDo),
    toDoSpoken: (count: number) => t(BOARD_TOP.toDoSpoken, { count }),
    waiting: t(BOARD_TOP.waiting),
    waitingSpoken: (count: number) => t(BOARD_TOP.waitingSpoken, { count }),
    sortTitle: t(BOARD_TOP.sortTitle),
    order,
    manager: t(BOARD_TOP.manager),
    anyManager: t(BOARD_TOP.anyManager),
    person: (name: string) => shownAsSent(name),
  };
}

export type ProjectBoardTopWords = ReturnType<typeof projectBoardTopWords>;
