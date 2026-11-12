import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BlockerParty,
  BoardCard,
  BoardRow,
  ProjectBoardView,
  StageGroup,
  TodoKind,
  TodoRow,
  WaitGroup,
} from '@heliogrid/domain';
import type { RefObject } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import type { StatusTone } from '../../primitives/StatusMark';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type {
  ProjectRowItem,
  ProjectRowKind,
  ProjectRowMark,
} from '../ProjectRows/ProjectRows.types';
import type { ProjectBoardProps, ProjectBoardWords } from './ProjectBoard.types';

/** The room the board lays itself out for: the phone's one column, or the desk's two. */
export type BoardRoom = 'narrow' | 'wide';

/** How many rows each list shows before *Show more*, in each room (the picked design). */
export const BOARD_CAPS: Readonly<
  Record<BoardRoom, { readonly todo: number; readonly perParty: number }>
> = {
  narrow: { todo: 6, perParty: 3 },
  wide: { todo: 5, perParty: 2 },
};
/** A stage's rows on the narrow board, and the table's rows on the wide one. */
export const STAGE_CAP = 4;
export const TABLE_CAP = 14;

/** How each ask reads: an early proof is good news, a missing one a gap, a promise passed a problem. */
export const TODO_TONE: Readonly<Record<TodoKind, StatusTone>> = {
  proof_early: 'accent',
  proof_missing: 'warning',
  install_date_passed: 'danger',
  money_due: 'warning',
};

/** Each ask's tile: a date passed on the calendar, an early proof's spark, a missing file, money due. */
export const TODO_TILE: Readonly<Record<TodoKind, ProjectRowKind>> = {
  install_date_passed: { glyph: 'calendar', tint: 'danger' },
  proof_early: { glyph: 'spark', tint: 'teal' },
  proof_missing: { glyph: 'file', tint: 'warning' },
  money_due: { glyph: 'rupee', tint: 'warning' },
};

/** Who a wait is on, as its group's glyph: the company's building, a person, the grid, the goods. */
export const PARTY_GLYPH: Readonly<Record<BlockerParty, ShellGlyphName>> = {
  company: 'building',
  customer: 'person',
  utility: 'bolt',
  material: 'package',
};

/** The one act a to-do row offers is the primary one only for the early proof's move. */
export function isPrimaryTodo(kind: TodoKind): boolean {
  return kind === 'proof_early';
}

function isTodoKind(value: string | null): value is TodoKind {
  return value !== null && value in TODO_TONE;
}

/** The state a project's row carries: its wait, else what it asks; none for a project moving along. */
export function cardMark(card: BoardCard, words: ProjectBoardWords): ProjectRowMark | null {
  if (card.wait !== null) return { tone: 'warning', label: words.waitingOn(card.wait.party) };
  if (isTodoKind(card.todo))
    return { tone: TODO_TONE[card.todo], label: words.todoKind(card.todo) };
  return null;
}

/** A stage group's quiet line: its longest stay, or the handed-over stop's look back. */
export function groupLineOf(
  view: ProjectBoardView,
  group: StageGroup,
  words: ProjectBoardWords,
): TranslatedText | null {
  const recent = view.stops.find((stop) => stop.stage === group.stage)?.recent ?? false;
  return group.rows.length === 0
    ? null
    : words.stopLine({ longestDays: group.longestDays, recent });
}

/** A search typed that finds no project anywhere on the board. */
export function searchMissed(view: ProjectBoardView): boolean {
  return (
    view.searched.trim() !== '' &&
    view.todo.length === 0 &&
    view.waits.length === 0 &&
    view.groups.every((group) => group.rows.length === 0)
  );
}

/** The rows a list shows: all once opened, else the first `cap`, and *Show N more* for the rest. */
export function cappedOf<T>(
  rows: readonly T[],
  cap: number,
  open: boolean,
): { readonly shown: readonly T[]; readonly held: number } {
  if (open || rows.length <= cap) return { shown: rows, held: 0 };
  return { shown: rows.slice(0, cap), held: rows.length - cap };
}

/** *Show N more* as a card's last line, when rows are held back. */
function moreOf(
  key: string,
  count: number,
  held: Held,
  words: ProjectBoardWords,
): ProjectRowItem[] {
  if (count === 0) return [];
  const more = { label: words.showMore(count), onPress: held.onMore, focusAfter: held.reveal };
  return [{ kind: 'more', key: `${key}-more`, more }];
}

