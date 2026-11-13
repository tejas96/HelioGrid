import type { CalendarDate } from '../format/holidays';
import { calendarDayAfter } from '../format/zone';
import {
  type BoardManager,
  boardManagersOf,
  boardRowsOrdered,
  type ProjectBoardSort,
  runBy,
} from './board-order';
import { needsYouOf, type TodoKind } from './needs-you';
import { PROJECT_STAGE_CHAIN, type ProjectChainStage } from './stages';
import { BLOCKER_PARTIES, type BlockerParty, type BlockerReason } from './vocabulary';
import { daysFrom } from './waits';

/**
 * The board as both platforms draw it (`SCR-M08-01`, ruling 2026-11-10): what needs the person —
 * the acts only they can do, then the waits by party with the company's own first — and every live
 * project by stage, oldest first, each with its days. The stage rail on the desktop and the stage
 * sheet on the phone read the same stops. Nothing here is on a clock and nothing is a % (`M08-12`,
 * `M08-13`).
 */

/** One project as the board reads it — the wire's card, by shape. */
export interface BoardCard {
  readonly id: string;
  readonly number: string;
  readonly name: string | null;
  readonly place: string | null;
  readonly stage: string;
  readonly enteredOn: CalendarDate;
  readonly manager: { readonly userId: string; readonly name: string };
  readonly expectedInstallOn: CalendarDate | null;
  readonly steps: { readonly ticked: number; readonly total: number };
  readonly wait: {
    readonly party: string;
    readonly reason: string;
    readonly startedOn: CalendarDate;
  } | null;
  readonly todo: string | null;
  readonly earlyProofTo: string | null;
  /** What the early proof is: a checklist row's key, or an install step's proof key. */
  readonly earlyProofBy?: string | null;
  readonly missingProofRow: string | null;
  /** The company day the install finished; null before. */
  readonly installedOn?: CalendarDate | null;
  /** The part to collect now, for a reader who sees money — the money reason's line. */
  readonly money?: {
    readonly duePart: {
      readonly label: string;
      readonly outstanding: string;
      readonly dueOn: CalendarDate;
    } | null;
  } | null;
}

/** The board's own read: the company's day, the stage counts and every live card. */
export interface BoardFacts {
  readonly today: CalendarDate;
  readonly stages: readonly {
    readonly stage: string;
    readonly count: number;
    readonly oldestEnteredOn: CalendarDate | null;
  }[];
  readonly live: readonly BoardCard[];
}

/** A card with its days in stage, counted on the company's day (`M08-11`). */
export interface BoardRow {
  readonly card: BoardCard;
  readonly days: number;
}

export interface TodoRow extends BoardRow {
  readonly kind: TodoKind;
}

export interface WaitRow extends BoardRow {
  /** Days since the wait began — the figure a waiting row shows. */
  readonly waitDays: number;
}

export interface WaitGroup {
  readonly party: BlockerParty;
  readonly rows: readonly WaitRow[];
}

/** One stop of the rail or the sheet: a stage, how many stand in it, the longest there. */
export interface StageStop {
  readonly stage: ProjectChainStage;
  readonly count: number;
  /** Days of the longest stay; null with none in the stage. */
  readonly longestDays: number | null;
  readonly chosen: boolean;
  /**
   * The handed-over stop counts the last 30 days, not a stay (the picked design): a closed project
   * has no days in a stage to show.
   */
  readonly recent: boolean;
}

/** How long the handed-over stop looks back — the server counts it, the stop says it. */
export const HANDED_OVER_RECENT_DAYS = 30;

/** The first company day the handed-over stop looks back to from `today`. */
export function handedOverSince(today: CalendarDate): CalendarDate {
  return calendarDayAfter(today, -HANDED_OVER_RECENT_DAYS);
}

/** What the person chose to see: a stage, a search, and whether they may act at all. */
export interface BoardChoice {
  readonly stage: ProjectChainStage | null;
  /** Typed into the board's search: a name, a place or a project number. Blank shows all. */
  readonly searched: string;
  /** The reader may move projects on; a reader who only reads (`M08-18`) has nothing to do here. */
  readonly canAct: boolean;
  /** The handed-over projects, read only while that stop is chosen; null otherwise. */
  readonly handedOver: readonly BoardCard[] | null;
  readonly sort: ProjectBoardSort;
  /** One manager's projects, by their user id; null shows everyone's. */
  readonly manager: string | null;
}

export interface StageGroup {
  readonly stage: ProjectChainStage;
  readonly rows: readonly BoardRow[];
  readonly longestDays: number | null;
}

