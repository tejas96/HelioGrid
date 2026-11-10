/**
 * The spreadsheet import every module shares (`M01-41`, `M02-18`): the sheet a read step counts, the
 * header guess, the confirmed mapping and the rows it reads. Each import supplies its own fields,
 * their header words and the fields it requires; the catalog and the lead import draw this one.
 */

export type { HeaderWords, ImportColumnGuess, ImportColumnGuesser } from './columns';
export { columnKey, importColumnGuesser } from './columns';
export type { ImportColumnView, ImportColumnViews, ImportPlacedHeader } from './columns-view';
export { importColumnViews, placedHeadersOf } from './columns-view';
export type {
  ImportCells,
  ImportColumnsProblem,
  ImportMappedRow,
  ImportMapping,
  ImportMappingProblem,
} from './mapping';
export { columnsProblemOf, mappedRows, mappingProblemOf, sameImportMapping } from './mapping';
export type { ImportSheet } from './sheet';
export { HEADER_ROW_SCAN } from './sheet';
