import type { CSSProperties } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderProvenance } from '../Provenance';
import { showsMessage, sortRows } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { Pagination, SelectionBar } from './DataTableChrome';
import { DataTableGrid } from './DataTableGrid';
import { TableCaption, TableStates } from './DataTableShell';
import { DataTableStacked } from './DataTableStacked';
import { useTableSelection, useTableSort } from './use-table-state';

interface WebDataTableProps<Row> extends DataTableProps<Row> {
  className?: string;
  style?: CSSProperties;
}

/** The table measures ITS OWN width — no layout in this system is tuned to a viewport. */
function useOwnWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Data table — zebra rows, sticky header, no borders. Comfortable 64px rows by default. Below
 * `stackBelow` px of its **own** width it becomes one card per record; **it never scrolls
 * horizontally**.
 *
 * **Three row states, and they are not the same thing.** `rowIssue` says a row is **broken**;
 * `rowResolved` says the caller accepted the fix; `isRowMuted` says done-and-inactive. And
 * `rowPending` is a fourth signal that is none of the three: an act in flight, which adds one line
 * and no tint, no dim and no disable.
 *
 * **`totalRow` is the one row that is not a record.** It renders in `<tfoot>` and again after the
 * stacked cards, so the figure the lines add up to cannot be sorted, paginated or stacked away.
 *
 * **The caption is not inside the `<table>`** — as a `<caption>` element it vanished on every
 * phone and in every narrow panel. It sits in the shell, above both forms and every state message,
 * and both forms take their accessible name from it.
 */
export function DataTable<Row = Record<string, unknown>>(props: WebDataTableProps<Row>) {
  const {
    columns,
    rows,
    rowKey = 'id',
    selectable = false,
    selected,
    onSelectionChange,
    bulkActions = null,
    sortable = false,
    sort,
    onSortChange,
    provenance,
    summary,
    state = 'ready',
    caption,
    continued = false,
    stackBelow = 640,
    onFormChange,
    page,
    pageSize = 10,
    rowCount,
    onPageChange,
    density = 'comfortable',
    className,
    style,
  } = props;

  const [ref, ownWidth] = useOwnWidth();
  const captionId = useId();
  const { selection, setSelection, toggleRow, toggleAll, allSelected } = useTableSelection(
    selected,
    onSelectionChange,
    rows.length,
  );
  const { sort: activeSort, setSort } = useTableSort(sort, onSortChange);

  const stacked = ownWidth !== null && ownWidth < stackBelow;

  /* The breakpoint is the table's, so the answer is the table's to publish. The callback rides in
     a ref so a caller's inline arrow cannot turn "whenever the answer changes" into "every render"
     — and a caller that sets state in it into a loop. `Kanban` publishes its own the same way. */
  const formCb = useRef(onFormChange);
  useEffect(() => {
    formCb.current = onFormChange;
  }, [onFormChange]);
  useEffect(() => {
    if (ownWidth !== null) formCb.current?.({ stacked, width: ownWidth });
  }, [stacked, ownWidth]);

  const sorted = useMemo(() => sortRows(rows, columns, activeSort), [rows, columns, activeSort]);

  const shellStyle = { ...style, '--hg-dt-density': density } as CSSProperties;
  const shell = classNames('hg-dt', className);
  const stackedAttr = stacked ? 'true' : undefined;
  const labelledBy = caption === undefined ? undefined : captionId;
  /* The table-wide statement, resolved: a caller may write a bare tier or a whole spec, and
     neither is a React child until `renderProvenance` has made one. */
  const tableProvenance = renderProvenance(provenance, { size: 12 });

  if (showsMessage(state, rows.length)) {
    return (
      <div className={shell} data-density={density} ref={ref} style={shellStyle}>
        <TableCaption caption={caption} continued={continued} id={captionId} />
        <TableStates table={props} stacked={stacked} />
      </div>
    );
  }

  return (
    <div className={shell} data-density={density} ref={ref} style={shellStyle}>
      <TableCaption caption={caption} continued={continued} id={captionId} />

      {selectable && selection.length > 0 ? (
        <SelectionBar
          count={selection.length}
          actions={bulkActions}
          onClear={() => setSelection([])}
        />
      ) : null}

      {tableProvenance === null ? null : (
        <div className="hg-dt-provenance" data-stacked={stackedAttr}>
          {tableProvenance}
        </div>
      )}

      {/* M01-41's summary line. The words are the caller's: only they know what the rows are. */}
      {summary === undefined ? null : (
        <div className="hg-dt-summary" data-stacked={stackedAttr}>
          {summary}
        </div>
      )}

      {stacked ? (
        <DataTableStacked
          rows={sorted}
          rowKey={rowKey}
          selectable={selectable}
          selected={selection}
          onToggleRow={toggleRow}
          labelledBy={labelledBy}
          table={props}
          pageSize={pageSize}
        />
      ) : (
        <DataTableGrid
          rows={sorted}
          rowKey={rowKey}
          selectable={selectable}
          selected={selection}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          allSelected={allSelected}
          sortable={sortable}
          sort={activeSort}
          onSort={setSort}
          labelledBy={labelledBy}
          table={props}
          pageSize={pageSize}
        />
      )}

      {typeof page === 'number' ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          rowCount={rowCount ?? rows.length}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}