export interface ProjectBoardView {
  readonly today: CalendarDate;
  readonly liveCount: number;
  /** The hero's figures — the whole board, whatever the search. */
  readonly todoCount: number;
  readonly waitCount: number;
  /** *To do* and *Waiting* as the search finds them. */
  readonly todo: readonly TodoRow[];
  readonly waits: readonly WaitGroup[];
  readonly stops: readonly StageStop[];
  /** The live projects by stage — one group when a stage is chosen, every stage with one otherwise. */
  readonly groups: readonly StageGroup[];
  readonly chosen: ProjectChainStage | null;
  /** The search as typed; a search that finds nothing says so. */
  readonly searched: string;
  /** Nothing to do and nothing waited on: the board says so (ruling 2026-11-10). */
  readonly allClear: boolean;
  readonly sort: ProjectBoardSort;
  readonly manager: string | null;
  /** Every manager of a live project, to narrow the lists to one. */
  readonly managers: readonly BoardManager[];
}

/** Whether a card answers the search: its name, its place or its number holds what was typed. */
function answers(card: BoardCard, searched: string): boolean {
  const needle = searched.trim().toLocaleLowerCase();
  if (needle === '') return true;
  return [card.name, card.place, card.number].some(
    (said) => said?.toLocaleLowerCase().includes(needle) === true,
  );
}

function isChainStage(value: string): value is ProjectChainStage {
  return (PROJECT_STAGE_CHAIN as readonly string[]).includes(value);
}

function isParty(value: string): value is BlockerParty {
  return (BLOCKER_PARTIES as readonly string[]).includes(value);
}

/** What needs the person among these cards: the acts only they can do, and the waits by party. */
function needsOf(cards: readonly BoardCard[], canAct: boolean, today: CalendarDate) {
  const known = needsYouOf(
    cards.map((card) => ({
      card,
      id: card.id,
      enteredOn: card.enteredOn,
      earlyProof: card.todo === 'proof_early',
      missingProof: card.todo === 'proof_missing',
      installDatePassed: card.todo === 'install_date_passed',
      moneyDue: card.todo === 'money_due',
      wait:
        card.wait !== null && isParty(card.wait.party)
          ? {
              party: card.wait.party,
              reason: card.wait.reason as BlockerReason,
              startedOn: card.wait.startedOn,
            }
          : null,
    })),
  );
  const todo: TodoRow[] = canAct
    ? known.todo.map(({ project, kind }) => ({ ...rowOf(project.card, today), kind }))
    : [];
  const waits: WaitGroup[] = known.waits.map((group) => ({
    party: group.party,
    rows: group.projects.map((project) => ({
      ...rowOf(project.card, today),
      waitDays: daysFrom(project.wait?.startedOn ?? today, today),
    })),
  }));
  return { todo, waits, waitCount: waits.reduce((sum, group) => sum + group.rows.length, 0) };
}

function rowOf(card: BoardCard, today: CalendarDate): BoardRow {
  return { card, days: daysFrom(card.enteredOn, today) };
}

/** The stages shown below *All projects*: the chosen one, or every live stage holding a project. */
function groupsOf(
  cards: readonly BoardCard[],
  chosen: ProjectChainStage | null,
  sort: ProjectBoardSort,
  today: CalendarDate,
) {
  const stagesShown =
    chosen === null ? PROJECT_STAGE_CHAIN.filter((stage) => stage !== 'handed_over') : [chosen];
  return stagesShown
    .map((stage) => {
      const rows = cards
        .filter((card) => isChainStage(card.stage) && card.stage === stage)
        .map((card) => rowOf(card, today));
      const longestDays = rows.reduce<number | null>(
        (longest, row) => Math.max(longest ?? row.days, row.days),
        null,
      );
      return { stage, rows: boardRowsOrdered(rows, sort), longestDays };
    })
    .filter((group) => chosen !== null || group.rows.length > 0);
}

/**
 * The board's view of what the person chose: a stage or all, a search or none. The hero counts the
 * whole board; the lists below it show what the search finds.
 */
export function projectBoardViewOf(facts: BoardFacts, choice: BoardChoice): ProjectBoardView {
  const { today } = facts;
  const { stage: chosen, searched, canAct, sort, manager } = choice;
  const shownTo = (card: BoardCard) => answers(card, searched) && runBy(card, manager);
  const everything = needsOf(facts.live, canAct, today);
  const found = needsOf(facts.live.filter(shownTo), canAct, today);
  const stops = PROJECT_STAGE_CHAIN.map((stage) => {
    const counted = facts.stages.find((one) => one.stage === stage);
    return {
      stage,
      count: counted?.count ?? 0,
      longestDays:
        counted?.oldestEnteredOn == null ? null : daysFrom(counted.oldestEnteredOn, today),
      chosen: stage === chosen,
      recent: stage === 'handed_over',
    };
  });
  const shown = chosen === 'handed_over' ? (choice.handedOver ?? []) : facts.live;
  return {
    today,
    liveCount: facts.live.length,
    todoCount: everything.todo.length,
    waitCount: everything.waitCount,
    todo: found.todo,
    waits: found.waits,
    stops,
    groups: groupsOf(shown.filter(shownTo), chosen, sort, today),
    chosen,
    searched,
    allClear: everything.todo.length === 0 && everything.waitCount === 0,
    sort,
    manager,
    managers: boardManagersOf(facts.live),
  };
}
