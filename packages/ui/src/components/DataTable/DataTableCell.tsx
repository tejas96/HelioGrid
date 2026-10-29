import type { ReactNode } from 'react';
import { fieldBox } from '../../primitives/FieldBox';
import { renderOverride } from '../FieldOverride/FieldOverride';
import { renderGap } from '../NamedGap';
import { renderProvenance } from '../Provenance';
import { Select } from '../Select';
import { renderAttribution } from '../ValueSource';
import { resolveCell } from './DataTable.logic';
import type { CellEditorProps, CellProps, CellValueProps } from './DataTable.parts.types';
import { isMonoEditor, plainFieldOf } from './DataTableCell.logic';
import { CellLead } from './DataTableCellLead';
import type { DataTableColumn } from './DataTableColumn.types';
import { useCellDraft } from './use-cell-draft';

/**
 * **The commit path for a cell** (`M01-41`: rows with problems are fixed inline in the preview,
 * not bounced to a failed file).
 *
 * 1. A cell is editable only when the COLUMN says `editable` and the table has `onCellCommit` —
 *    two hands on the switch, so no column becomes editable by accident.
 * 2. It commits as `useCellDraft` says, on blur or Enter. Escape reverts.
 * 3. The table NEVER decides a problem is solved: it calls `onCellCommit` and re-reads `cellIssue`
 *    and `rowIssue` from the caller on the next render.
 */
function CellEditor<Row>({ row, column, issue, onCommit, words }: CellEditorProps<Row>) {
  const { asText, draft, setDraft, focused, setFocused, revert, commit } = useCellDraft(
    row,
    column,
    onCommit,
  );

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
        placeholder={words.choosePlaceholder}
        closeLabel={words.closeList}
        onChange={(value) => onCommit(row, column.key, value)}
      />
    );
  }

  return (
    <input
      className="hg-dt-editor"
      value={draft}
      aria-label={column.label}
      aria-invalid={issue === null ? undefined : true}
      {...fieldBox({ focused, tone: issue === null ? 'none' : 'error', density: 'functional' })}
      data-mono={isMonoEditor(column) ? 'true' : undefined}
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
          revert();
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function plainValue<Row>(row: Row, column: DataTableColumn<Row>): ReactNode {
  if (column.render !== undefined) return column.render(row);
  return plainFieldOf(row, column);
}

/**
 * **Which of the three forms the value itself takes**: the editor when the column and the table
 * both allow it, the named absence when there is no value, the value otherwise. A gap never
 * suppresses the editor — on an editable column the editor is how the gap gets filled.
 */
function CellValue<Row>({ row, column, parts, onCellCommit, words }: CellValueProps<Row>) {
  if (parts.editable && onCellCommit !== undefined) {
    return (
      <CellEditor
        row={row}
        column={column}
        issue={parts.issue}
        onCommit={onCellCommit}
        words={words}
      />
    );
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
function CellBody<Row>({ row, column, align, cellIssue, onCellCommit, words }: CellProps<Row>) {
  const parts = resolveCell(row, column, cellIssue, onCellCommit, renderGap);
  if (parts.bare) return plainValue(row, column);

  return (
    <span className="hg-dt-cell" data-align={align}>
      <CellValue
        row={row}
        column={column}
        parts={parts}
        onCellCommit={onCellCommit}
        words={words}
      />
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

/** The cell, with the column's kind tile before it and its quiet line under it when it has them. */
export function DataTableCell<Row>(props: CellProps<Row>) {
  return (
    <CellLead row={props.row} column={props.column}>
      <CellBody {...props} />
    </CellLead>
  );
}
