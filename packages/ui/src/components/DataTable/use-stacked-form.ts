import { useEffect, useRef } from 'react';
import type { DataTableProps } from './DataTable.types';

/**
 * **Whether a part takes its stacked form at its OWN width** — never the viewport's; `false` until
 * the first measure. The breakpoint is the part's, so the answer is the part's to publish: a screen
 * cannot arrange around a breakpoint it is not told about. `DataTable` and `Kanban` both answer here.
 *
 * The callback rides in a ref so a caller's inline arrow cannot turn "whenever the answer changes"
 * into "every render" — and a caller that sets state in it into a loop.
 */
export function useStackedForm(
  ownWidth: number | null,
  stackBelow: number,
  onFormChange: DataTableProps<unknown>['onFormChange'],
): boolean {
  const stacked = ownWidth !== null && ownWidth < stackBelow;
  const formCb = useRef(onFormChange);
  useEffect(() => {
    formCb.current = onFormChange;
  }, [onFormChange]);
  useEffect(() => {
    if (ownWidth !== null) formCb.current?.({ stacked, width: ownWidth });
  }, [stacked, ownWidth]);
  return stacked;
}
