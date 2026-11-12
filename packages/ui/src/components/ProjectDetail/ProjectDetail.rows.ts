import type {
  ProjectDetail as ProjectDetailFacts,
  ProjectFile,
  TranslatedText,
} from '@heliogrid/contracts';
import type { StatusTone } from '../../primitives/StatusMark';
import type { MarketFormat } from '../../utils/format';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { ButtonVariant } from '../Button/Button.types';
import type { HueTileProps } from '../HueTile/HueTile.types';
import type { SwitchProps } from '../Switch/Switch.types';
import { documentToneOf, samePlace, TILE_STROKE } from './ProjectDetail.logic';
import type { ProjectDetailProps, ProjectFilePlace } from './ProjectDetail.types';

type ProjectDocument = ProjectDetailFacts['documents'][number];

/** One of a row's small acts; a press while a send is out sends nothing. */
export interface DetailRowAct {
  readonly key: string;
  readonly label: TranslatedText;
  /** What a screen reader says: the words with the row they act on, so no two acts sound alike. */
  readonly spoken: TranslatedText | null;
  readonly variant: ButtonVariant;
  readonly glyph: ShellGlyphName | null;
  /**
   * The glyph alone says the act — a card's add — so it is drawn as a round icon that speaks
   * `spoken` (`ui-adherence.md`); a row's own act keeps its word.
   */
  readonly iconOnly: boolean;
  readonly loading: boolean;
  readonly onPress: () => void;
}

/**
 * One row of a project's card — a checklist row or a file — as both halves draw it: its tile, its
 * name and the line under it, and at its end a state as glyph and word, a quiet caption, its acts or
 * its *Show to customer*.
 */
export interface DetailRow {
  readonly key: string;
  /** The row's name in words, or — a file's row — the file itself, opened by its name. */
  readonly name: TranslatedText | ProjectFile;
  readonly tile: HueTileProps;
  /** The line under the name: what it moves, why it is not needed, who added it. */
  readonly sub: string | null;
  readonly files: readonly ProjectFile[];
  readonly mark: { readonly tone: StatusTone; readonly label: TranslatedText } | null;
  readonly caption: TranslatedText | null;
  readonly acts: readonly DetailRowAct[];
  /** *Show to customer*, on a file of the project's own that the reader may share. */
  readonly show: SwitchProps | null;
  /** A file sent to this row's place did not reach the project. */
  readonly notSent: boolean;
  /** The row's upload is out. */
  readonly busy: boolean;
}

/** A press that waits while a send is out. */
export function idleOf(sending: boolean) {
  return (press: () => void) => () => {
    if (!sending) press();
  };
}

/** An act with no glyph, no spoken name of its own and no wait of its own. */
export function plainAct(
  key: string,
  label: TranslatedText,
  variant: ButtonVariant,
): Omit<DetailRowAct, 'onPress'> {
  return { key, label, spoken: null, variant, glyph: null, iconOnly: false, loading: false };
}

/** The line under a checklist row: who uploaded it when, why it is not needed, what it moves. */
function documentSubOf(
  document: ProjectDocument,
  waiting: boolean,
  { words }: ProjectDetailProps,
  format: MarketFormat,
): string | null {
  if (document.state === 'not_needed' && document.reason !== null) {
    return words.notNeededBecause(document.reason);
  }
  if (document.state === 'done' && document.changedBy !== null) {
    return words.uploadedBy(document.changedBy.name, format.date(document.changedAt));
  }
  if (waiting && document.movesTo !== null) return words.movesProject(document.movesTo);
  return null;
}

/**
 * A checklist row (the picked design): its file tile, its name and line, and at its end *Done*,
 * *Not needed*, *Made at handover* — or, waiting, *Upload* and a quiet *Not needed*, each spoken
 * with its row. *Not needed* stays a visible act: the design's press-and-hold would hide it.
 */
export function documentRowOf(
  document: ProjectDocument,
  props: ProjectDetailProps,
  format: MarketFormat,
): DetailRow {
  const { project, words, uploading, uploadFailed } = props;
  const place: ProjectFilePlace = { slot: 'document', slotKey: document.row };
  const handover = document.state === 'pending' && document.madeBy === 'handover';
  const waiting = document.state === 'pending' && !handover;
  return {
    key: document.row,
    name: words.row(document.row),
    tile: { glyph: 'file', hue: documentToneOf(document), size: 36, stroke: TILE_STROKE },
    sub: documentSubOf(document, waiting, props, format),
    files: props.documents === 'all' ? document.files : [],
    mark: markOf(document, props),
    caption: handover ? words.madeAtHandover : null,
    acts: project.acts.documents ? documentActsOf(document, waiting, place, props) : [],
    show: null,
    notSent: samePlace(uploadFailed, place),
    busy: samePlace(uploading, place),
  };
}

function markOf(document: ProjectDocument, { words }: ProjectDetailProps): DetailRow['mark'] {
  if (document.state === 'done') return { tone: 'success', label: words.done };
  if (document.state === 'not_needed') return { tone: 'neutral', label: words.notNeeded };
  return null;
}

function documentActsOf(
  document: ProjectDocument,
  waiting: boolean,
  place: ProjectFilePlace,
  { words, sending, uploading, onUpload, onNotNeeded, onReopen }: ProjectDetailProps,
): DetailRowAct[] {
  const idle = idleOf(sending);
  const { row } = document;
  if (waiting) {
    return [
      {
        key: 'upload',
        label: words.upload,
        spoken: words.uploadRow(row),
        variant: 'secondary',
        glyph: 'upload',
        iconOnly: false,
        loading: samePlace(uploading, place),
        onPress: idle(() => onUpload(place)),
      },
      {
        ...plainAct('notNeeded', words.notNeededAct, 'ghost'),
        spoken: words.notNeededRow(row),
        onPress: idle(() => onNotNeeded(row)),
      },
    ];
  }
  if (document.state !== 'not_needed') return [];
  return [
    {
      ...plainAct('reopen', words.undoNotNeeded, 'ghost'),
      spoken: words.reopenRow(row),
      onPress: idle(() => onReopen(row)),
    },
  ];
}

/** A file's tile: a photo's camera, else the sheet. */
function fileGlyphOf(file: ProjectFile): ShellGlyphName {
  return file.contentType.startsWith('image/') ? 'camera' : 'file';
}

/** The other files (ruling 8): the project's own with *Show to customer*, then the lead's. */
export function fileRowsOf(
  { project, words, sending, onShowFile }: ProjectDetailProps,
  switches: boolean,
): DetailRow[] {
  const files = [
    ...project.otherFiles.map((file) => ({ file, fromLead: false })),
    ...project.leadFiles.map((file) => ({ file, fromLead: true })),
  ];
  return files.map(({ file, fromLead }) => {
    const show: SwitchProps = {
      label: words.showToCustomer,
      ariaLabel: words.showFile(file.name),
      checked: file.shownToCustomer,
      disabled: sending,
      onChange: (shown) => onShowFile(file, shown),
    };
    const addedBy = file.addedBy === null ? null : words.addedBy(file.addedBy.name);
    return {
      key: file.id,
      name: file,
      tile: { glyph: fileGlyphOf(file), hue: 'neutral', size: 36, stroke: TILE_STROKE },
      sub: fromLead ? words.fromLead : addedBy,
      files: [],
      mark: null,
      caption: null,
      acts: [],
      show: switches && !fromLead && project.acts.documents ? show : null,
      notSent: false,
      busy: false,
    };
  });
}
