/* Timeline's pick mode, the decisions both halves share: which step is chosen, which one step is
   in the tab order, and where a key moves the pick. No platform API — each half binds its own
   events to these. */

import type { TimelineItem } from './Timeline.types';

/** The chosen step's place in the chain, or -1 when `value` names none of its steps. */
export function pickedIndex(items: readonly TimelineItem[], value: string | undefined): number {
  return value === undefined ? -1 : items.findIndex((item) => item.id === value);
}

/** One step is in the tab order: the chosen one, or the first while none is chosen. */
export function isTabStop(index: number, picked: number): boolean {
  return picked < 0 ? index === 0 : index === picked;
}

/**
 * Where a key sends the pick: one step on (ArrowDown / ArrowRight), one step back (ArrowUp /
 * ArrowLeft), `0` to choose the step it was pressed on (Enter / Space), `undefined` for any other
 * key, which the step leaves to the browser — Tab among them, so Tab leaves the group.
 */
export function pickMove(key: string): -1 | 0 | 1 | undefined {
  if (key === 'ArrowDown' || key === 'ArrowRight') return 1;
  if (key === 'ArrowUp' || key === 'ArrowLeft') return -1;
  if (key === 'Enter' || key === ' ') return 0;
  return undefined;
}

/** The step a move lands on. The chain wraps: on from the last step is the first. */
export function movedIndex(index: number, move: -1 | 0 | 1, count: number): number {
  return (index + move + count) % count;
}
