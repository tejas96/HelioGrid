import type { ImportMapping } from './mapping';
import type { ImportSheet } from './sheet';
import { isBlank } from './text';

/**
 * The columns step as every import draws it (`M01-41`, `M02-18`): each column by the file's own
 * header, the first values under it, and the field it fills now.
 */

/** How many of a column's first values the step shows under its header: enough to tell it apart. */
const SAMPLE_COUNT = 2;

export interface ImportColumnView<Field extends string> {
  readonly column: number;
  /** The header exactly as the file wrote it — data, never translated. */
  readonly header: string;
  /** The first filled values under the header among the sheet's top rows, as the file wrote them. */
  readonly samples: readonly string[];
  readonly field: Field | null;
}

export interface ImportColumnViews<Field extends string> {
  /** The columns the device's guess could not place: the person places these first. */
  readonly open: readonly ImportColumnView<Field>[];
  /** The columns it matched, to be checked once. */
  readonly matched: readonly ImportColumnView<Field>[];
}

/** The guess an import makes for one header row of one sheet (`ImportColumnGuesser`). */
type GuessForHeader<Field extends string> = (
  sheets: readonly ImportSheet[],
  sheet: number,
  headerRow: number,
) => ImportMapping<Field>;

/**
 * The step's two sections, by what the device guessed for this header row — never by what the
 * person has placed since — so a column stays in its section while it is changed and nothing jumps.
 */
export function importColumnViews<Field extends string>(
  sheets: readonly ImportSheet[] | null,
  mapping: ImportMapping<Field> | null,
  guessFor: GuessForHeader<Field>,
): ImportColumnViews<Field> {
  const sheet = mapping === null ? undefined : sheets?.[mapping.sheet];
  if (sheets === null || mapping === null || sheet === undefined) return { open: [], matched: [] };
  const header = sheet.topRows[mapping.headerRow] ?? [];
  const below = sheet.topRows.slice(mapping.headerRow + 1);
  const guess = guessFor(sheets, mapping.sheet, mapping.headerRow).columns;
  const columns = Array.from({ length: sheet.columnCount }, (_, column) => ({
    column,
    header: header[column] ?? '',
    samples: below
      .map((row) => row[column])
      .filter((cell): cell is string => !isBlank(cell))
      .slice(0, SAMPLE_COUNT),
    field: mapping.columns[column] ?? null,
  }));
  return {
    open: columns.filter((view) => (guess[view.column] ?? null) === null),
    matched: columns.filter((view) => (guess[view.column] ?? null) !== null),
  };
}

/** A column the import reads: its header as the file wrote it, and the field it fills. */
export interface ImportPlacedHeader<Field extends string> {
  readonly column: number;
  readonly header: string;
  readonly field: Field;
}

/**
 * The columns the import reads, in the file's own order — the headers a report names each row's
 * cells under, so a row is easy to find in the file and fix.
 */
export function placedHeadersOf<Field extends string>(
  views: ImportColumnViews<Field>,
): readonly ImportPlacedHeader<Field>[] {
  return [...views.open, ...views.matched]
    .flatMap(({ column, header, field }) => (field === null ? [] : [{ column, header, field }]))
    .sort((a, b) => a.column - b.column);
}
