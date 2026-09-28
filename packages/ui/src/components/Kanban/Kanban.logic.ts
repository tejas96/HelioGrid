import type { ProvenanceProps } from '../Provenance';
import type { SurfaceState } from '../UnavailableNote';
import type { KanbanCardItem, KanbanColumn } from './Kanban.types';

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

/** The count a column header shows: `n/limit` when there is a WIP limit, else `n`. */
export function columnCountLabel(count: number, limit?: number): string {
  return limit === undefined || limit === null ? String(count) : `${count}/${limit}`;
}
