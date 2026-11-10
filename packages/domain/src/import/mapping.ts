import type { ImportSheet } from './sheet';
import { isBlank } from './text';

/**
 * The mapping a person confirms in an import's columns step (`M01-41`, `M02-18`): which sheet, which
 * of its top rows is the header, and which field each column fills. Generic over the import's own
 * field list, and client-safe, so a wizard holds its confirm to the same rule the server refuses
 * with (Law 11).
 */
export interface ImportMapping<Field extends string> {
  /** An index into the job's `sheets`. */
  readonly sheet: number;
  /** An index into that sheet's `topRows`: the header is sheet row `headerRow + 1`. */
  readonly headerRow: number;
  /** The field column `i + 1` fills, or null for a column the import leaves. */
  readonly columns: readonly (Field | null)[];
}

/** One row's cells by the field each fills, as text — the file's, or the person's fix over it. */
export type ImportCells<Field extends string> = Readonly<Partial<Record<Field, string>>>;

export type ImportColumnsProblem = 'required_field_unplaced' | 'field_placed_twice';

export type ImportMappingProblem =
  | ImportColumnsProblem
  | 'sheet_missing'
  | 'header_row_outside_top_rows'
  | 'more_columns_than_sheet';

/**
 * Two columns filling one field would fight over its value, so a field is placed once at most; and
 * a row without its import's required fields names nothing that import can take.
 */
export function columnsProblemOf<Field extends string>(
  columns: readonly (Field | null)[],
  required: readonly Field[],
): ImportColumnsProblem | null {
  const placed = columns.filter((field) => field !== null);
  if (new Set(placed).size !== placed.length) return 'field_placed_twice';
  if (required.some((field) => !placed.includes(field))) return 'required_field_unplaced';
  return null;
}

/**
 * Whether the mapping fits the sheets the read step counted. The header must be one of the top rows
 * the device placed it on, and no column may lie past the last the sheet fills.
 */
export function mappingProblemOf<Field extends string>(
  mapping: ImportMapping<Field>,
  sheets: readonly ImportSheet[],
  required: readonly Field[],
): ImportMappingProblem | null {
  const columnsProblem = columnsProblemOf(mapping.columns, required);
  if (columnsProblem !== null) return columnsProblem;
  const sheet = sheets[mapping.sheet];
  if (sheet === undefined) return 'sheet_missing';
  if (mapping.headerRow < 0 || mapping.headerRow >= sheet.topRows.length) {
    return 'header_row_outside_top_rows';
  }
  if (mapping.columns.length > sheet.columnCount) return 'more_columns_than_sheet';
  return null;
}

/** One row of the sheet, as the mapping reads it: its own row number and its mapped cells. */
export interface ImportMappedRow<Field extends string> {
  readonly rowNumber: number;
  readonly cells: ImportCells<Field>;
}

/**
 * Every row below the header whose mapped cells hold any text, numbered as the sheet numbers it, so
 * the preview names the row the person sees in their file. `sheetRows[i]` is sheet row `i + 1`.
 * Cells stay exactly as the file wrote them; each import's own pass trims what it compares.
 */
export function mappedRows<Field extends string>(
  sheetRows: readonly (readonly string[])[],
  mapping: ImportMapping<Field>,
): readonly ImportMappedRow<Field>[] {
  return sheetRows.flatMap((row, index) => {
    if (index <= mapping.headerRow) return [];
    const cells: Partial<Record<Field, string>> = {};
    mapping.columns.forEach((field, column) => {
      const cell = row[column];
      if (field !== null && !isBlank(cell)) cells[field] = cell;
    });
    return Object.keys(cells).length === 0 ? [] : [{ rowNumber: index + 1, cells }];
  });
}

/** Whether two mappings read the sheet the same way, so a second send of one starts no new pass. */
export function sameImportMapping<Field extends string>(
  stored: ImportMapping<Field> | null,
  sent: ImportMapping<Field>,
): boolean {
  return (
    stored !== null &&
    stored.sheet === sent.sheet &&
    stored.headerRow === sent.headerRow &&
    stored.columns.length === sent.columns.length &&
    stored.columns.every((field, column) => field === sent.columns[column])
  );
}
