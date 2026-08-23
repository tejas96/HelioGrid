import type { ReactNode } from 'react';
import type { FieldOverrideSpec } from '../FieldOverride/FieldOverride.types';
import type { NamedGapSpec } from '../NamedGap';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { ValueSourceSpec } from '../ValueSource';
import type { DataTableProps, DataTableSort } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';

/* Rows are COMFORTABLE by default: 64px rows, 14px cells, 20px gutters, 24px edges. Functional
   density is about removing chrome, not squeezing air out of a row — a rep scanning 40 leads needs
   the row to be a target, not a line of text. `compact` restores the 48px/13px admin grid. */
export interface DensitySpec {
  rowH: number;
  cellFont: number;
  gutter: number;
  edge: number;
  headH: number;
  headPadT: number;
  headPadB: number;
  selW: number;
  actW: number;
}

export const DENSITY: Record<NonNullable<DataTableProps['density']>, DensitySpec> = {
  comfortable: {
    rowH: 64,
    cellFont: 14,
    gutter: 20,
    edge: 24,
    headH: 52,
    headPadT: 18,
    headPadB: 14,
    selW: 56,
    actW: 108,
  },
  compact: {
    rowH: 48,
    cellFont: 13,
    gutter: 12,
    edge: 20,
    headH: 44,
    headPadT: 13,
    headPadB: 11,
    selW: 44,
    actW: 96,
  },
};

/** Reads a row property by column key without widening the row type to `any`. */
export function readField(row: unknown, key: string): unknown {
  if (typeof row !== 'object' || row === null) return undefined;
  return (row as Record<string, unknown>)[key];
}

/** The row's identity: the caller's getter, its named property, or its position as a last resort. */
export function rowKeyOf<Row>(
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>,
  row: Row,
  index: number,
): string | number {
  const value = typeof rowKey === 'function' ? rowKey(row) : readField(row, rowKey);
  if (typeof value === 'string' || typeof value === 'number') return value;
  return index;
}

/** Sorting only ever touches `rows` — which is what keeps the total row out of its reach. */
export function sortRows<Row>(
  rows: Row[],
  columns: DataTableColumn<Row>[],
  sort: DataTableSort | null | undefined,
): Row[] {
  if (sort === null || sort === undefined || sort.key === '') return rows;
  const column = columns.find((candidate) => candidate.key === sort.key);
  const read = (row: Row): string | number | undefined => {
    if (column?.sortValue !== undefined) return column.sortValue(row);
    const raw = readField(row, sort.key);
    return typeof raw === 'string' || typeof raw === 'number' ? raw : undefined;
  };
  return [...rows].sort((a, b) => {
    const x = read(a);
    const y = read(b);
    const delta =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x ?? '').localeCompare(String(y ?? ''));
    return sort.dir === 'desc' ? -delta : delta;
  });
}

/**
 * **What one header must know about sorting**, resolved once for both platform halves: whether the
 * column sorts at all, whether it is the sorted one, which way it points, and what a press asks
 * for. A header that computed `next` itself is how the two platforms come to disagree about which
 * way the first press sorts.
 */
export interface ColumnSortState {
  canSort: boolean;
  active: boolean;
  /** The active direction, or null when this column is not the sorted one. */
  dir: DataTableSort['dir'] | null;
  /** The sort a press on this header requests — the same key, the other way when it is active. */
  next: DataTableSort;
}

export function sortStateOf<Row>(
  column: DataTableColumn<Row>,
  sortable: boolean,
  sort: DataTableSort | null | undefined,
): ColumnSortState {
  const active = sort !== null && sort !== undefined && sort.key === column.key;
  const dir = active ? (sort?.dir ?? null) : null;
  return {
    canSort: sortable && column.sortable !== false,
    active,
    dir,
    next: { key: column.key, dir: dir === 'asc' ? 'desc' : 'asc' },
  };
}

/**
 * **The table says something instead of showing records.** Any state but `ready`, and a `ready`
 * table with nothing in it — one predicate, so a state can never be handled on one platform and
 * fall through to an empty grid on the other.
 */
