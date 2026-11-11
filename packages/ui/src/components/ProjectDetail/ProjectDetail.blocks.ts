import type { TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import { documentRowsOf, samePlace } from './ProjectDetail.logic';
import {
  type DetailRow,
  type DetailRowAct,
  documentRowOf,
  fileRowsOf,
  idleOf,
  plainAct,
} from './ProjectDetail.rows';
import type { ProjectDetailProps, ProjectFilePlace } from './ProjectDetail.types';

/**
 * One card of the project page as both halves draw it: its head — a name, a quiet count, its one
 * act — a file that did not reach it, its rows or the line said when there are none, and the way on.
 */
export interface ProjectBlock {
  readonly title: TranslatedText;
  readonly aside: TranslatedText | null;
  readonly act: DetailRowAct | null;
  /** A file sent from the head's act did not reach the project. */
  readonly notSent: boolean;
  readonly rows: readonly DetailRow[];
  /** Said in place of the rows when there are none. */
  readonly none: TranslatedText;
  /** The way to every row, under them. */
  readonly more: DetailRowAct | null;
}

/**
 * The checklist (`SCR-M08-03`): done of all, and its rows — three still waiting with the way to all,
 * or every row (wide, and on its own screen).
 */
export function documentsBlockOf(
  props: ProjectDetailProps,
  rows: 'waiting' | 'all',
  format: MarketFormat,
): ProjectBlock {
  const { project, view, words, onAllDocuments } = props;
  return {
    title: words.documents,
    aside: words.documentsCount(view.documentsDone, view.documentsTotal),
    act: null,
    notSent: false,
    rows: documentRowsOf(project, view, rows).map((row) => documentRowOf(row, props, format)),
    none: words.nothingWaiting,
    more:
      rows === 'waiting' && onAllDocuments !== null
        ? {
            ...plainAct('all', words.seeAllDocuments(view.documentsTotal), 'ghost'),
            onPress: onAllDocuments,
          }
        : null,
  };
}

/** Where a file added to the project goes — among its other files. */
const OTHER_PLACE: ProjectFilePlace = { slot: 'other', slotKey: null };

/**
 * The other files (ruling 8), with *Add* for a reader who may add one, and — where the page has the
 * room, and on the checklist's screen — *Show to customer* on each of the project's own.
 */
export function filesBlockOf(props: ProjectDetailProps, switches: boolean): ProjectBlock {
  const { project, words, sending, uploading, uploadFailed, onUpload } = props;
  const add: DetailRowAct = {
    key: 'add',
    label: words.addFile,
    spoken: words.addFileSpoken,
    variant: 'secondary',
    glyph: 'plus',
    iconOnly: true,
    loading: samePlace(uploading, OTHER_PLACE),
    onPress: idleOf(sending)(() => onUpload(OTHER_PLACE)),
  };
  return {
    title: words.otherFiles,
    aside: null,
    act: project.acts.documents && !props.view.closed ? add : null,
    notSent: samePlace(uploadFailed, OTHER_PLACE),
    rows: fileRowsOf(props, switches),
    none: words.noFiles,
    more: null,
  };
}
