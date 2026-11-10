import type { CatalogImportRowWire, CatalogImportWire, TranslatedText } from '@heliogrid/contracts';
import {
  CATALOG_IMPORT_FIELDS,
  type CatalogImportField,
  type CatalogImportMapping,
  type ImportColumnViews,
  importColumnViews,
  importReadyCount,
  mappingForHeader,
} from '@heliogrid/domain';
import type { ImportFormats } from '../Import/Import.types';
import { type ImportCardView, listRowOf } from './CatalogImport.logic';
import type {
  CatalogImportProps,
  CatalogImportWords,
  ImportGroupId,
  ImportRowList,
} from './CatalogImport.types';

/**
 * What the wizard's lists and columns draw, beyond a single row (`SCR-M01-17`): the act's count, a
 * group line's sample, the columns step's two sections. Pure: no markup, no data access.
 */

/** The rows a list holds: none until its read is in. */
export function rowsOf(list: ImportRowList): readonly CatalogImportRowWire[] {
  return list.read.kind === 'ready' ? list.read.value : [];
}

/** The list's read or its next page failed: *Try again* stands where its rows or *Show more* would. */
export function listFailed(list: ImportRowList): boolean {
  return list.read.kind === 'failed';
}

const READY_GROUPS: readonly ImportGroupId[] = ['overrides', 'newItems'];

/**
 * The N of *Import N rows*. A previewed job counts its ready rows; a completed job taken back into
 * the preview (*Fix the N rows*) counts only the open rows its fix scope reads as ready now.
 */
export function readyNowOf(props: Pick<CatalogImportProps, 'frame' | 'job' | 'lists'>): number {
  const { job } = props;
  if (job === null) return 0;
  if (props.frame === 'preview' && job.status === 'completed') {
    return (
      props.lists.ready ??
      props.lists.groups
        .filter((group) => READY_GROUPS.includes(group.id))
        .reduce((sum, group) => sum + group.total, 0)
    );
  }
  return job.counts === null ? 0 : importReadyCount(job.counts);
}

/** One entry of a group line's sample: the row's name and its price change, or `null`. */
export interface ImportSampleItem {
  readonly rowNumber: number;
  readonly name: string;
  readonly was: string | null;
  readonly now: string | null;
}

const SAMPLE_SIZE = 3;

/** A closed group's sample: its first rows, each named with its price change. */
export function groupSampleOf(
  rows: readonly CatalogImportRowWire[],
  words: CatalogImportWords,
  formats: ImportFormats,
  phase: 'preview' | 'report',
): readonly ImportSampleItem[] {
  return rows.slice(0, SAMPLE_SIZE).map((row) => {
    const view = listRowOf(row, words, formats, phase);
    return { rowNumber: view.rowNumber, name: view.title, was: view.was, now: view.now };
  });
}

/**
 * Whether a *Which product is it?* card can be answered by its choice: the pick sends the
 * candidate's kind, so two candidates of one kind cannot be told apart and only *Leave out*
 * answers.
 */
export function pickAnswers(card: ImportCardView): boolean {
  const kinds = card.options.map((option) => option.value);
  return new Set(kinds).size === kinds.length;
}

const SCOPES: Readonly<Record<'preview' | 'report', readonly string[]>> = {
  preview: ['overrides', 'newItems', 'attention'],
  report: ['imported', 'leftOut', 'failed'],
};

/**
 * The scope the step can show: a filter pressed in the preview means nothing on the report, so the
 * report opens unscoped rather than empty.
 */
export function scopeIn(scope: string | null, frame: CatalogImportProps['frame']): string | null {
  const phase = frame === 'report' ? 'report' : frame === 'preview' ? 'preview' : null;
  return phase !== null && scope !== null && SCOPES[phase].includes(scope) ? scope : null;
}

/** The lists a scope shows: the report's *Imported* is its two written groups. */
export function groupsInScope(
  groups: readonly (ImportRowList & { readonly id: ImportGroupId })[],
  scope: string | null,
) {
  // A group with no row draws no line: *Failed · 0 rows* says nothing the overview does not.
  const held = groups.filter(
    (group) => group.total > 0 || group.read.kind === 'loading' || listFailed(group),
  );
  if (scope === null) return held;
  const ids: readonly string[] = scope === 'imported' ? ['applied', 'created'] : [scope];
  return held.filter((group) => ids.includes(group.id));
}

/**
 * The columns step's two sections, by the catalog's guess for the header row: the columns it could
 * not place, above the ones it matched.
 */
export function columnsOf(
  job: CatalogImportWire | null,
  mapping: CatalogImportMapping | null,
): ImportColumnViews<CatalogImportField> {
  return importColumnViews(job?.sheets ?? null, mapping, mappingForHeader);
}

/** The catalog's fields as the columns step's choice lists them, each with its word. */
export function columnFieldsOf(
  words: CatalogImportWords,
): readonly { readonly value: CatalogImportField; readonly label: TranslatedText }[] {
  return CATALOG_IMPORT_FIELDS.map((field) => ({ value: field, label: words.fields[field] }));
}
