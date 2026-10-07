import type { CatalogImportSheet } from './import';
import type { CatalogImportCells, CatalogImportField } from './import-columns';
import { isBlank } from './import-text';

/**
 * The mapping the person confirms in the import wizard's step 2 (`M01-41`): which sheet, which of
 * its top rows is the header, and which field each column fills. Client-safe, so the wizard holds
 * its confirm to the same rule the server refuses with (Law 11).
 */
export interface CatalogImportMapping {
  /** An index into the job's `sheets`. */
  readonly sheet: number;
  /** An index into that sheet's `topRows`: the header is sheet row `headerRow + 1`. */
  readonly headerRow: number;
  /** The field column `i + 1` fills, or null for a column the import leaves. */
  readonly columns: readonly (CatalogImportField | null)[];
}

/** Without these a row names no product and no price, so a mapping must place each of them. */
const REQUIRED_FIELDS: readonly CatalogImportField[] = ['brand', 'model', 'rate'];

export type CatalogImportColumnsProblem = 'required_field_unplaced' | 'field_placed_twice';

export type CatalogImportMappingProblem =
  | CatalogImportColumnsProblem
  | 'sheet_missing'
  | 'header_row_outside_top_rows'
  | 'more_columns_than_sheet';

/** Two columns filling one field would fight over its value, so a field is placed once at most. */
export function importColumnsProblem(
  columns: readonly (CatalogImportField | null)[],
): CatalogImportColumnsProblem | null {
  const placed = columns.filter((field) => field !== null);
  if (new Set(placed).size !== placed.length) return 'field_placed_twice';
  if (REQUIRED_FIELDS.some((field) => !placed.includes(field))) return 'required_field_unplaced';
  return null;
}

/**
 * Whether the mapping fits the sheets the read step counted. The header must be one of the top rows
 * the device placed it on, and no column may lie past the last the sheet fills.
 */
export function importMappingProblem(
  mapping: CatalogImportMapping,
  sheets: readonly CatalogImportSheet[],
): CatalogImportMappingProblem | null {
  const columnsProblem = importColumnsProblem(mapping.columns);
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
export interface CatalogImportMappedRow {
  readonly rowNumber: number;
  readonly cells: CatalogImportCells;
}

/**
 * Every row below the header whose mapped cells hold any text, numbered as the sheet numbers it, so
 * the preview names the row the person sees in their file. `sheetRows[i]` is sheet row `i + 1`.
 * Cells stay exactly as the file wrote them; the matching pass trims what it compares.
 */
export function mappedRows(
  sheetRows: readonly (readonly string[])[],
  mapping: CatalogImportMapping,
): readonly CatalogImportMappedRow[] {
  return sheetRows.flatMap((row, index) => {
    if (index <= mapping.headerRow) return [];
    const cells: Partial<Record<CatalogImportField, string>> = {};
    mapping.columns.forEach((field, column) => {
      const cell = row[column];
      if (field !== null && !isBlank(cell)) cells[field] = cell;
    });
    return Object.keys(cells).length === 0 ? [] : [{ rowNumber: index + 1, cells }];
  });
}

/** Whether two mappings read the sheet the same way, so a second send of one starts no new pass. */
export function sameImportMapping(
  stored: CatalogImportMapping | null,
  sent: CatalogImportMapping,
): boolean {
  return (
    stored !== null &&
    stored.sheet === sent.sheet &&
    stored.headerRow === sent.headerRow &&
    stored.columns.length === sent.columns.length &&
    stored.columns.every((field, column) => field === sent.columns[column])
  );
}
