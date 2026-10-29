import type { CatalogImportWire, TranslatedText } from '@heliogrid/contracts';
import {
  type CatalogImportMapping,
  FILE_MAX_BYTES,
  FILE_SUBJECT_RULES,
  importReadyCount,
  importRowsToFix,
} from '@heliogrid/domain';
import type { ShareFilterItem } from '../ShareFilter/ShareFilter.types';
import type { ImportFormats } from './CatalogImport.logic';
import type { CatalogImportProps, CatalogImportWords, ImportGroupId } from './CatalogImport.types';

/** The overview, the step's act and the file chip, from the job (`SCR-M01-17`). Pure. */

/** What a price list's chooser takes: the catalog file rule's types, with their extensions. */
export const IMPORT_FILE_ACCEPT = [
  '.xlsx',
  '.csv',
  ...FILE_SUBJECT_RULES.catalog.contentTypes,
].join(',');

/** The catalog file rule's ceiling in MB, as the hint and the refusal state it. */
export const IMPORT_FILE_MAX_MB = FILE_MAX_BYTES / 1_000_000;

const NO_COUNTS = { rows: 0, matched: 0, newItems: 0, needsAttention: 0, leftOut: 0 };
const NO_RESULTS = { priceApplied: 0, productCreated: 0, leftOut: 0, failed: 0 };

/** One part of the overview: its words, its count and its hue. */
function partOf(
  words: CatalogImportWords,
  id: ImportGroupId,
  count: number,
  hue: ShareFilterItem['hue'],
): ShareFilterItem {
  const label = words.groups[id];
  return {
    id,
    label,
    accessibleLabel: words.ringLabel(label, count),
    count,
    hue,
    asks: id === 'attention',
  };
}

/** The overview's figures and its filters, for the preview or the report. */
export function overviewOf(
  job: CatalogImportWire,
  phase: 'preview' | 'report',
  words: CatalogImportWords,
) {
  const counts = job.counts ?? NO_COUNTS;
  const results = job.results ?? NO_RESULTS;
  const filters =
    phase === 'preview'
      ? [
          partOf(words, 'overrides', counts.matched, 'blue'),
          partOf(words, 'newItems', counts.newItems, 'violet'),
          partOf(words, 'attention', counts.needsAttention, 'warning'),
        ]
      : [
          partOf(words, 'imported', results.priceApplied + results.productCreated, 'success'),
          partOf(words, 'leftOut', results.leftOut, 'warning'),
          partOf(words, 'failed', results.failed, 'danger'),
        ];
  const ready = importReadyCount(counts);
  const written = words.written(results.priceApplied, results.productCreated);
  const preview = phase === 'preview';
  return {
    heading: words.heading(counts.rows),
    short: preview ? words.readyShort(ready) : written,
    long: preview ? words.readyLong(ready, counts.needsAttention) : written,
    filters,
    label: preview ? words.willDo : words.didDo,
    barLabel: words.barSentence(filters.map(({ label, count }) => ({ label, count }))),
  };
}

/** The rows *Fix the N rows* takes back: every row the run left open. */
export const openRowsOf = (job: CatalogImportWire) =>
  job.results === null ? 0 : importRowsToFix(job.results);

/** The step's act, its gate and its line, per frame. */
export function actOf(props: CatalogImportProps, readyNow: number) {
  const { frame, words, gate, job } = props;
  const gated = (label: TranslatedText, line: TranslatedText | null, onPress: () => void) => ({
    label,
    gate: gate === null ? null : words.gates[gate],
    onPress,
    secondary: false,
    line,
    leading: 'back' as const,
  });
  switch (frame) {
    case 'empty':
    case 'reading':
    case 'unreadable':
      return gated(words.continue, null, props.onContinue);
    case 'file':
      return gated(words.continue, words.nextColumns, props.onContinue);
    case 'columns':
      return gated(words.continue, words.nextRows, props.onContinue);
    case 'matching':
      return gated(words.continue, null, props.onContinue);
    case 'preview':
      return {
        label: words.importRows(readyNow),
        gate: readyNow === 0 ? words.gates.nothing_ready : null,
        onPress: props.onRun,
        secondary: false,
        line: words.undoLine,
        leading: 'back' as const,
      };
    case 'running':
      return {
        label: words.stopWatching,
        gate: null,
        onPress: props.onStopWatching,
        secondary: true,
        line: words.keepsRunning,
        leading: 'close' as const,
      };
    case 'report': {
      const open = job === null ? 0 : openRowsOf(job);
      return open === 0 || props.opening
        ? null
        : {
            label: words.fixRows(open),
            gate: null,
            onPress: props.onFixOpenRows,
            secondary: false,
            line: words.kept,
            leading: 'close' as const,
          };
    }
  }
}

/** The file chip and the panel's subtitle. */
export function fileOf(
  job: CatalogImportWire,
  words: CatalogImportWords,
  formats: ImportFormats,
  /** The person's sheet and header row before they are confirmed; the job's once they are. */
  draft: CatalogImportMapping | null,
) {
  const mapping = draft ?? job.mapping;
  const sheet = job.sheets?.[mapping?.sheet ?? 0];
  // The rows under the header row, as the person counts their list — the header is not a row.
  const listed = Math.max(0, (sheet?.rowCount ?? 0) - 1 - (mapping?.headerRow ?? 0));
  const rows = job.counts?.rows ?? listed;
  const imported = job.run?.at ?? null;
  return {
    name: job.fileName,
    meta:
      job.status === 'unreadable'
        ? words.fileProblem
        : words.fileMeta(rows, sheet?.columnCount ?? 0),
    unreadable: job.status === 'unreadable',
    subtitle:
      imported === null || job.status !== 'completed'
        ? words.subtitle(job.fileName, rows)
        : words.subtitleImported(
            job.fileName,
            rows,
            formats.date(imported),
            formats.clockAt(imported),
          ),
    stamp:
      imported === null ? null : words.stamp(formats.date(imported), formats.clockAt(imported)),
  };
}
