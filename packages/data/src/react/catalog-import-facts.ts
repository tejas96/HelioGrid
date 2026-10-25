import type { CatalogImportWire } from '@heliogrid/contracts';
import {
  CATALOG_IMPORT_FIELDS,
  CATALOG_IMPORT_STATES,
  type CatalogImportMapping,
  type CatalogImportState,
  FILE_SUBJECT_RULES,
  type FileDeclarationVerdict,
} from '@heliogrid/domain';

/*
 * What `useCatalogImport` hands a screen and reads off the wire (`SCR-M01-17`): the chosen file,
 * where its upload stands, and a job's state and mapping as this build knows them.
 */

/** A spreadsheet as a device hands it over: its name and saved date as its picker gives them. */
export interface ChosenSpreadsheet {
  readonly name: string;
  /** ISO date-time the device's picker reports the file was saved, or `null` where it gives none. */
  readonly savedAt: string | null;
  readonly contentType: string;
  readonly bytes: Uint8Array;
}

/** Where a chosen file stands before its job exists. */
export type ImportUpload =
  | { readonly state: 'idle' }
  | {
      readonly state: 'refused';
      readonly name: string;
      readonly refusal: Exclude<FileDeclarationVerdict, 'accepted'>;
    }
  | { readonly state: 'storing'; readonly name: string }
  | { readonly state: 'failed'; readonly name: string };

/** The act that came back refused, and whether the job moved under it (a 409). */
export interface ImportActFailure {
  readonly act: 'map' | 'run';
  readonly conflict: boolean;
}

/** A job's state as this build knows it; a state a later server adds reads as past the run. */
export function stateOf(job: CatalogImportWire | undefined): CatalogImportState {
  return CATALOG_IMPORT_STATES.find((state) => state === job?.status) ?? 'completed';
}

export const IN_FLIGHT: readonly CatalogImportState[] = ['reading', 'matching', 'running'];

/** A confirmed mapping as this build knows it: a field a later server adds is left unplaced. */
export function mappingOf(
  wire: CatalogImportWire['mapping'] | undefined,
): CatalogImportMapping | null {
  if (wire === null || wire === undefined) return null;
  const known = (field: string | null) =>
    CATALOG_IMPORT_FIELDS.find((name) => name === field) ?? null;
  return { sheet: wire.sheet, headerRow: wire.headerRow, columns: wire.columns.map(known) };
}

/** The types a price list is taken in: the catalog subject's own list. */
export const SPREADSHEET_TYPES = FILE_SUBJECT_RULES.catalog.contentTypes;
export type SpreadsheetType = (typeof SPREADSHEET_TYPES)[number];
