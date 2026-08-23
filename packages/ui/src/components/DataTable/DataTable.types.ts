import type { ReactNode } from 'react';
import type { MoneyReconcileSpec } from '../../utils/money-lines';
import type { PendingActionSpec } from '../PendingAction';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceState } from '../UnavailableNote';
import type { DataTableColumn } from './DataTableColumn.types';

export type { DataTableColumn };

/**
 * **A provenance statement, as a caller may write it**: a bare tier (`"derived"`), a tier object,
 * or the full spec with a standing, a source or a projection. `renderProvenance` resolves either
 * shape — nothing in this folder hands a plain object to React as a child.
 */
export type DataTableProvenanceSpec = ProvenanceProps | ProvenanceTierSpec;

export interface DataTableSort {
  key: string;
  dir: 'asc' | 'desc';
}

export interface DataTableForm {
  stacked: boolean;
}

export interface DataTableTotalRow {
  /** The row's own name — "Bill of materials total", "Tranches". */
  label: string;
  /** By column key. A number is formatted by the market pack; a node is rendered as given. */
  values?: Record<string, ReactNode | number>;
  /** The sum this row states, as a number — required for `reconcile` to mean anything. */
  amount?: number;
  /**
   * The other figure this must equal (`SCR-M06-14`). A disagreement renders as a defect.
   *
   * **It is `MoneySummary`'s own `MoneyReconcileSpec`**, not a second declaration of it: the
   * comparison is `utils/money-lines`' `reconcileAmounts` — the one that surface runs — so a gap
   * this table calls a defect is a gap that block calls a defect too. A local copy that made
   * `label` and `amount` optional let a caller write a reconciliation with neither, and dropped
   * `against` entirely.
   */
  reconcile?: MoneyReconcileSpec;
  /** Overrides the automatic "all 40 lines" scope line under the label. */
  scope?: ReactNode;
  /** The total's own tier or standing. Rendered under the row, both forms. */
  provenance?: DataTableProvenanceSpec;
  note?: ReactNode;
}

