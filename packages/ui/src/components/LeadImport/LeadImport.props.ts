import { LEAD_IMPORT_FIELDS, type LeadImportField } from '@heliogrid/domain';
import type { DataTableProps } from '../DataTable/DataTable.types';
import type {
  ImportColumnsProps,
  ImportFileStepProps,
  ImportFootProps,
  ImportFormats,
} from '../Import/Import.types';
import type { OptionCardGroupProps } from '../OptionCardGroup/OptionCardGroup.types';
import type { ShareFilterProps } from '../ShareFilter/ShareFilter.types';
import type { StepperProps } from '../Stepper/Stepper.types';
import { type LeadImportTableRow, tableRowsOf } from './LeadImport.columns';
import { leadImportActOf, previewPartsOf } from './LeadImport.logic';
import type { LeadImportProps } from './LeadImport.types';

/**
 * What the wizard hands each part it draws, built once for both halves (`SCR-M02-05`): the halves
 * differ in their room and their markup, never in what a part is told. Pure: no markup.
 */

/**
 * The four-step track: each step's marker beside its name in the desk's room; below it — every
 * phone — each name under its own bar, since four markers and names in one row of 343 left no
 * room for the names.
 */
export function stepperOf({ words, step }: LeadImportProps, wide: boolean): StepperProps {
  return {
    variant: wide ? 'numbered' : 'numbered-bars',
    steps: [...words.steps],
    current: step,
    label: words.stepsLabel,
    words: words.stepper,
  };
}

/** The step's act and its line, with the way back — or, on the first step, the way out. */
export function footOf(props: LeadImportProps, wide: boolean): ImportFootProps {
  return {
    act: leadImportActOf(props),
    quiet: null,
    wide,
    frame: props.frame,
    words: props.words,
    onClose: props.onLeave,
    onBack: props.onBack,
  };
}

/** Step 1: the file, its sheet and its header row. The lead import keeps no reports to reopen. */
export function fileStepOf(
  props: LeadImportProps,
  wide: boolean,
  formats: ImportFormats,
): ImportFileStepProps {
  return {
    frame: props.frame,
    words: props.words,
    wide,
    formats,
    job: props.job,
    mapping: props.sheetPick,
    upload: props.upload,
    onFiles: props.onFiles,
    ...(props.onRequestFiles === undefined ? {} : { onRequestFiles: props.onRequestFiles }),
    onReplace: props.onReplace,
    onSheet: props.onSheet,
    onHeaderRow: props.onHeaderRow,
    kept: null,
    onOpenKept: () => undefined,
  };
}

/** Step 2: each column with its header, two first values and the lead field it fills. */
export function columnsStepOf(
  props: LeadImportProps,
  wide: boolean,
): ImportColumnsProps<LeadImportField> {
  const { words } = props;
  return {
    words,
    fields: LEAD_IMPORT_FIELDS.map((field) => ({ value: field, label: words.fields[field] })),
    columns: props.columns,
    samples: true,
    wide,
    onPlace: props.onPlace,
  };
}

/** The preview's parts, each a filter onto its rows: rings on the phone's room, a bar on the desk's. */
export function partsFilterOf(
  props: LeadImportProps,
  layout: ShareFilterProps['layout'],
): ShareFilterProps | null {
  const { figures, words } = props;
  if (figures === null) return null;
  const items = previewPartsOf(figures, words);
  return {
    layout,
    label: words.willDo,
    barLabel: words.barSentence(items.map(({ label, count }) => ({ label, count }))),
    items,
    pressed: props.scope,
    onPress: props.onScope,
  };
}

/** The one duplicate choice: *Skip* by default, or *Log as enquiry* — waiting while the run is out. */
export function duplicateChoiceOf(
  props: LeadImportProps,
  duplicates: number,
): OptionCardGroupProps {
  const { words } = props;
  return {
    ariaLabel: words.choiceHeading(duplicates),
    density: 'functional',
    disabled: props.runOut,
    value: props.choice,
    onChange: props.onChoice,
    options: [
      {
        value: 'skip',
        title: words.choices.skip.title,
        description: words.choices.skip.line,
        meta: words.byDefault,
      },
      {
        value: 'log_enquiry',
        title: words.choices.log_enquiry.title,
        description: words.choices.log_enquiry.line,
      },
    ],
  };
}

type RowsTable = Pick<
  DataTableProps<LeadImportTableRow>,
  | 'rows'
  | 'rowKey'
  | 'read'
  | 'words'
  | 'density'
  | 'head'
  | 'emptyTitle'
  | 'errorTitle'
  | 'retryLabel'
  | 'unavailableTitle'
>;

/** The rows' table but its columns, whose marks each half draws: its read, its words, its rows. */
export function rowsTableOf(props: LeadImportProps, phase: 'preview' | 'report'): RowsTable {
  const { rows, words } = props;
  return {
    rows: tableRowsOf(rows.read.kind === 'ready' ? rows.read.value : []),
    rowKey: 'id',
    read: rows.read,
    words: words.table,
    density: 'compact',
    head: 'quiet',
    emptyTitle: phase === 'report' ? words.noneRejected : words.noRowsHere,
    errorTitle: words.rowsFailed,
    retryLabel: words.tryAgain,
    unavailableTitle: words.rowsFailed,
  };
}
