/**
 * The Projects board (`SCR-M08-01`): every word it says, for both platforms. A stage, a party, a reason, a
 * checklist row and an install step are the market pack's words (`format.word`), never these.
 */

import type { TranslatedText } from '@heliogrid/contracts';
import {
  type FormatPack,
  formatDayMonth,
  formatWeekday,
  HANDED_OVER_RECENT_DAYS,
  PROJECT_STAGE_CHAIN,
  type TodoKind,
  type UiLanguage,
} from '@heliogrid/domain';
import { type MessageRef, projectPackWords, type Translator } from '../runtime';
import { assembled } from './assembled';
import { SHELL } from './shell';

type T = Translator['t'];
/** The market's word for a stage, party, reason, row or step, in the reader's language. */
export type PackWord = (
  kind: 'stage' | 'party' | 'reason' | 'row' | 'step',
  key: string,
) => TranslatedText;

/** A project read that did not come back, on every project screen. */
export const PROJECT_FAILED_MESSAGE = /*i18n*/ { id: 'Check the connection and try again.' };

const BOARD = {
  title: /*i18n*/ { id: 'Projects' },
  today: /*i18n*/ { id: 'Today · {weekday}, {date}' },
  waiting: /*i18n*/ { id: 'waiting' },
  toDoHeading: /*i18n*/ { id: 'To do' },
  waitingHeading: /*i18n*/ { id: 'Waiting' },
  oldestFirst: /*i18n*/ { id: 'oldest first' },
  allProjects: /*i18n*/ { id: 'All projects' },
  allLiveProjects: /*i18n*/ { id: 'All live projects' },
  byStage: /*i18n*/ { id: 'by stage, oldest first' },
  longest: /*i18n*/ { id: 'longest {days}' },
  lastDays: /*i18n*/ { id: '{count, plural, one {last # day} other {last # days}}' },
  noneInStage: /*i18n*/ { id: 'No project at {stage}' },
  showMore: /*i18n*/ { id: 'Show {count} more' },
  clearStage: /*i18n*/ { id: 'Clear stage' },
  waitingOn: /*i18n*/ { id: 'Waiting on {party}' },
  waitLine: /*i18n*/ { id: '{reason} · since {date}' },
  installBy: /*i18n*/ { id: 'install by {date}' },
  installByShort: /*i18n*/ { id: 'by {date}' },
  stepsOf: /*i18n*/ { id: '{ticked} of {total} steps' },
  allClearTitle: /*i18n*/ { id: 'Nothing needs you' },
  emptyTitle: /*i18n*/ { id: 'No projects yet' },
  emptyBody: /*i18n*/ { id: 'Mark a lead won and its project starts here, at Won.' },
  failedTitle: /*i18n*/ { id: 'The projects did not load' },
  failedMessage: PROJECT_FAILED_MESSAGE,
  loading: /*i18n*/ { id: 'Loading projects' },
  stage: /*i18n*/ { id: 'Stage' },
  project: /*i18n*/ { id: 'Project' },
  daysHere: /*i18n*/ { id: 'Days here' },
  install: /*i18n*/ { id: 'Install' },
  manager: /*i18n*/ { id: 'Manager' },
  status: /*i18n*/ { id: 'Status' },
  open: /*i18n*/ { id: 'Open {name}' },
  noName: /*i18n*/ { id: 'No name yet' },
  searchPlaceholder: /*i18n*/ { id: 'Name, place or number' },
  searchOpen: /*i18n*/ { id: 'Search projects' },
  clearSearch: /*i18n*/ { id: 'Clear search' },
  noMatch: /*i18n*/ { id: 'No project matches “{text}”' },
} satisfies Record<string, MessageRef>;

/** A days figure, the board's and a project's. */
export const PROJECT_DAYS = /*i18n*/ {
  id: '{count, plural, =0 {today} one {# day} other {# days}}',
};

