import type { CalendarDate } from '../format/holidays';

/**
 * How the board's list of projects is ordered and narrowed (`SCR-M08-01`, the list-page top both
 * lists share): longest in its stage first — the board's own order, so an aged project rises
 * (`M08-12`) — or the nearest install first; and one manager's projects or everyone's. No order
 * puts the longest stay last.
 */
export const PROJECT_BOARD_SORTS = ['longest', 'install'] as const;
export type ProjectBoardSort = (typeof PROJECT_BOARD_SORTS)[number];

/** The board opens longest in its stage first: what has waited most is what needs a push. */
export const PROJECT_BOARD_FIRST_SORT: ProjectBoardSort = 'longest';

/** One manager the board's live projects name, with how many of them they run. */
export interface BoardManager {
  readonly userId: string;
  readonly name: string;
  readonly count: number;
}

/** What ordering reads of a board row — the board's own rows satisfy it. */
interface OrderedRow {
  readonly days: number;
  readonly card: { readonly id: string; readonly expectedInstallOn: CalendarDate | null };
}

/** What the manager filter reads of a card — the board's own cards satisfy it. */
interface ManagedCard {
  readonly manager: { readonly userId: string; readonly name: string };
}

function byInstall(a: OrderedRow, b: OrderedRow): number {
  const first = a.card.expectedInstallOn;
  const second = b.card.expectedInstallOn;
  if (first === second) return 0;
  if (first === null) return 1;
  if (second === null) return -1;
  return first < second ? -1 : 1;
}

const ORDER: Record<ProjectBoardSort, (a: OrderedRow, b: OrderedRow) => number> = {
  longest: (a, b) => b.days - a.days,
  install: (a, b) => byInstall(a, b) || b.days - a.days,
};

/** The rows in the chosen order; a tie keeps one fixed order, by the project's id. */
export function boardRowsOrdered<Row extends OrderedRow>(
  rows: readonly Row[],
  sort: ProjectBoardSort,
): readonly Row[] {
  return [...rows].sort((a, b) => ORDER[sort](a, b) || a.card.id.localeCompare(b.card.id));
}

/** Every manager the cards name, A to Z, each with their count. */
export function boardManagersOf(cards: readonly ManagedCard[]): readonly BoardManager[] {
  const counted = new Map<string, BoardManager>();
  for (const { manager } of cards) {
    const known = counted.get(manager.userId);
    counted.set(manager.userId, {
      userId: manager.userId,
      name: manager.name,
      count: (known?.count ?? 0) + 1,
    });
  }
  return [...counted.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId),
  );
}

/** Whether a card is in the chosen manager's hands; no manager chosen keeps every card. */
export function runBy(card: ManagedCard, manager: string | null): boolean {
  return manager === null || card.manager.userId === manager;
}
