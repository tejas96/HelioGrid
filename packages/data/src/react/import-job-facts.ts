import {
  CATALOG_IMPORT_STATES,
  type CatalogImportState,
  type FileDeclarationVerdict,
  type ImportMapping,
  SPREADSHEET_CONTENT_TYPES,
} from '@heliogrid/domain';

/*
 * What `useImportJob` hands a screen and reads off the wire, for every import (`SCR-M01-17`,
 * `SCR-M02-05`): the chosen file, where its upload stands, and a job's state and mapping as this
 * build knows them.
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
export function stateOf(job: { readonly status: string } | undefined): CatalogImportState {
  return CATALOG_IMPORT_STATES.find((state) => state === job?.status) ?? 'completed';
}

export const IN_FLIGHT: readonly CatalogImportState[] = ['reading', 'matching', 'running'];

/** A mapping as a job carries it on the wire. */
export interface MappingWire {
  readonly sheet: number;
  readonly headerRow: number;
  readonly columns: readonly (string | null)[];
}

/** A confirmed mapping as this build knows it: a field a later server adds is left unplaced. */
export function mappingOf<Field extends string>(
  wire: MappingWire | null | undefined,
  fields: readonly Field[],
): ImportMapping<Field> | null {
  if (wire === null || wire === undefined) return null;
  const known = (field: string | null) => fields.find((name) => name === field) ?? null;
  return { sheet: wire.sheet, headerRow: wire.headerRow, columns: wire.columns.map(known) };
}

/** The types an import takes a spreadsheet in: every import subject's one list. */
export const SPREADSHEET_TYPES = SPREADSHEET_CONTENT_TYPES;
export type SpreadsheetType = (typeof SPREADSHEET_TYPES)[number];
