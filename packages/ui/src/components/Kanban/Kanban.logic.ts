import type { TranslatedText } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { PendingActionSpec } from '../PendingAction';
import type { ProvenanceProps } from '../Provenance';
import type { SurfaceState } from '../UnavailableNote';
import { surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { KanbanCardItem, KanbanColumn, KanbanProps, KanbanWords } from './Kanban.types';

/** What a board takes when the caller names nothing: 260px columns, and the phone form below 720px. */
export const KANBAN_DEFAULTS = { columnWidth: 260, stackBelow: 720 } as const;

/** Everything that is not the board itself: one of these renders instead of the columns. */
export type KanbanBoardState = Exclude<SurfaceState, 'ready'>;

/**
 * The board's settled state. A caller's `loading`, `error` or `unavailable` outranks the count —
 * a board that has not loaded is not empty — but a READY board with no card in any column is,
 * which is the one answer the caller never has to spell out.
 */
export function resolveBoardState(state: SurfaceState, total: number): SurfaceState {
  return state === 'ready' && total === 0 ? 'empty' : state;
}

/**
 * A card may say its tier as a bare tier or a full spec; `standing` folds into the spec so a
 * provisional figure needs no object. Same merge `Charts` does for its headline.
 */
export function kanbanProvenance(item: KanbanCardItem): ProvenanceProps | null {
  const p = item.provenance;
  const standing = item.standing;
  if (p === undefined) return standing !== undefined ? { standing } : null;
  if (typeof p === 'object') return { standing, ...p };
  return { standing, tier: p };
}

/** The face the board shows: the caller's read, settled against how many cards the board holds. */
export function boardStateOf(read: KanbanProps['read'], columns: KanbanColumn[]): SurfaceState {
  return resolveBoardState(surfaceStateOf(read), kanbanTotal(columns));
}

/** How many cards the whole board holds — `0` is the board's own empty state. */
export function kanbanTotal(columns: KanbanColumn[]): number {
  return columns.reduce((n, c) => n + (c.items ? c.items.length : 0), 0);
}

/** The stage the phone form shows: the caller's pick when it names a real column, else the first. */
export function activeColumnKey(
  columns: KanbanColumn[],
  picked: string | null | undefined,
): string | null {
  if (picked !== null && picked !== undefined && columns.some((c) => c.key === picked)) {
    return picked;
  }
  const first = columns[0];
  return first === undefined ? null : first.key;
}

/** The column the phone form shows: the picked stage when it names a real column, else the first. */
export function activeColumnOf(
  columns: KanbanColumn[],
  picked: string | null | undefined,
): KanbanColumn | undefined {
  const key = activeColumnKey(columns, picked);
  return columns.find((c) => c.key === key) ?? columns[0];
}

/** The phone form's strip: one chip per stage, by the stage's own key and name. */
export function stageOptionsOf(
  columns: KanbanColumn[],
): { value: string; label: TranslatedText }[] {
  return columns.map((c) => ({ value: c.key, label: c.label }));
}

/** One count per stage, for the phone form's strip — a stage with nothing in it still reads. */
export function stageCounts(columns: KanbanColumn[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of columns) {
    counts[c.key] = (c.items ?? []).length;
  }
  return counts;
}

/** The two neighbours a card can be moved to, in board order. */
export function moveTargets(
  columns: KanbanColumn[],
  column: KanbanColumn,
): { prev: KanbanColumn | undefined; next: KanbanColumn | undefined } {
  const i = columns.findIndex((c) => c.key === column.key);
  return { prev: columns[i - 1], next: columns[i + 1] };
}

/** One move button: the column it moves the card to (none at the board's end), its name, its arrow. */
export interface MoveStep {
  target: KanbanColumn | undefined;
  label: TranslatedText;
  glyph: ShellGlyphName;
}

/** A card's two moves — back a stage and on a stage — each named for the stage it lands in. */
export function moveStepsOf(
  columns: KanbanColumn[],
  column: KanbanColumn,
  words: KanbanWords,
): { back: MoveStep; on: MoveStep } {
  const { prev, next } = moveTargets(columns, column);
  return {
    back: { target: prev, label: words.moveBack(prev?.label), glyph: 'chevron-left' },
    on: { target: next, label: words.moveOn(next?.label), glyph: 'chevron-right' },
  };
}

/**
 * Whether a card's move is in flight. `returned` is not busy: the move came back undone and the
 * pending line is now a reason, not a wait.
 */
export function cardPendingOf(
  item: KanbanCardItem,
  column: KanbanColumn,
  cardPending: KanbanProps['cardPending'],
): { pending: PendingActionSpec | null; busy: boolean } {
  const pending = cardPending ? cardPending(item, column) : null;
  return { pending, busy: pending !== null && pending.state !== 'returned' };
}

/** What a column holds and says: its cards, its count (or n/limit), whether it is over its limit. */
export function columnViewOf(
  column: KanbanColumn,
  words: KanbanWords,
): { items: KanbanCardItem[]; count: string; overLimit: boolean; emptyLine: TranslatedText } {
  const items = column.items ?? [];
  return {
    items,
    count: columnCountLabel(items.length, column.limit),
    overLimit: column.limit !== undefined && items.length > column.limit,
    emptyLine: column.emptyLabel || words.nothingHere,
  };
}

/** The count a column header shows: `n/limit` when there is a WIP limit, else `n`. */
export function columnCountLabel(count: number, limit?: number): string {
  return limit === undefined || limit === null ? String(count) : `${count}/${limit}`;
}
