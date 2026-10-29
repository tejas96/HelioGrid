import type { ShellGlyphName } from '../AppShell/AppShell.types';

/**
 * The skeleton keys, declared once so the two halves cannot draw a different number of
 * placeholder columns or bars. `SKELETON_COLUMNS.slice(0, 1)` is the stacked layout's single
 * column, which is why the list is ordered and not a count.
 */
export const KANBAN_SKELETON_COLUMNS = ['a', 'b', 'c', 'd'];
export const KANBAN_SKELETON_BARS = ['a', 'b', 'c'];

/** The placeholder columns the board loads with: the stacked form's one, else the wide form's four. */
export function skeletonColumnsOf(stacked: boolean): string[] {
  return stacked ? KANBAN_SKELETON_COLUMNS.slice(0, 1) : KANBAN_SKELETON_COLUMNS;
}

/** The mark on the board's own message: the alert on a failed read, the board itself when empty. */
export function boardMarkOf(tone: 'warning' | undefined): ShellGlyphName {
  return tone === 'warning' ? 'alert-circle' : 'kanban';
}
