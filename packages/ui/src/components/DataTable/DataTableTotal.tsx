import { useFormat } from '../MarketProvider/market-context';
import { renderProvenance } from '../Provenance';
import { alignOf } from './DataTable.logic';
import type { DataTableProps, DataTableTotalRow } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';
import type { TotalModel } from './DataTableTotal.logic';
import { buildTotal } from './DataTableTotal.logic';

interface TotalProps<Row> {
  totalRow: DataTableTotalRow;
  columns: DataTableColumn<Row>[];
  rowCount: DataTableProps<Row>['rowCount'];
  page: DataTableProps<Row>['page'];
  pageSize: number;
  renderedRows: number;
}

function TotalNotes({
  defectNote,
  agreeNote,
  totalRow,
}: {
  defectNote: string | null;
  agreeNote: string | null;
  totalRow: DataTableTotalRow;
}) {
  return (
    <>
      {defectNote === null ? null : (
        <p className="hg-dt-total-defect" role="alert">
          {defectNote}
        </p>
      )}
      {defectNote === null && agreeNote !== null ? (
        <p className="hg-dt-total-note">{agreeNote}</p>
      ) : null}
      {totalRow.provenance === undefined ? null : (
        <div>{renderProvenance(totalRow.provenance, { size: 12 })}</div>
      )}
      {totalRow.note === undefined ? null : <p className="hg-dt-total-note">{totalRow.note}</p>}
    </>
  );
}

/**
 * **The total's name, and what it covers.** On a paged table the scope line is the difference
 * between a sum and a lie by adjacency — a total under ten visible rows that adds up forty.
 */
function TotalLabel({ label, scope }: { label: string; scope: TotalModel['scope'] }) {
  return (
    <span>
      {label}
      {scope === null ? null : <span className="hg-dt-total-scope">{scope}</span>}
    </span>
  );
}

/** One cell of the total row: the row's name in the first column, one of its figures in the rest. */
function TotalCell<Row>({
  column,
  index,
  columnCount,
  hasActions,
  model,
  totalRow,
}: {
  column: DataTableColumn<Row>;
  index: number;
  columnCount: number;
  hasActions: boolean;
  model: TotalModel;
  totalRow: DataTableTotalRow;
}) {
  const first = index === 0;
  return (
    <td
      className="hg-dt-total-cell"
      data-first={first ? 'true' : undefined}
      data-last={index === columnCount - 1 && !hasActions ? 'true' : undefined}
      data-align={first ? 'left' : alignOf(column)}
      data-mono={!first && (column.mono === true || column.numeric === true) ? 'true' : undefined}
      data-numeric={column.numeric === true ? 'true' : undefined}
    >
      {first ? (
        <TotalLabel label={totalRow.label} scope={model.scope} />
      ) : (
        model.valueFor(column as DataTableColumn<unknown>)
      )}
    </td>
  );
}

/**
 * **The one row that is not a record.** It lives in `<tfoot>`, which is what makes the three
 * prohibitions structural rather than remembered: it **cannot sort** (sorting only ever touches
 * `rows`), it **cannot paginate away** (it is not a member of `rows`), and it **cannot stack
 * away** (`TotalBlock` is the same fact after the cards).
 */
export function TotalFoot<Row>({
  totalRow,
  columns,
  selectable,
  hasActions,
  rowCount,
  page,
  pageSize,
  renderedRows,
}: TotalProps<Row> & { selectable: boolean; hasActions: boolean }) {
  /* The market pack's money, read here and threaded into the model — every figure this row states
     is the same figure, formatted the same way, as the lines above it (`F1` / `F3-20`). */
  const model = buildTotal(totalRow, rowCount, page, pageSize, renderedRows, useFormat());
  const span = (selectable ? 1 : 0) + columns.length + (hasActions ? 1 : 0);
  const showNotes =
    model.defectNote !== null ||
    model.agreeNote !== null ||
    totalRow.note !== undefined ||
    totalRow.provenance !== undefined;

  return (
    <tfoot className="hg-dt-total" data-flow-foot="" data-keep-together="">
      <tr>
        {selectable ? <td className="hg-dt-total-cell hg-dt-total-cell--select" /> : null}
        {columns.map((column, index) => (
          <TotalCell
            key={column.key}
            column={column}
            index={index}
            columnCount={columns.length}
            hasActions={hasActions}
            model={model}
            totalRow={totalRow}
          />
        ))}
        {hasActions ? <td className="hg-dt-total-cell hg-dt-total-cell--actions" /> : null}
      </tr>
      {showNotes ? (
        <tr>
          <td className="hg-dt-total-notes" colSpan={span}>
            <TotalNotes
              defectNote={model.defectNote}
              agreeNote={model.agreeNote}
              totalRow={totalRow}
            />
          </td>
        </tr>
      ) : null}
    </tfoot>
  );
}

/**
 * The total on the phone. It is **not a card** — a total is not a record, so it does not take the
 * card's shape, its zebra or its row target. It is the table's own last line, in the table's
 * shell, in the same words as the `<tfoot>`.
 */
export function TotalBlock<Row>({
  totalRow,
  columns,
  rowCount,
  page,
  pageSize,
  renderedRows,
}: TotalProps<Row>) {
  const model = buildTotal(totalRow, rowCount, page, pageSize, renderedRows, useFormat());
  /* The card's figures are the same columns the row states, with the column's own label — nothing
     here invents a second vocabulary for the same total. */
  const stated = columns.filter((column) => totalRow.values?.[column.key] !== undefined);
  const main = stated[stated.length - 1];

  return (
    <div className="hg-dt-total-block">
      <div className="hg-dt-total-block-head">
        <span className="hg-dt-total-block-label">{totalRow.label}</span>
        {main === undefined ? null : (
          <span className="hg-dt-total-block-figure">
            {model.valueFor(main as DataTableColumn<unknown>)}
          </span>
        )}
      </div>
      {model.scope === null ? null : <span className="hg-dt-total-block-scope">{model.scope}</span>}
      {stated.length > 1 ? (
        <dl className="hg-dt-total-block-list">
          {stated.slice(0, -1).map((column) => (
            <div className="hg-dt-total-block-pair" key={column.key}>
              <dt>{column.label}</dt>
              <dd>{model.valueFor(column as DataTableColumn<unknown>)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <TotalNotes defectNote={model.defectNote} agreeNote={model.agreeNote} totalRow={totalRow} />
    </div>
  );
}