export function showsMessage(
  state: NonNullable<DataTableProps['state']>,
  renderedRows: number,
): boolean {
  return state !== 'ready' || renderedRows === 0;
}

/** A cell's alignment: the column's own, else right for numbers. */
export function alignOf<Row>(column: DataTableColumn<Row>): 'left' | 'right' | 'center' {
  return column.align ?? (column.numeric === true ? 'right' : 'left');
}

/** A cell is "live" when it grows something under the value — editor, marker, message. */
export function isLiveCell<Row>(
  column: DataTableColumn<Row>,
  onCellCommit: DataTableProps<Row>['onCellCommit'],
  cellIssue: DataTableProps<Row>['cellIssue'],
): boolean {
  return (
    (column.editable === true && onCellCommit !== undefined) ||
    column.override !== undefined ||
    column.attribution !== undefined ||
    cellIssue !== undefined
  );
}

/**
 * **The platform's own `renderGap`.** The suppression rules run on the RENDERED node, exactly as
 * the design system's do: a `NamedGapSpec` carrying no sentence renders nothing, and a cell whose
 * gap renders nothing still has a value to show. A module shared by both halves cannot import a
 * component, so the half that has one hands it in.
 */
export type GapRenderer = (
  spec?: ReactNode | NamedGapSpec,
  extra?: Partial<NamedGapSpec>,
) => ReactNode;

export interface CellParts {
  /** True when the column is editable AND the table has a commit path — two hands on the switch. */
  editable: boolean;
  /** The named absence, already rendered by `NamedGap` at the cell scale. */
  gap: ReactNode;
  hasGap: boolean;
  /** The validation message for the edit in flight. */
  issue: string | null;
  /** The override spec, suppressed by a gap — nothing was superseded. */
  override: FieldOverrideSpec | null;
  /**
   * The layer that supplied an un-overridden value, **as a spec**. Mutually exclusive with
   * `override`. The cell resolves it through `renderAttribution` with the column's header bound as
   * `fieldName`; a spec object handed to React as a child throws.
   */
  attribution: ValueSourceSpec | null;
  /**
   * This figure's own standing **as a spec**, suppressed by a gap — there is no figure to qualify.
   * The cell resolves it through `renderProvenance`; a spec object handed to React as a child
   * throws.
   */
  standing: ProvenanceProps | ProvenanceTierSpec | null;
  /** True when nothing below the value needs rendering, so the cell is just its value. */
  bare: boolean;
}

/**
 * **What a cell has to say beneath its value**, resolved once for both platform halves so the
 * suppression rules cannot diverge: a gap suppresses the override, the attribution and the
 * per-figure standing (there is no figure to qualify), but never the editor — on an editable
 * column the editor is how the gap gets filled. Override and attribution are mutually exclusive:
 * one number, one marker.
 */
export function resolveCell<Row>(
  row: Row,
  column: DataTableColumn<Row>,
  cellIssue: DataTableProps<Row>['cellIssue'],
  onCellCommit: DataTableProps<Row>['onCellCommit'],
  renderGap: GapRenderer,
): CellParts {
  const issue = cellIssue === undefined ? null : cellIssue(row, column.key);
  const editable = column.editable === true && onCellCommit !== undefined;
  const gap =
    !editable && column.gap !== undefined
      ? renderGap(column.gap(row) ?? undefined, { scale: 'cell', align: alignOf(column) })
      : null;
  const hasGap = gap !== null && gap !== undefined && gap !== false;
  const override = hasGap || column.override === undefined ? null : column.override(row);
  const attribution =
    hasGap || override !== null || column.attribution === undefined
      ? null
      : column.attribution(row);
  const standing = hasGap || column.provenanceFor === undefined ? null : column.provenanceFor(row);
  const bare =
    !editable &&
    !hasGap &&
    override === null &&
    attribution === null &&
    issue === null &&
    standing === null;
  return { editable, gap, hasGap, issue, override, attribution, standing, bare };
}
