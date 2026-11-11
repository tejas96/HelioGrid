import type { ProjectCard, TranslatedText } from '@heliogrid/contracts';
import type { ProjectBoardView, Read, StageStop, TodoKind, TodoRow } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';

type LineFacts = Pick<
  ProjectCard,
  'stage' | 'place' | 'steps' | 'expectedInstallOn' | 'installedOn'
>;

/** The board's words — `@heliogrid/i18n`'s `projectBoardWords`, by shape. */
export interface ProjectBoardWords {
  readonly today: (date: string) => TranslatedText;
  readonly toDo: TranslatedText;
  readonly waiting: TranslatedText;
  readonly toDoHeading: TranslatedText;
  readonly waitingHeading: TranslatedText;
  readonly oldestFirst: TranslatedText;
  readonly allProjects: TranslatedText;
  readonly allLiveProjects: TranslatedText;
  readonly byStage: TranslatedText;
  readonly allStages: TranslatedText;
  readonly showStage: TranslatedText;
  readonly showStageLine: TranslatedText;
  readonly stopLine: (stop: Pick<StageStop, 'longestDays' | 'recent'>) => TranslatedText | null;
  readonly longest: (days: number) => TranslatedText;
  readonly noneNow: TranslatedText;
  readonly noneInStage: (stage: string) => TranslatedText;
  readonly showMore: (count: number) => TranslatedText;
  readonly clearStage: TranslatedText;
  readonly days: (count: number) => TranslatedText;
  readonly stage: (stage: string) => TranslatedText;
  readonly waitingOn: (party: string) => TranslatedText;
  readonly waitLine: (reason: string, startedOn: string) => TranslatedText;
  readonly cardLine: (card: LineFacts) => TranslatedText | null;
  readonly installCell: (card: LineFacts) => TranslatedText | null;
  readonly todoKind: (kind: TodoKind) => TranslatedText;
  readonly todoLine: (
    kind: TodoKind,
    facts: Pick<
      ProjectCard,
      'stage' | 'earlyProofTo' | 'earlyProofBy' | 'missingProofRow' | 'expectedInstallOn'
    >,
  ) => TranslatedText;
  readonly todoAct: (kind: TodoKind) => TranslatedText;
  /** The act with the project it acts on, as a screen reader says it. */
  readonly todoActSpoken: (kind: TodoKind, name: string) => TranslatedText;
  readonly allClearTitle: TranslatedText;
  readonly allClearBody: (live: number) => TranslatedText;
  readonly emptyTitle: TranslatedText;
  readonly emptyBody: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly loading: TranslatedText;
  readonly retry: TranslatedText;
  readonly table: {
    readonly project: TranslatedText;
    readonly stage: TranslatedText;
    readonly daysHere: TranslatedText;
    readonly install: TranslatedText;
    readonly manager: TranslatedText;
    readonly status: TranslatedText;
  };
  readonly search: {
    readonly placeholder: TranslatedText;
    /** The search glyph's spoken name, where the room shows the glyph and not the field. */
    readonly open: TranslatedText;
    readonly clear: TranslatedText;
    readonly noMatch: (text: string) => TranslatedText;
  };
  readonly open: (name: string) => TranslatedText;
  readonly stagesName: TranslatedText;
  readonly noName: TranslatedText;
  readonly close: TranslatedText;
}

/**
 * The board under its large title (`SCR-M08-01`, the picked design): the day's hero, *To do* with
 * each row's one act, *Waiting* by who is waited on, and every live project by stage, oldest first.
 * Narrow — the phone, and the web under its wide room — it is one column with a stage pill that
 * opens the stages as a sheet, and the search behind a glyph. Wide, the stages are a rail of stops
 * across the top, the day's work a column beside the table of projects, and the search a field
 * beside the title. Read, searched, filtered and counted is `useProjectBoardScreen`'s, and
 * `projectBoardViewOf`'s.
 */
export interface ProjectBoardProps {
  /** The page's large title, drawn on the board's top line beside the search. */
  readonly head: ReactNode;
  readonly read: Read<ProjectBoardView>;
  readonly words: ProjectBoardWords;
  /** What is typed in the search; blank shows every project. */
  readonly searched: string;
  readonly onSearch: (text: string) => void;
  readonly onOpen: (projectId: string) => void;
  /**
   * A to-do row's one act, which opens its project: asking about an early proof in its own sheet,
   * or where a missing proof is uploaded and a new date set.
   */
  readonly onTodo: (row: TodoRow) => void;
  readonly onChooseStage: (stage: ProjectBoardView['chosen']) => void;
  /** The project open beside the board on the desktop, drawn as the chosen row. */
  readonly openId: string | null;
  readonly focusAfter: FocusAfter;
}