/** What a to-do asks, as its mark says it. */
const TODO_KIND: Record<TodoKind, MessageRef> = {
  proof_early: /*i18n*/ { id: 'Proof came early' },
  proof_missing: /*i18n*/ { id: 'Proof missing' },
  install_date_passed: /*i18n*/ { id: 'Install date passed' },
  money_due: /*i18n*/ { id: 'Money due' },
};
/** A to-do row's line: what happened, in the project's own facts. */
/** An early proof that is a checklist row names the row, as the design reads it. */
const ROW_CAME_EARLY: MessageRef = /*i18n*/ { id: '{row} came early' };

const TODO_LINE: Record<TodoKind, MessageRef> = {
  proof_early: /*i18n*/ { id: 'Proof for {stage} came early' },
  proof_missing: /*i18n*/ { id: '{stage} by hand · {row} missing' },
  install_date_passed: /*i18n*/ { id: 'Install by {date} has passed · still {stage}' },
  money_due: /*i18n*/ { id: '{part} · {amount} to collect' },
};
const TODO_ACT: Record<TodoKind, MessageRef> = {
  proof_early: /*i18n*/ { id: 'Move' },
  proof_missing: /*i18n*/ { id: 'Upload' },
  install_date_passed: /*i18n*/ { id: 'New date' },
  money_due: /*i18n*/ { id: 'Ask' },
};

/** The act as a screen reader says it: which project it acts on, among a list of the same buttons. */
const TODO_ACT_SPOKEN: Record<TodoKind, MessageRef> = {
  proof_early: /*i18n*/ { id: 'Move: {name}' },
  proof_missing: /*i18n*/ { id: 'Upload: {name}' },
  install_date_passed: /*i18n*/ { id: 'New date: {name}' },
  money_due: /*i18n*/ { id: 'Ask for money: {name}' },
};

/** What a project's own line and its install cell are made of. */
export interface BoardLineFacts {
  readonly stage: string;
  readonly place: string | null;
  readonly steps: { readonly ticked: number; readonly total: number };
  readonly expectedInstallOn: string | null;
  /** The day the install finished — the table's *Install* cell after Installation. */
  readonly installedOn?: string | null;
}

/** A to-do row's facts: its stage, what its proof reached, the row it waits on, its promise. */
export interface BoardTodoFacts {
  readonly stage: string;
  readonly earlyProofTo: string | null;
  /** The early proof's key: a checklist row the pack names, or an install step's proof. */
  readonly earlyProofBy?: string | null;
  readonly missingProofRow: string | null;
  readonly expectedInstallOn: string | null;
  /** The part due and what it owes, the amount already formatted — the money reason's line. */
  readonly money?: { readonly part: string; readonly amount: string } | null;
}

/** Where a stage sits against Installation: before it the install is a promise, after it done. */
function installPhaseOf(stage: string): 'before' | 'at' | 'after' {
  const at = PROJECT_STAGE_CHAIN.indexOf('installation');
  const here = (PROJECT_STAGE_CHAIN as readonly string[]).indexOf(stage);
  if (here === at) return 'at';
  return here === -1 || here > at ? 'after' : 'before';
}

