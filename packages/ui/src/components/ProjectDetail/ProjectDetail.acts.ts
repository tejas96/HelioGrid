import type { ProjectFile, TranslatedText } from '@heliogrid/contracts';
import type { NextStep } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import {
  type ProjectSheetAct,
  type ProjectSheetOpen,
  type ProjectSheetScreen,
  projectActFormOf,
} from '../ProjectActSheet/ProjectActSheet.form';
import type { ProjectActSheetProps } from '../ProjectActSheet/ProjectActSheet.types';
import type { ProjectHeadProps, ProjectStepsProps } from './ProjectDetail.parts.types';
import type { ProjectDetailProps, ProjectFilePlace } from './ProjectDetail.types';

/** Every act the project page sends — `useProjectScreen`'s `send`, by shape. */
export type ProjectPageAct =
  | ProjectSheetAct
  | { readonly kind: 'endWait' }
  | { readonly kind: 'moveBack' }
  | { readonly kind: 'reopen'; readonly row: string }
  | { readonly kind: 'tick'; readonly step: string; readonly doneBy: string | null }
  | { readonly kind: 'untick'; readonly step: string }
  | { readonly kind: 'showFile'; readonly projectFileId: string; readonly shown: boolean };

/** What the page reads and sends; `useProjectScreen` satisfies it. */
export interface ProjectPageScreen {
  send(act: ProjectPageAct): void;
  open(sheet: ProjectSheetOpen): void;
  /** The hero's act: done in place, or left to the screen — a document, the steps, the handover. */
  next(
    step: NextStep,
  ):
    | { readonly kind: 'pick'; readonly place: ProjectFilePlace }
    | { readonly kind: 'steps' }
    | { readonly kind: 'handover' }
    | null;
  retryUpload(): void;
}

/**
 * Each platform's own moves: the file chooser, a file opened, the checklist, the steps and the
 * handover, the dialler, *Remind*'s share sheet or copy, and the team's invite for a new crew.
 */
export interface ProjectPageMoves {
  pick(place: ProjectFilePlace): void;
  openFile(file: ProjectFile): void;
  documents(): void;
  steps(): void;
  handover(): void;
  call(): void;
  remind(): void;
  addCrew(): void;
}

type PageActs = Pick<
  ProjectDetailProps,
  | 'onNext'
  | 'onWait'
  | 'onWaitOver'
  | 'onRemind'
  | 'onSteps'
  | 'onUpload'
  | 'onNotNeeded'
  | 'onReopen'
  | 'onShowFile'
  | 'onOpenFile'
  | 'onAllDocuments'
>;

/** The page's acts, wired once for both platforms (Law 11): each press to its send or its sheet. */
export function projectPageActsOf(
  screen: ProjectPageScreen,
  moves: ProjectPageMoves,
  documents: ProjectDetailProps['documents'],
): PageActs {
  return {
    onNext: (step) => {
      const answer = screen.next(step);
      if (answer?.kind === 'pick') moves.pick(answer.place);
      if (answer?.kind === 'steps') moves.steps();
      if (answer?.kind === 'handover') moves.handover();
    },
    onWait: () => screen.open({ kind: 'wait' }),
    onWaitOver: () => screen.send({ kind: 'endWait' }),
    onRemind: () => moves.remind(),
    onSteps: () => moves.steps(),
    onUpload: (place) => moves.pick(place),
    onNotNeeded: (row) => screen.open({ kind: 'notNeeded', row }),
    onReopen: (row) => screen.send({ kind: 'reopen', row }),
    onShowFile: (file, shown) => screen.send({ kind: 'showFile', projectFileId: file.id, shown }),
    onOpenFile: (file) => moves.openFile(file),
    onAllDocuments: documents === 'waiting' ? () => moves.documents() : null,
  };
}

/** The acts beside the title: the call, and each row of the ⋯ to its send or its sheet. */
export function projectHeadActsOf(
  screen: ProjectPageScreen & { readonly sending: boolean },
  moves: Pick<ProjectPageMoves, 'call'>,
): Pick<ProjectHeadProps, 'onCall' | 'onMenu' | 'sending'> {
  return {
    onCall: () => moves.call(),
    onMenu: (act) =>
      act === 'moveBack' ? screen.send({ kind: 'moveBack' }) : screen.open({ kind: act }),
    sending: screen.sending,
  };
}

/** The install steps' acts on their screen: a tick, a photo, its retry, and how to get in. */
export function projectStepsActsOf(
  screen: ProjectBodyScreen,
  moves: Pick<ProjectPageMoves, 'pick' | 'openFile'>,
): Omit<ProjectStepsProps, 'project' | 'words' | 'refusal'> {
  return {
    onTick: (step, doneBy) => screen.send({ kind: 'tick', step, doneBy }),
    onUntick: (step) => screen.send({ kind: 'untick', step }),
    onPhoto: (step) => moves.pick({ slot: 'step', slotKey: step }),
    onRetryPhoto: () => screen.retryUpload(),
    onAccess: () => screen.open({ kind: 'access' }),
    onOpenFile: (file) => moves.openFile(file),
    sending: screen.sending,
    uploading: screen.uploading,
    uploadFailed: screen.uploadFailed,
  };
}

/** Which page a project's route opens: the project with its waiting rows, or its whole checklist. */
export interface ProjectPageRoute {
  readonly projectId: string;
  readonly documents: ProjectDetailProps['documents'];
  /** What the page asks first — an early proof's own sheet, opened from the board's *To do*. */
  readonly ask: 'earlyProof' | null;
}

/** What the page's body reads and sends — `useProjectScreen`, by shape. */
export type ProjectBodyScreen = ProjectPageScreen &
  ProjectSheetScreen & {
    readonly sending: boolean;
    readonly uploading: ProjectFilePlace | null;
    readonly uploadFailed: ProjectFilePlace | null;
    readonly close: () => void;
  };

/**
 * The page and its one sheet over the project once read, wired once for both platforms (Law 11).
 * A refusal is said where the person acted — in the open sheet, else on the page.
 */
export function projectBodyOf(
  screen: ProjectBodyScreen,
  shown: Pick<ProjectDetailProps, 'project' | 'view'>,
  { documents }: Pick<ProjectPageRoute, 'documents'>,
  moves: ProjectPageMoves,
  said: TranslatedText | null,
  heroFocus: FocusAfter,
): {
  readonly page: Omit<ProjectDetailProps, 'words'>;
  readonly sheet: Omit<ProjectActSheetProps, 'words'>;
} {
  const inSheet = screen.sheet !== null;
  const { sending, uploading, uploadFailed } = screen;
  return {
    page: {
      project: shown.project,
      view: shown.view,
      documents,
      ...projectPageActsOf(screen, moves, documents),
      sending,
      uploading,
      uploadFailed,
      refusal: inSheet ? null : said,
      heroFocus,
    },
    sheet: {
      form: projectActFormOf(screen, shown.project, moves.addCrew),
      onClose: screen.close,
      sending,
      refusal: inSheet ? said : null,
    },
  };
}
