import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import type { ImportAct } from '../Import/Import.types';
import type { ShareFilterItem } from '../ShareFilter/ShareFilter.types';
import type { LeadImportProps, LeadImportRow, LeadImportWords } from './LeadImport.types';

/**
 * What both halves of the wizard draw from its props (`SCR-M02-05`): each frame's act, the
 * preview's parts, and what a row's mark says. Pure: no markup, no data access.
 */

/**
 * The room from which the wizard draws its desktop frames — two columns, the rows as a table: the
 * page's own width once the desktop shell's sidebar takes its share, as the inbox's stage.
 */
export const WIDE_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];

/** The frames that draw no step act of their own: the run's report carries its acts in its hero. */
export function leadImportActOf(props: LeadImportProps): ImportAct | null {
  const { frame, words } = props;
  const gate = props.gate === null ? null : words.gates[props.gate];
  const step = (line: TranslatedText | null): ImportAct => ({
    label: words.continue,
    gate,
    onPress: props.onContinue,
    secondary: false,
    line,
    leading: 'back',
  });
  switch (frame) {
    case 'file':
      return step(words.nextColumns);
    case 'columns':
      return step(words.nextCounts);
    case 'preview':
      return runActOf(props);
    case 'running':
      return {
        label: words.backToLeads,
        gate: null,
        onPress: props.onLeave,
        secondary: true,
        line: words.keepsGoing,
        leading: 'close',
      };
    case 'report':
      return null;
    default:
      return step(null);
  }
}

/** *Import 310 leads* — or, when the run only logs, *Log 90 enquiries* — waiting while out. */
function runActOf({ plan, runGate, runOut, words, onRun }: LeadImportProps): ImportAct {
  const create = plan?.create ?? 0;
  const log = plan?.log ?? 0;
  return {
    label: create === 0 && log > 0 ? words.logEnquiries(log) : words.importLeads(create),
    gate: runOut ? words.importing : runGate === null ? null : words.gates[runGate],
    onPress: onRun,
    secondary: false,
    line: words.nothingYet,
    leading: 'back',
  };
}

/** The preview's parts — new leads, duplicates, rows that cannot be read — each a filter. */
export function previewPartsOf(
  figures: { readonly create: number; readonly duplicates: number; readonly rejected: number },
  words: LeadImportWords,
): ShareFilterItem[] {
  const part = (
    id: 'new' | 'duplicate' | 'rejected',
    count: number,
    hue: ShareFilterItem['hue'],
  ): ShareFilterItem => ({
    id,
    label: words.parts[id],
    accessibleLabel: words.partLabel(words.parts[id], count),
    count,
    hue,
    asks: id === 'rejected',
  });
  const parts = [
    part('new', figures.create, 'ocean'),
    part('duplicate', figures.duplicates, 'teal'),
  ];
  return figures.rejected === 0 ? parts : [...parts, part('rejected', figures.rejected, 'warning')];
}

/** A row's mark: what happens to it, in a word with its glyph and tint. */
export function fateMarkOf(
  row: LeadImportRow,
  words: LeadImportWords,
): { readonly tone: StatusTone; readonly label: TranslatedText } {
  switch (row.fate) {
    case 'new_lead':
      return { tone: 'success', label: words.fates.new_lead };
    case 'landed':
      return { tone: 'success', label: words.fates.landed };
    case 'logged':
      return { tone: 'info', label: words.fates.logged };
    case 'skipped':
      return { tone: 'neutral', label: words.fates.skipped };
    case 'rejected':
      return { tone: 'warning', label: words.problems[row.problems[0] ?? 'malformed_row'] };
    default:
      return {
        tone: 'info',
        label:
          row.repeatsRow === null ? words.fates.already_here : words.repeatsRow(row.repeatsRow),
      };
  }
}

/** The line under a duplicate's mark: what the choice does with it. */
export function fateLineOf(row: LeadImportRow, words: LeadImportWords): TranslatedText | null {
  if (row.fate === 'will_skip') return words.willSkip;
  if (row.fate === 'will_log') return words.willLog;
  if (row.fate === 'rejected') return words.problemLines[row.problems[0] ?? 'malformed_row'];
  return null;
}

/** How many of the file's columns the import reads. */
export function columnsUsedOf(props: Pick<LeadImportProps, 'columns'>): {
  readonly used: number;
  readonly of: number;
} {
  const all = [...props.columns.open, ...props.columns.matched];
  return { used: all.filter((column) => column.field !== null).length, of: all.length };
}
