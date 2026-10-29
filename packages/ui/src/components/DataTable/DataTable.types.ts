import type { TranslatedText } from '@heliogrid/contracts';
import type { PayableReconciliation } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { PendingActionSpec } from '../PendingAction';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceRead } from '../UnavailableNote';
import type { DataTableColumn, DataTableLeading } from './DataTableColumn.types';

export type { DataTableColumn, DataTableLeading };

/**
 * **A provenance statement, as a caller may write it**: a bare tier (`"derived"`) or the full
 * spec with a standing, a source or a projection. `renderProvenance` resolves either
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

/** The server's reconciliation, and the column whose total it judged. */
export interface DataTableReconcile extends PayableReconciliation {
  /**
   * The column that prints the judged total. It prints the verdict's `target`, never a `values`
   * entry, so the figure a reader sees under "Reconciles" is the figure the server compared.
   */
  column: string;
}

export interface DataTableTotalRow {
  /** The row's own name — "Bill of materials total", "Tranches". */
  label: TranslatedText;
  /** By column key. A number is formatted by the market pack; a node is rendered as given. */
  values?: Record<string, ReactNode | number>;
  /**
   * The SERVER's verdict on the other figure this must equal (`SCR-M06-14`). A disagreement
   * renders as a defect.
   *
   * **It is `@heliogrid/domain`'s `PayableReconciliation`** plus the column it judged, the same one `MoneySummary`'s
   * equation carries: the server ran `reconcileMinorUnits` (`F4-04` — no device computes a money
   * figure, the gap included), so a gap this table calls a defect is a gap that block calls a
   * defect too.
   */
  reconcile?: DataTableReconcile;
  /** Overrides the automatic "all 40 lines" scope line under the label. */
  scope?: ReactNode;
  /** The total's own tier or standing. Rendered under the row, both forms. */
  provenance?: DataTableProvenanceSpec;
  note?: ReactNode;
}

interface DataTableBaseProps<Row> {
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
   * Which rows `onRowClick` opens — the Team table opens an active person only. Every row when
   * absent; a row it refuses draws no press target and takes no click.
   */
  rowOpens?: (row: Row) => boolean;
  /**
   * The stacked card's whole-card target is a real button, so it needs an accessible name: the
   * record's own name. Defaults to the primary column's raw value; pass this when that column
   * renders a node.
   */
  rowLabel?: (row: Row) => string;
  /**
   * Dim a row without hiding it — snoozed leads, cancelled jobs. **This is not a problem marker:**
   * dimming reads as done-and-inactive. A broken row takes `rowIssue`. Reaches the card too.
   */
  isRowMuted?: (row: Row) => boolean;
  /**
   * **The row just added** (`SCR-M01-16` decision 1): its ground takes the violet iris wash so the
   * reader finds what they made, until the caller clears it. Not a selection — no tick, no
   * `aria-selected` — and selection and the issue tint still win over it. Reaches the card too.
   */
  isRowHighlighted?: (row: Row) => boolean;
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
  rowIssue?: (row: Row) => TranslatedText | null;
  /**
   * The row the caller has accepted as fixed — success tint and a confirming line. Return a string
   * to set that line's words. **The table never decides this itself:** it commits a cell and
   * re-reads `cellIssue` / `rowIssue` from the caller, because a grid that cleared its own warning
   * would be claiming to have validated something it cannot see.
   */
  rowResolved?: (row: Row) => boolean | TranslatedText;
  /** Per-cell validation message. Renders under the cell and rings its editor in danger. */
  cellIssue?: (row: Row, columnKey: string) => TranslatedText | null;
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
  /**
   * **Required:** what this draws always comes from a read. `failed` draws the error with its
   * retry; `unavailable` draws none.
   */
  read: SurfaceRead;
  emptyTitle: TranslatedText;
  emptyDescription?: TranslatedText;
  emptyAction?: ReactNode;
  errorTitle: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /** `unavailable`: these records were never going to be here. Neutral, and no retry. */
  unavailableTitle: TranslatedText;
  unavailableMessage?: TranslatedText;
  /** `@heliogrid/i18n`'s `dataTableWords`: what the table draws and speaks of its own. */
  words: DataTableWords;
  /**
   * Overline caption above the records (`F7-27`). **It renders in both forms and in every state**
   * — it sits in the table's shell, not inside the `<table>`, and both forms take their accessible
   * name from it. As a `<caption>` element it disappeared along with the `<table>` on every phone.
   */
  caption?: TranslatedText;
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
  /**
   * `overline` (default): the uppercase micro-label head. `quiet`: sentence-case labels in the
   * caption face, the rows in one raised card with a hairline between each and no zebra, 82px rows
   * — a short list read row by row, a team roster (`SCR-M01-12`, design-system change 20). The
   * caption then names the table for a screen reader only. The stacked form is the same in both.
   */
  head?: 'overline' | 'quiet';
}

