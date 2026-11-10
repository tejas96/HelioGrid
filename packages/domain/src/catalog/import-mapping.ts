import {
  columnsProblemOf,
  type ImportColumnsProblem,
  type ImportMappedRow,
  type ImportMapping,
  type ImportMappingProblem,
  mappingProblemOf,
} from '../import/mapping';
import type { ImportSheet } from '../import/sheet';
import type { CatalogImportField } from './import-columns';

/**
 * The catalog's mapping (`M01-41`): the shared import's mapping over the catalog's fields, held to
 * the fields a catalog row cannot do without.
 */
export type CatalogImportMapping = ImportMapping<CatalogImportField>;
export type CatalogImportColumnsProblem = ImportColumnsProblem;
export type CatalogImportMappingProblem = ImportMappingProblem;
export type CatalogImportMappedRow = ImportMappedRow<CatalogImportField>;

/** Without these a row names no product and no price, so a mapping must place each of them. */
const REQUIRED_FIELDS: readonly CatalogImportField[] = ['brand', 'model', 'rate'];

export function importColumnsProblem(
  columns: readonly (CatalogImportField | null)[],
): CatalogImportColumnsProblem | null {
  return columnsProblemOf(columns, REQUIRED_FIELDS);
}

export function importMappingProblem(
  mapping: CatalogImportMapping,
  sheets: readonly ImportSheet[],
): CatalogImportMappingProblem | null {
  return mappingProblemOf(mapping, sheets, REQUIRED_FIELDS);
}

export { mappedRows, sameImportMapping } from '../import/mapping';
