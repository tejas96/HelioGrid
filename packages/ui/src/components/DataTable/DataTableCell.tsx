import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { renderOverride } from '../FieldOverride/FieldOverride';
import { renderGap } from '../NamedGap';
import { renderProvenance } from '../Provenance';
import { Select } from '../Select';
import { renderAttribution } from '../ValueSource';
import type { CellParts } from './DataTable.logic';
import { readField, resolveCell } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';

/**
 * **The commit path for a cell, stated once** (`M01-41`: rows with problems are fixed inline in
 * the preview, not bounced to a failed file).
 *
 * 1. A cell is editable only when the COLUMN says `editable` and the table has `onCellCommit` —
 *    two hands on the switch, so no column becomes editable by accident.
 * 2. It commits ONCE — blur or Enter, never per keystroke. Escape reverts. Empty never commits;
 *    the last good value is restored.
 * 3. The table NEVER decides a problem is solved: it calls `onCellCommit` and re-reads `cellIssue`
 *    and `rowIssue` from the caller on the next render.
 */
function CellEditor<Row>({
  row,
  column,
  issue,
  onCommit,
}: {
  row: Row;
  column: DataTableColumn<Row>;
  issue: string | null;
  onCommit: NonNullable<DataTableProps<Row>['onCellCommit']>;
}) {
  const raw = column.editValue !== undefined ? column.editValue(row) : readField(row, column.key);
  const asText = raw === undefined || raw === null ? '' : String(raw);
  const [draft, setDraft] = useState(asText);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(asText);
  }, [asText, focused]);

  if (column.editor === 'select') {
    /* The system Select, not a raw <select>: its listbox measures the space inside the table shell
       and opens UPWARD or shortens when there is no room below, rather than being clipped away in
       the lower rows — which is the whole reason a grid cannot use the platform control. The column
       header is this cell's visible name and a cell has no room for a <label>, so the name goes on
       the control as `ariaLabel`, and the validation message rings it as a real error rather than
       riding along as a data attribute nothing reads. */
    return (
      <Select
        density="functional"
        value={asText}
        options={column.options ?? []}
        error={issue ?? undefined}
        ariaLabel={column.label}
        onChange={(value) => onCommit(row, column.key, value)}
      />
    );
  }

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      setDraft(asText);
      return;
    }
    const value = column.editor === 'number' ? Number.parseFloat(trimmed) : trimmed;
    if (typeof value === 'number' && Number.isNaN(value)) {
      setDraft(asText);
      return;
    }
    if (String(value) !== asText) onCommit(row, column.key, value);
  };

  return (
    <input
      className="hg-dt-editor"
      value={draft}
      aria-label={column.label}
      aria-invalid={issue === null ? undefined : true}
      data-issue={issue === null ? undefined : 'true'}
      data-mono={
        column.mono === true || column.numeric === true || column.editor === 'number'
          ? 'true'
          : undefined
      }
      inputMode={column.editor === 'number' ? 'decimal' : undefined}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        } else if (event.key === 'Escape') {
          setDraft(asText);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function plainValue<Row>(row: Row, column: DataTableColumn<Row>): ReactNode {
  if (column.render !== undefined) return column.render(row);
  const raw = readField(row, column.key);
  return typeof raw === 'string' || typeof raw === 'number' ? raw : null;
}

/**
 * **Which of the three forms the value itself takes**: the editor when the column and the table
 * both allow it, the named absence when there is no value, the value otherwise. A gap never
 * suppresses the editor — on an editable column the editor is how the gap gets filled.
 */
function CellValue<Row>({
  row,
  column,
  parts,
  onCellCommit,
}: {
  row: Row;
  column: DataTableColumn<Row>;
  parts: CellParts;
  onCellCommit: DataTableProps<Row>['onCellCommit'];
}) {
  if (parts.editable && onCellCommit !== undefined) {
    return <CellEditor row={row} column={column} issue={parts.issue} onCommit={onCellCommit} />;
  }
  /* `NamedGap`'s own treatment, already rendered — the ring, the sentence and the act that fills
     it. A tertiary-grey span was the colour of a gap and none of its behaviour. */
  if (parts.hasGap) return parts.gap;
  return <span>{plainValue(row, column)}</span>;
}

/**
 * A cell's value, plus — when the column asks for them — its editor, its message, its override or
 * its attribution. **Override and attribution are mutually exclusive:** one number, one marker.
 *
 * **A cell with no value says what is missing.** `column.gap(row)` names the absence; never an
 * em-dash, which says *nothing here* when these rows require the product to say **what**. A gap
 * suppresses the override, the attribution and the per-figure standing — there is no figure to
 * qualify — but not the editor: on an editable column the editor is how the gap gets filled.
 */
export function DataTableCell<Row>({
  row,
  column,
  align,
  cellIssue,
  onCellCommit,
}: {
  row: Row;
  column: DataTableColumn<Row>;
  align: 'left' | 'right' | 'center';
  cellIssue: DataTableProps<Row>['cellIssue'];
  onCellCommit: DataTableProps<Row>['onCellCommit'];
}) {
  const parts = resolveCell(row, column, cellIssue, onCellCommit, renderGap);
  if (parts.bare) return plainValue(row, column);

  return (
    <span className="hg-dt-cell" data-align={align}>
      <CellValue row={row} column={column} parts={parts} onCellCommit={onCellCommit} />
      {/* This figure's own standing (`M11-42`), resolved from the caller's spec — handing React a
          spec object as a child throws, which is what a bare `{parts.standing}` did. */}
      {renderProvenance(parts.standing, { size: 12, align })}
      {parts.issue === null ? null : (
        <span className="hg-dt-cell-issue" data-align={align}>
          {parts.issue}
        </span>
      )}
      {renderOverride(parts.override)}
      {/* The column header is the field this layer supplied (`SCR-M01-15`): only the table knows
          it, so only the table can bind it. */}
      {renderAttribution(parts.attribution, { fieldName: column.label })}
    </span>
  );
}