/**
 * Trailing per-row actions, with the column's name: a column of acts cannot be typed without the
 * words a screen reader says for its head.
 */
type DataTableRowActions<Row> =
  | { rowActions?: undefined; actionsLabel?: undefined }
  | {
      /**
       * **Rendered in both forms**, and told which one it is: `form.stacked` is true on the card,
       * false in the table row — so a caller can keep the dense pointer-only pill in the row and hand
       * back full-size targets on the card, where a thumb is the only input.
       */
      rowActions: (row: Row, form: DataTableForm) => ReactNode;
      /** The actions column's name, spoken only — the caller's words. */
      actionsLabel: TranslatedText;
    };

export type DataTableProps<Row = Record<string, unknown>> = DataTableBaseProps<Row> &
  DataTableRowActions<Row>;

/** The span of records one page shows: "1–20 of 342" is `{ from: 1, to: 20, count: 342 }`. */
export interface PageRange {
  from: number;
  to: number;
  count: number;
}

/**
 * **The pager, on its own** (`D268`): the readout and the two steps `DataTable` draws under its
 * records, for a list of records that is not a `DataTable` (`SCR-M01-16`'s caller list). Each step
 * is a 44px target and is disabled at its end.
 */
export interface PaginationProps {
  /** Zero-based page index. */
  page: number;
  pageSize: number;
  /** **How many records exist** — the readout's denominator. */
  rowCount: number;
  onPageChange?: (page: number) => void;
  /** The step back's name, spoken only — the caller's words. */
  previousLabel: TranslatedText;
  /** The step forward's name, spoken only — the caller's words. */
  nextLabel: TranslatedText;
  /** The readout's words for the span shown — "1–20 of 342" — from `packages/i18n`. */
  readout: (range: PageRange) => TranslatedText;
}

/**
 * **What the table draws and speaks of its own** — `@heliogrid/i18n`'s `dataTableWords`: its
 * loading name, the selection band and ticks, a fixed row's line, a continued caption, what a
 * paged total covers and whether it reconciles, the phone's spoken sort, and its pager.
 */
export interface DataTableWords {
  readonly loading: TranslatedText;
  /** The selection band's count, drawn and spoken — "3 selected". */
  readonly selected: (count: number) => TranslatedText;
  readonly clearSelection: TranslatedText;
  readonly selectEveryRow: TranslatedText;
  /** A row's tick, named by the row's key. */
  readonly selectRow: (key: string) => TranslatedText;
  /** A card's tick, named by its record. */
  readonly selectNamed: (name: string) => TranslatedText;
  /** A `select` cell's trigger while nothing is picked. */
  readonly choosePlaceholder: TranslatedText;
  /** The phone's name for the scrim that closes a `select` cell's open list. */
  readonly closeList: TranslatedText;
  /** A row the caller accepted as fixed, when it gave no line of its own. */
  readonly fixed: TranslatedText;
  /** A card's name when its record has none to give. */
  readonly openRecord: TranslatedText;
  /** A table continued on a later page — "Bill of materials (continued)". */
  readonly continued: (caption: string) => TranslatedText;
  /** What a paged total covers — "all 40 lines". */
  readonly allLines: (count: number) => TranslatedText;
  /** The server's verdict that the total agrees with the figure it was judged against. */
  readonly reconciles: (label: string) => TranslatedText;
  /** The disagreement, a defect: the other figure, and how far apart the two are. */
  readonly disagrees: (label: string, amount: string, gap: string) => TranslatedText;
  /** A phone header's spoken name: the column, and whether and which way it sorts. */
  readonly notSorted: (column: string) => TranslatedText;
  readonly sortedAscending: (column: string) => TranslatedText;
  readonly sortedDescending: (column: string) => TranslatedText;
  /** What a press on a phone header does. */
  readonly sortsAscending: TranslatedText;
  readonly sortsDescending: TranslatedText;
  /** The table's pager. */
  readonly previousPage: TranslatedText;
  readonly nextPage: TranslatedText;
  readonly pageRange: (range: PageRange) => TranslatedText;
}