/** The board's words, built once per render on the company's market and the reader's language. */
export function projectBoardWords(t: T, pack: FormatPack, language: UiLanguage) {
  const word: PackWord = projectPackWords(pack, language);
  const day = (date: string) => formatDayMonth(pack, date, language);
  const steps = (card: BoardLineFacts) =>
    card.steps.total > 0
      ? t(BOARD.stepsOf, { ticked: card.steps.ticked, total: card.steps.total })
      : null;
  /**
   * The install fact a project shows: the promise before Installation, the ticks at it, and in the
   * table the day it finished after it — a card line after Installation says none.
   */
  const installOf = (card: BoardLineFacts, promise: MessageRef, done: boolean) => {
    const phase = installPhaseOf(card.stage);
    if (phase === 'at') return steps(card);
    if (phase === 'after')
      return done && card.installedOn ? assembled(day(card.installedOn)) : null;
    if (card.expectedInstallOn === null) return null;
    return t(promise, { date: day(card.expectedInstallOn) });
  };
  /** A row the pack names is the proof's own word; a tick is told by the stage it proves. */
  const earlyLineOf = (facts: BoardTodoFacts) => {
    const by = facts.earlyProofBy ?? null;
    const row = by === null ? null : word('row', by);
    return row !== null && row !== by
      ? t(ROW_CAME_EARLY, { row })
      : t(TODO_LINE.proof_early, { stage: word('stage', facts.earlyProofTo ?? '') });
  };
  return {
    title: t(BOARD.title),
    today: (date: string) =>
      t(BOARD.today, { weekday: formatWeekday(pack, date, language), date: day(date) }),
    waiting: t(BOARD.waiting),
    toDoHeading: t(BOARD.toDoHeading),
    waitingHeading: t(BOARD.waitingHeading),
    oldestFirst: t(BOARD.oldestFirst),
    allProjects: t(BOARD.allProjects),
    allLiveProjects: t(BOARD.allLiveProjects),
    byStage: t(BOARD.byStage),
    /** A stop's line: the longest stay, the handed-over stop's look back, or none there. */
    stopLine: (stop: { readonly longestDays: number | null; readonly recent: boolean }) =>
      stop.recent
        ? t(BOARD.lastDays, { count: HANDED_OVER_RECENT_DAYS })
        : stop.longestDays === null
          ? null
          : t(BOARD.longest, { days: t(PROJECT_DAYS, { count: stop.longestDays }) }),
    noneInStage: (stage: string) => t(BOARD.noneInStage, { stage: word('stage', stage) }),
    showMore: (count: number) => t(BOARD.showMore, { count }),
    clearStage: t(BOARD.clearStage),
    days: (count: number) => t(PROJECT_DAYS, { count }),
    stage: (stage: string) => word('stage', stage),
    waitingOn: (party: string) => t(BOARD.waitingOn, { party: word('party', party) }),
    waitLine: (reason: string, startedOn: string) =>
      t(BOARD.waitLine, { reason: word('reason', reason), date: day(startedOn) }),
    /** A project's own line: its place, then the install promise or the ticks; null with neither. */
    cardLine: (card: BoardLineFacts) => {
      const parts = [card.place, installOf(card, BOARD.installBy, false)].filter(
        (part) => part !== null,
      );
      return parts.length === 0 ? null : assembled(parts.join(' · '));
    },
    /** The table's *Install* cell: by the promised day, or the ticks at Installation. */
    installCell: (card: BoardLineFacts) => installOf(card, BOARD.installByShort, true),
    todoKind: (kind: TodoKind) => t(TODO_KIND[kind]),
    todoLine: (kind: TodoKind, facts: BoardTodoFacts) =>
      kind === 'proof_early'
        ? earlyLineOf(facts)
        : t(TODO_LINE[kind], {
            stage: word('stage', facts.stage),
            row: word('row', facts.missingProofRow ?? ''),
            date: facts.expectedInstallOn === null ? '' : day(facts.expectedInstallOn),
            part: facts.money?.part ?? '',
            amount: facts.money?.amount ?? '',
          }),
    todoAct: (kind: TodoKind) => t(TODO_ACT[kind]),
    todoActSpoken: (kind: TodoKind, name: string) => t(TODO_ACT_SPOKEN[kind], { name }),
    allClearTitle: t(BOARD.allClearTitle),
    emptyTitle: t(BOARD.emptyTitle),
    emptyBody: t(BOARD.emptyBody),
    failedTitle: t(BOARD.failedTitle),
    failedMessage: t(BOARD.failedMessage),
    loading: t(BOARD.loading),
    retry: t(SHELL.tryAgain),
    table: {
      project: t(BOARD.project),
      stage: t(BOARD.stage),
      daysHere: t(BOARD.daysHere),
      install: t(BOARD.install),
      manager: t(BOARD.manager),
      status: t(BOARD.status),
    },
    search: {
      placeholder: t(BOARD.searchPlaceholder),
      open: t(BOARD.searchOpen),
      clear: t(BOARD.clearSearch),
      noMatch: (text: string) => t(BOARD.noMatch, { text: text.trim() }),
    },
    open: (name: string) => t(BOARD.open, { name }),
    noName: t(BOARD.noName),
    close: t(SHELL.close),
  };
}
export type ProjectBoardCopy = ReturnType<typeof projectBoardWords>;
