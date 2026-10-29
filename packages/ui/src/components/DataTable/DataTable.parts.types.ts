import type { TranslatedText } from '@heliogrid/contracts';
import type { ProvenanceProps } from '../Provenance/Provenance.types';
import type { CellParts } from './DataTable.logic';
import type { DataTableProps, DataTableSort, DataTableWords } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';

/*
 * The parts' one contract each (Law 7): both halves of a part implement it, and a half adds only
 * how it draws (the web's quiet head, the phone's density).
 */

/** What both of the table's forms take: its rows, already sorted, and who they are selected by. */
interface FormProps<Row> {
  /** The rows in the order they render — sorting has already happened. */
  rows: Row[];
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  /**
   * **The caption's link** (`F7-27`): its id on the web. RN has no `aria-labelledby`, so the
   * caption cannot be pointed at by id — the phone carries its WORDS as the form's own accessible
   * name, and without them the form announces as an unnamed collection of rows.
   */
  labelledBy?: string;
  table: DataTableProps<Row>;
  pageSize: number;
}

/** The phone answer: one card per record. */
export type StackedProps<Row> = FormProps<Row>;

/** The wide form: header, records, and the one row that is not a record. */
export interface GridProps<Row> extends FormProps<Row> {
  onToggleAll: (keys: (string | number)[]) => void;
  allSelected: boolean;
  sortable: boolean;
  sort: DataTableSort | null | undefined;
  onSort: (next: DataTableSort) => void;
}

/** A column's tier, in a header or on a card's label. */
export interface ColumnTierProps<Row> {
  column: DataTableColumn<Row>;
  /** The table-wide statement, already resolved by the caller — one call for the whole table. */
  tableSpec: ProvenanceProps | null;
}

/** What every cell is handed: its record, its column, and the table's word on editing it. */
interface CellInput<Row> {
  row: Row;
  column: DataTableColumn<Row>;
  words: DataTableWords;
}

/** One cell, with what its column asks to grow under the value. */
export interface CellProps<Row> extends CellInput<Row> {
  align: 'left' | 'right' | 'center';
  cellIssue: DataTableProps<Row>['cellIssue'];
  onCellCommit: DataTableProps<Row>['onCellCommit'];
}

/** The value itself, in the form its resolved parts call for. */
export interface CellValueProps<Row> extends CellInput<Row> {
  parts: CellParts;
  onCellCommit: DataTableProps<Row>['onCellCommit'];
}

/** A live cell's editor. */
export interface CellEditorProps<Row> extends CellInput<Row> {
  issue: TranslatedText | null;
  onCommit: NonNullable<DataTableProps<Row>['onCellCommit']>;
}
