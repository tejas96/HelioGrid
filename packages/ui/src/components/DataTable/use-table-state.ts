import { useState } from 'react';
import type { DataTableProps, DataTableSort } from './DataTable.types';

/**
 * **Who owns the selection** — the caller when `selected` is passed, the table otherwise. Held here
 * rather than in each platform shell, because a controlled/uncontrolled rule that lives twice is a
 * rule the two halves can disagree about.
 */
export function useTableSelection<Row>(
  selected: DataTableProps<Row>['selected'],
  onSelectionChange: DataTableProps<Row>['onSelectionChange'],
  rowCount: number,
) {
  const [inner, setInner] = useState<(string | number)[]>([]);
  const selection = selected ?? inner;
  const allSelected = rowCount > 0 && selection.length === rowCount;
  const setSelection = (next: (string | number)[]) => {
    if (selected === undefined) setInner(next);
    onSelectionChange?.(next);
  };
  return {
    selection,
    setSelection,
    toggleRow: (key: string | number) =>
      setSelection(
        selection.includes(key)
          ? selection.filter((candidate) => candidate !== key)
          : [...selection, key],
      ),
    /** Select every row the caller hands over, or clear the lot when they are already selected. */
    toggleAll: (keys: (string | number)[]) => setSelection(allSelected ? [] : keys),
    allSelected,
  };
}

/** The same ownership rule for the sort: the caller's when `sort` is passed, the table's otherwise. */
export function useTableSort<Row>(
  sort: DataTableProps<Row>['sort'],
  onSortChange: DataTableProps<Row>['onSortChange'],
) {
  const [inner, setInner] = useState<DataTableSort | null>(null);
  return {
    sort: sort === undefined ? inner : sort,
    setSort: (next: DataTableSort) => {
      if (sort === undefined) setInner(next);
      onSortChange?.(next);
    },
  };
}
