import type { CatalogImportWire, TranslatedText } from '@heliogrid/contracts';
import { importReadyCount, importRowsToFix } from '@heliogrid/domain';
import type { ImportAct } from '../Import/Import.types';
import type { ShareFilterItem } from '../ShareFilter/ShareFilter.types';
import type { CatalogImportProps, CatalogImportWords, ImportGroupId } from './CatalogImport.types';

/** The overview and the step's act, from the job (`SCR-M01-17`). Pure. */

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
          partOf(words, 'overrides', counts.matched, 'teal'),
          partOf(words, 'newItems', counts.newItems, 'ocean'),
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
export function actOf(props: CatalogImportProps, readyNow: number): ImportAct | null {
  const { frame, words, gate, job } = props;
  const gated = (
    label: TranslatedText,
    line: TranslatedText | null,
    onPress: () => void,
  ): ImportAct => ({
    label,
    gate: gate === null ? null : words.gates[gate],
    onPress,
    secondary: false,
    line,
    leading: 'back',
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
        leading: 'back',
      };
    case 'running':
      return {
        label: words.stopWatching,
        gate: null,
        onPress: props.onStopWatching,
        secondary: true,
        line: words.keepsRunning,
        leading: 'close',
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
            leading: 'close',
          };
    }
  }
}

/** The line of a report with no act: the kept report still opening, or kept. */
export function quietLineOf(props: CatalogImportProps): TranslatedText | null {
  if (props.opening) return props.words.opening;
  return props.frame === 'report' ? props.words.kept : null;
}
