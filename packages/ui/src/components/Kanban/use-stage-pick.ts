import { useState } from 'react';
import { activeColumnOf } from './Kanban.logic';
import type { KanbanColumn, KanbanProps } from './Kanban.types';

/**
 * **The stage the phone form shows, and who owns the pick** — the caller when `stackedColumn` is
 * passed, the board otherwise. Held here rather than in each platform half, because a
 * controlled/uncontrolled rule that lives twice is a rule the two halves can disagree about.
 */
export function useStagePick(
  columns: KanbanColumn[],
  stackedColumn: KanbanProps['stackedColumn'],
  onStackedColumnChange: KanbanProps['onStackedColumnChange'],
): { active: KanbanColumn | undefined; setPick: (key: string) => void } {
  const [pickInner, setPickInner] = useState<string | null>(null);
  const picked = stackedColumn !== undefined ? stackedColumn : pickInner;
  return {
    active: activeColumnOf(columns, picked),
    setPick: (key: string) => {
      if (stackedColumn === undefined) setPickInner(key);
      onStackedColumnChange?.(key);
    },
  };
}