export interface DataTableProps<Row = Record<string, unknown>> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** Property name or getter for the row key. */
  rowKey?: string | ((row: Row) => string | number);
  selectable?: boolean;
  /** Controlled selection (array of row keys). */
  selected?: (string | number)[];
  onSelectionChange?: (keys: (string | number)[]) => void;
  /** Nodes shown in the selection band while rows are selected. */
  bulkActions?: ReactNode;
  sortable?: boolean;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort) => void;
  onRowClick?: (row: Row) => void;
  /**
   * The stacked card's whole-card target is a real button, so it needs an accessible name.
   * Defaults to the primary column's raw value; pass this when that column renders a node.
   */
  rowLabel?: (row: Row) => string;
  /**
   * Trailing per-row actions. **Rendered in both forms**, and told which one it is: `form.stacked`
   * is true on the card, false in the table row — so a caller can keep the dense pointer-only pill
   * in the row and hand back full-size targets on the card, where a thumb is the only input.
   */
  rowActions?: (row: Row, form: DataTableForm) => ReactNode;
  /**
   * Dim a row without hiding it — snoozed leads, cancelled jobs. **This is not a problem marker:**
   * dimming reads as done-and-inactive. A broken row takes `rowIssue`. Reaches the card too.
   */
  isRowMuted?: (row: Row) => boolean;
  /**
   * **This row's act has left the device and the server has not confirmed it** — the third thing a
   * row can say, after "done" and "not done" (`F8-36`). The `PendingAction` line renders on **the
   * row's own line under the cells**, in both forms.
   *
   * **It is not one of the three row states, and it changes nothing else about the row.** No tint
   * (that is `rowIssue`), no opacity (that is `isRowMuted` — the opposite fact), no disabling and
   * no overlay: the row **stays operable**, and a second act can start while the first is in
   * flight. The row takes `aria-busy`, never `aria-invalid`.
   *
   * **A failure returns the row and names the reason:** `{state: "returned", reason}`. The row is
   * already back to what it was — nothing was optimistically applied — and the line says why. A
   * returned act is **settled**, so the line stays and `aria-busy` comes off: `waiting` is
   * `pending && pending.state !== "returned"`, which is why this is a spec and not a node. A bare
   * node cannot say whether the act it describes is still in flight.
   */
  rowPending?: (row: Row) => PendingActionSpec | null;
  /**
   * **The needs-attention row state** (`M01-41`). Return the sentence that says what is wrong with
   * this row, or null — so a 400-row import with twelve broken rows says which twelve, in words,
   * where they are. The row takes the warning tint and grows a line under its cells.
   */
  rowIssue?: (row: Row) => string | null;
  /**
   * The row the caller has accepted as fixed — success tint and a confirming line. Return a string
   * to set that line's words. **The table never decides this itself:** it commits a cell and
   * re-reads `cellIssue` / `rowIssue` from the caller, because a grid that cleared its own warning
   * would be claiming to have validated something it cannot see.
   */
  rowResolved?: (row: Row) => boolean | string;
  /** Per-cell validation message. Renders under the cell and rings its editor in danger. */
  cellIssue?: (row: Row, columnKey: string) => string | null;
  /**
   * **The commit path for a cell.** Fires once — blur or Enter, never per keystroke; Escape
   * reverts; empty never commits (the last good value is restored). Required for any `editable`
   * column.
   */
  onCellCommit?: (row: Row, columnKey: string, value: string | number) => void;
  /** Trailing node on a flagged row's line — "Skip this row", "Use platform product". */
  rowIssueAction?: (row: Row) => ReactNode;
  /** The line above the rows — `M01-41`'s "N rows · M match · K new · E need attention". */
  summary?: ReactNode;
  state?: SurfaceState;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  /** `unavailable`: these records were never going to be here. Neutral, and no retry. */
  unavailableTitle?: string;
  unavailableMessage?: string;
  /**
   * Overline caption above the records (`F7-27`). **It renders in both forms and in every state**
   * — it sits in the table's shell, not inside the `<table>`, and both forms take their accessible
   * name from it. As a `<caption>` element it disappeared along with the `<table>` on every phone.
   */
  caption?: string;
  /**
   * **A continuation of the same table on a later page.** The caption says which it is — "Bill of
   * materials (continued)". `PagedDocument` passes it in; nothing else should set it.
   */
  continued?: boolean;
  /**
   * **What the lines add up to** (`SCR-M06-14`). It lives in `<tfoot>`, which is what makes the
   * three prohibitions structural rather than remembered: **it cannot sort**, **it cannot
   * paginate away** and **it cannot stack away**. On a paged table it states what it covers —
   * "all 40 lines" — because a total under ten visible rows that sums forty is a lie by adjacency.
   */
  totalRow?: DataTableTotalRow;
  /**
   * One provenance statement for the whole table — "all figures: derived · PVGIS". **Columns that
   * agree with it stop repeating it**; a column that differs always states its own. This is the
   * only legitimate compression of `F8-07`, because the fact is still on screen, stated once.
   */
  provenance?: DataTableProvenanceSpec;
  /**
   * **The standing of the whole record** — under the **primary cell** in the row and under the
   * name on the card, so a provisional record reads as provisional wherever it is read.
   *
   * It returns the **spec**, not a node: `renderProvenance` owns the tier resolution and the
   * suppression of an empty statement, and a resolver that returns `null` must leave no empty
   * standing box behind. Use `column.provenanceFor` instead when it is one *figure* that is
   * confirmed or reported rather than the record; use both only when they are genuinely two facts.
   */
  rowProvenance?: (row: Row) => DataTableProvenanceSpec | null;
  /** Own-width (not viewport) px below which the table becomes a list of record cards. */
  stackBelow?: number;
  /**
   * **The breakpoint this table owns, published.** Fires with `{stacked, width}` whenever the
   * answer changes, so a screen arranging content around the table reads the table's own
   * measurement instead of running a second observer over the same element.
   */
  onFormChange?: (form: { stacked: boolean; width: number }) => void;
  /** Zero-based page index. Pass to show the pager. */
  page?: number;
  pageSize?: number;
  /** **How many records exist** — the pager's denominator, and nothing to do with money. */
  rowCount?: number;
  onPageChange?: (page: number) => void;
  /** Row rhythm. `comfortable` (default) = 64px rows. `compact` = the 48px grid, dense admin only. */
  density?: 'comfortable' | 'compact';
}
