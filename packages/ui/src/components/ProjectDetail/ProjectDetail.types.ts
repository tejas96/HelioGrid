import type {
  ProjectDetail as ProjectDetailFacts,
  ProjectFile,
  TranslatedText,
} from '@heliogrid/contracts';
import type { NextStep, ProjectDetailView, ProjectFileSlot } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';

/** A move on the journey as the activity names it — `@heliogrid/i18n`'s `ProjectEventKind`. */
export type ProjectEventKind =
  | 'started'
  | 'moved'
  | 'movedAuto'
  | 'movedBack'
  | 'undone'
  | 'cancelled'
  | 'wait';

/** The project's words — `@heliogrid/i18n`'s `projectDetailWords`, by shape. */
export interface ProjectDetailWords {
  readonly now: TranslatedText;
  readonly next: TranslatedText;
  readonly since: (date: string) => TranslatedText;
  readonly days: (count: number) => TranslatedText;
  readonly daysHere: (count: number) => TranslatedText;
  readonly stage: (stage: string) => TranslatedText;
  readonly viewOnly: TranslatedText;
  /** The next step's title; an early proof names the checklist row that came. */
  readonly nextTitle: (step: NextStep, proofRow: string | null) => TranslatedText;
  readonly nextLine: (step: NextStep) => TranslatedText;
  readonly nextAct: (step: NextStep) => TranslatedText;
  /** A handed-over project's line: the day, and that its pack stays. */
  readonly handedOverOn: (date: string) => TranslatedText;
  readonly handoverPack: TranslatedText;
  /** A cancelled project's line: why, and that nothing was deleted. */
  readonly cancelledLine: (reason: string) => TranslatedText;
  readonly noWaitTitle: TranslatedText;
  readonly journey: TranslatedText;
  readonly journeyNote: TranslatedText;
  readonly movedBy: (name: string) => TranslatedText;
  readonly movedByProof: (proof: string | null) => TranslatedText;
  readonly proofName: (proof: string | null) => TranslatedText;
  /** Dispatched's line: who moved it, and the crew it named. */
  readonly byWithCrew: (name: string, crew: readonly string[]) => TranslatedText;
  readonly byMarkWon: (name: string) => TranslatedText;
  readonly passedOver: TranslatedText;
  readonly passedOverLine: TranslatedText;
  readonly countsAsPassed: TranslatedText;
  readonly movesOn: (stage: string, row: string | null) => TranslatedText;
  readonly documents: TranslatedText;
  readonly documentsCount: (done: number, total: number) => TranslatedText;
  readonly seeAllDocuments: (count: number) => TranslatedText;
  readonly nothingWaiting: TranslatedText;
  readonly row: (row: string) => TranslatedText;
  readonly done: TranslatedText;
  readonly notNeeded: TranslatedText;
  readonly madeAtHandover: TranslatedText;
  readonly upload: TranslatedText;
  readonly notNeededAct: TranslatedText;
  readonly undoNotNeeded: TranslatedText;
  readonly movesProject: (stage: string) => TranslatedText;
  readonly notNeededBecause: (reason: string) => TranslatedText;
  readonly uploadedBy: (name: string, date: string) => TranslatedText;
  /** The spoken names of a row's acts, each with its row — never one name for every row. */
  readonly uploadRow: (row: string) => TranslatedText;
  readonly notNeededRow: (row: string) => TranslatedText;
  readonly reopenRow: (row: string) => TranslatedText;
  /** The checklist's own screen: the row that moves the stage, and its caption. */
  readonly movesTheStage: TranslatedText;
  readonly movesByItself: (to: string) => TranslatedText;
  readonly photoOrFile: TranslatedText;
  readonly docsCaption: TranslatedText;
  readonly otherFiles: TranslatedText;
  readonly addFile: TranslatedText;
  readonly fromLead: TranslatedText;
  readonly addedBy: (name: string) => TranslatedText;
  readonly showToCustomer: TranslatedText;
  /** *Show to customer*'s spoken name, with its file. */
  readonly showFile: (name: string) => TranslatedText;
  readonly noFiles: TranslatedText;
  readonly deal: TranslatedText;
  readonly customer: TranslatedText;
  readonly managerLabel: TranslatedText;
  readonly design: TranslatedText;
  readonly proposal: TranslatedText;
  readonly noneLinked: TranslatedText;
  readonly activity: TranslatedText;
  readonly activityNote: TranslatedText;
  readonly event: (kind: ProjectEventKind, key: string) => TranslatedText;
  /** Why a project waits, in the pack's words. */
  readonly reason: (key: string) => TranslatedText;
  /** A file that did not reach the project, said on the row it was for — the toast's *Not sent*. */
  readonly notSent: TranslatedText;
}

/** The wait card's words. */
export interface ProjectWaitWords {
  readonly waitTitle: (party: string) => TranslatedText;
  readonly waitLine: (reason: string, startedOn: string) => TranslatedText;
  readonly waitOver: TranslatedText;
  readonly remind: TranslatedText;
  readonly noWaitTitle: TranslatedText;
  readonly noWaitLine: TranslatedText;
  readonly days: (count: number) => TranslatedText;
}

/** Where a file goes on the project — a row's document, a step's photo, or another file. */
export interface ProjectFilePlace {
  readonly slot: ProjectFileSlot;
  readonly slotKey: string | null;
}

/** The acts on the whole project, in the ⋯ beside its title (ruling 16: *Move back* lives there). */
export type ProjectMenuAct = 'date' | 'manager' | 'access' | 'moveBack' | 'cancel';

/**
 * One project (`SCR-M08-02`, `03`, the picked design): the hero — the stage, its days figure and the
 * one next step with its act — the wait, the journey with dates (never a % bar), the documents, the
 * other files and the latest activity; wide, the deal's facts beside them. Or the checklist's own
 * screen: the row that moves the stage, every row, and the other files. An act the reader may not do
 * is not drawn (`M08-18`); everything drawn says what it reads.
 */
export interface ProjectDetailProps {
  readonly project: ProjectDetailFacts;
  readonly view: ProjectDetailView;
  readonly words: ProjectDetailWords & ProjectWaitWords;
  /** The project page with the rows still waiting, or the checklist's own screen (`SCR-M08-03`). */
  readonly documents: 'waiting' | 'all';
  readonly onNext: (step: NextStep) => void;
  readonly onWait: () => void;
  readonly onWaitOver: () => void;
  /** A customer's wait: the kind line to send them, from the share sheet or a copy. */
  readonly onRemind: () => void;
  /** The install steps' own screen, with the crew and how to get in. */
  readonly onSteps: () => void;
  readonly onUpload: (place: ProjectFilePlace) => void;
  readonly onNotNeeded: (row: string) => void;
  readonly onReopen: (row: string) => void;
  readonly onShowFile: (file: ProjectFile, shown: boolean) => void;
  readonly onOpenFile: (file: ProjectFile) => void;
  readonly onAllDocuments: (() => void) | null;
  /** Any act is out: every act waits for its answer. */
  readonly sending: boolean;
  readonly uploading: ProjectFilePlace | null;
  readonly uploadFailed: ProjectFilePlace | null;
  /** Why the last act came back refused, worded; or null. */
  readonly refusal: TranslatedText | null;
  /**
   * Where focus lands once an act that leaves has gone — *Wait is over*, a toast's *Undo*: the
   * hero's act, else its next step. The page sets it; the screen hands it to its toast too.
   */
  readonly heroFocus: FocusAfter;
}
