import { useEffect, useState } from 'react';
import type { DataTableProps } from './DataTable.types';
import { committedValueOf, editTextOf } from './DataTableCell.logic';
import type { DataTableColumn } from './DataTableColumn.types';

/**
 * **A cell editor's draft and its commit path, stated once for both halves.** It commits ONCE — on
 * blur, Enter or submit, never per keystroke — and only a value that differs from the last good one;
 * a draft that commits nothing is replaced by that value. While the editor is not focused the draft
 * follows the caller's value, so a fix made elsewhere shows in the cell.
 */
export function useCellDraft<Row>(
  row: Row,
  column: DataTableColumn<Row>,
  onCommit: NonNullable<DataTableProps<Row>['onCellCommit']>,
) {
  const asText = editTextOf(row, column);
  const [draft, setDraft] = useState(asText);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(asText);
  }, [asText, focused]);

  return {
    asText,
    draft,
    setDraft,
    focused,
    setFocused,
    /** Back to the last good value — Escape, or a draft that commits nothing. */
    revert: () => setDraft(asText),
    commit: () => {
      const value = committedValueOf(draft, column);
      if (value === null) {
        setDraft(asText);
        return;
      }
      if (String(value) !== asText) onCommit(row, column.key, value);
    },
  };
}