/** A card's held-back rows: whether they are in, the press that lets them in, the first one in. */
export interface Held {
  readonly open: boolean;
  readonly onMore: () => void;
  /** The first row *Show more* let in: the focus lands on it once the button has gone. */
  readonly reveal: RefObject<FocusHandle | null>;
}

/** The first row past the cap takes the focus handle once the rows are in. */
function revealAt(index: number, cap: number, held: Held) {
  return held.open && index === cap ? held.reveal : undefined;
}

/** *To do*: each project's ask as its tile and line, and beside it the one act that answers it. */
export function todoItemsOf(
  rows: readonly TodoRow[],
  cap: number,
  held: Held,
  { words, onOpen, onTodo, openId }: ProjectBoardProps,
): ProjectRowItem[] {
  const { shown, held: count } = cappedOf(rows, cap, held.open);
  const items = shown.map(
    (row, index): ProjectRowItem => ({
      kind: 'row',
      key: row.card.id,
      row: {
        first: index === 0,
        name: row.card.name,
        line: words.todoLine(row.kind, row.card),
        kind: TODO_TILE[row.kind],
        mark: null,
        days: null,
        manager: null,
        act: {
          label: words.todoAct(row.kind),
          spoken: words.todoActSpoken(row.kind, row.card.name ?? row.card.number),
          primary: isPrimaryTodo(row.kind),
          onPress: () => onTodo(row),
        },
        chevron: false,
        highlighted: openId === row.card.id,
        targetRef: revealAt(index, cap, held),
        onOpen: () => onOpen(row.card.id),
        words,
      },
    }),
  );
  return [...items, ...moreOf('todo', count, held, words)];
}

/** *Waiting*: each waited-on party's head, then the first few waiting on it, oldest first. */
export function waitItemsOf(
  groups: readonly WaitGroup[],
  perParty: number,
  held: Held,
  { words, onOpen }: ProjectBoardProps,
): ProjectRowItem[] {
  let hidden = 0;
  /* The first party holding more than its cap holds the first row *Show more* lets in. */
  const revealing = groups.find((group) => group.rows.length > perParty)?.party;
  const items = groups.flatMap((group, groupIndex): ProjectRowItem[] => {
    const { shown, held: count } = cappedOf(group.rows, perParty, held.open);
    hidden += count;
    const cap = group.party === revealing ? perParty : -1;
    return [
      {
        kind: 'group',
        key: group.party,
        group: {
          first: groupIndex === 0,
          kind: { glyph: PARTY_GLYPH[group.party], tint: 'warning' },
          label: words.waitingOn(group.party),
          count: group.rows.length,
        },
      },
      ...shown.map(
        (row, index): ProjectRowItem => ({
          kind: 'row',
          key: row.card.id,
          row: {
            first: false,
            name: row.card.name,
            line:
              row.card.wait === null
                ? words.stage(row.card.stage)
                : words.waitLine(row.card.wait.reason, row.card.wait.startedOn),
            kind: null,
            mark: null,
            days: words.days(row.waitDays),
            manager: null,
            act: null,
            chevron: true,
            targetRef: revealAt(index, cap, held),
            onOpen: () => onOpen(row.card.id),
            words,
          },
        }),
      ),
    ];
  });
  return [...items, ...moreOf('waits', hidden, held, words)];
}

/** A stage's projects: each with its state, its days and its manager; the open one chosen. */
export function stageItemsOf(
  rows: readonly BoardRow[],
  held: Held,
  { words, onOpen, openId }: ProjectBoardProps,
): ProjectRowItem[] {
  const { shown, held: count } = cappedOf(rows, STAGE_CAP, held.open);
  const items = shown.map(
    (row, index): ProjectRowItem => ({
      kind: 'row',
      key: row.card.id,
      row: {
        first: index === 0,
        name: row.card.name,
        line: words.cardLine(row.card),
        kind: null,
        mark: cardMark(row.card, words),
        days: words.days(row.days),
        manager: row.card.manager.name,
        act: null,
        chevron: false,
        highlighted: openId === row.card.id,
        targetRef: revealAt(index, STAGE_CAP, held),
        onOpen: () => onOpen(row.card.id),
        words,
      },
    }),
  );
  return [...items, ...moreOf('stage', count, held, words)];
}
