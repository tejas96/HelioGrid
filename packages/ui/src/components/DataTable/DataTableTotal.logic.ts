import type { TranslatedText } from '@heliogrid/contracts';
import { minorUnits } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import type { DataTableTotalRow, DataTableWords } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';

/* THE TOTAL ROW'S MODEL, IN ONE PLACE, RENDERED THREE TIMES — the `<tfoot>`, the phone's block and
   the native block all read this, so the sum, its scope and its reconciliation sentence cannot
   diverge between the forms the same table takes.

   SCR-M06-14: "BOM total ↔ proposal price — reconciles under the locked invariants… A DISAGREEMENT
   IS A DEFECT, NOT A DISPLAY DIFFERENCE." */

export interface TotalModel {
  scope: ReactNode;
  valueFor: (column: DataTableColumn<unknown>) => ReactNode;
  /** The disagreement sentence — a defect, not a display difference. */
  defectNote: TranslatedText | null;
  agreeNote: TranslatedText | null;
}

/**
 * **What the total covers.** On a paged table it says so — "all 40 lines" — because a total under
 * ten visible rows that sums forty is a lie by adjacency.
 */
function totalScope(
  totalRow: DataTableTotalRow,
  rowCount: number | undefined,
  page: number | undefined,
  pageSize: number,
  renderedRows: number,
  words: DataTableWords,
): ReactNode {
  const total = rowCount ?? renderedRows;
  const paged = typeof page === 'number' && total > pageSize;
  return totalRow.scope ?? (paged ? words.allLines(total) : null);
}

/**
 * **Whether the two figures agree, and the sentence that says so.**
 *
 * The comparison is the server's (`F4-04`): it ran `reconcileMinorUnits` over whole minor units,
 * the same one behind `MoneySummary`'s equation, so the two figures agree only when they are equal
 * and no surface can call a gap "reconciles" that another calls a defect. This prints its verdict.
 *
 * A disagreement is stated in the market pack's own money (`SCR-M06-14`): an unsymbolled
 * locale-default number is not the figure a reader is reconciling against.
 *
 * The verdict is the domain's `PayableReconciliation`, whose `label` and `amount` are
 * **required** — a reconciliation with neither is not a reconciliation.
 */
function reconcileNotes(
  totalRow: DataTableTotalRow,
  format: MarketFormat,
  words: DataTableWords,
): Pick<TotalModel, 'defectNote' | 'agreeNote'> {
  const reconcile = totalRow.reconcile;
  if (reconcile === undefined) {
    return { defectNote: null, agreeNote: null };
  }
  const { delta, agrees } = reconcile;
  if (agrees) {
    return { defectNote: null, agreeNote: words.reconciles(reconcile.label) };
  }
  return {
    defectNote: words.disagrees(
      reconcile.label,
      format.amount(reconcile.amount),
      format.amount(minorUnits(Math.abs(delta))),
    ),
    agreeNote: null,
  };
}

/**
 * **The total states its sum and, when given the other figure, whether the two agree.** A
 * disagreement renders in danger words naming the gap: `SCR-M06-14` calls it a defect, not a
 * display difference.
 *
 * **Every figure here is the market pack's**, `format` threaded in from the component that read
 * `useFormat()` — a module function cannot call a hook, and a total that prints `452471` where the
 * lines above it print `₹4,52,471` is stating a different number.
 */
export function buildTotal(
  totalRow: DataTableTotalRow,
  rowCount: number | undefined,
  page: number | undefined,
  pageSize: number,
  renderedRows: number,
  format: MarketFormat,
  words: DataTableWords,
): TotalModel {
  return {
    scope: totalScope(totalRow, rowCount, page, pageSize, renderedRows, words),
    valueFor: (column) => {
      if (totalRow.reconcile?.column === column.key) {
        return format.amount(totalRow.reconcile.target);
      }
      const value = totalRow.values?.[column.key];
      return typeof value === 'number' ? format.money(value) : value;
    },
    ...reconcileNotes(totalRow, format, words),
  };
}

/**
 * **The figures the total states**, in the columns the row states them — with the column's own
 * label, so nothing invents a second vocabulary for the same total. The last is the headline; the
 * rest are listed under it.
 */
export function totalFiguresOf<Row>(
  totalRow: DataTableTotalRow,
  columns: DataTableColumn<Row>[],
): { main: DataTableColumn<Row> | undefined; others: DataTableColumn<Row>[] } {
  const stated = columns.filter((column) => totalRow.values?.[column.key] !== undefined);
  return { main: stated[stated.length - 1], others: stated.slice(0, -1) };
}
