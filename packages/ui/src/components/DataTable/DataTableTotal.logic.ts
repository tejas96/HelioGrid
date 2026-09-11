import { minorUnits, reconcileMinorUnits } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import type { DataTableTotalRow } from './DataTable.types';
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
  defectNote: string | null;
  agreeNote: string | null;
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
): ReactNode {
  const total = rowCount ?? renderedRows;
  const paged = typeof page === 'number' && total > pageSize;
  return totalRow.scope ?? (paged ? `all ${total} lines` : null);
}

/**
 * **Whether the two figures agree, and the sentence that says so.**
 *
 * The comparison is `@heliogrid/domain`'s `reconcileMinorUnits` — the same one `MoneySummary`
 * runs — over whole minor units, so the two figures agree only when they are equal and no
 * surface can call a gap "reconciles" that another calls a defect.
 *
 * A disagreement is stated in the market pack's own money (`SCR-M06-14`): an unsymbolled
 * locale-default number is not the figure a reader is reconciling against.
 *
 * The spec is the domain's `PayableReconcileSpec`, whose `label` and `amount` are **required** —
 * a reconciliation with neither is not a reconciliation, and the fallback words a local copy needed
 * ("The other figure") only existed to paper over a shape the shared type never allowed.
 */
function reconcileNotes(
  totalRow: DataTableTotalRow,
  format: MarketFormat,
): Pick<TotalModel, 'defectNote' | 'agreeNote'> {
  const reconcile = totalRow.reconcile;
  if (reconcile === undefined || totalRow.amount === undefined) {
    return { defectNote: null, agreeNote: null };
  }
  const { delta, agrees } = reconcileMinorUnits(reconcile.amount, totalRow.amount);
  if (agrees) {
    return { defectNote: null, agreeNote: `Reconciles with ${reconcile.label.toLowerCase()}.` };
  }
  const gap = `${format.amount(minorUnits(Math.abs(delta)))} apart`;
  return {
    defectNote: `${reconcile.label} is ${format.amount(
      reconcile.amount,
    )} — ${gap}. A disagreement is a defect, not a display difference.`,
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
): TotalModel {
  return {
    scope: totalScope(totalRow, rowCount, page, pageSize, renderedRows),
    valueFor: (column) => {
      const value = totalRow.values?.[column.key];
      return typeof value === 'number' ? format.money(value) : value;
    },
    ...reconcileNotes(totalRow, format),
  };
}
