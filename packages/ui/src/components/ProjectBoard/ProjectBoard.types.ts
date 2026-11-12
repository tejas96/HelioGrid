import type { ProjectCard, TranslatedText } from '@heliogrid/contracts';
import type {
  ProjectBoardSort,
  ProjectBoardView,
  Read,
  StageStop,
  TodoKind,
  TodoRow,
} from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { FilterPanelWords } from '../FilterPanel/FilterPanel.types';

type LineFacts = Pick<
  ProjectCard,
  'stage' | 'place' | 'steps' | 'expectedInstallOn' | 'installedOn'
>;

/** The board's words — `@heliogrid/i18n`'s `projectBoardWords`, by shape. */
export interface ProjectBoardWords {
  readonly today: (date: string) => TranslatedText;
  readonly waiting: TranslatedText;
  readonly toDoHeading: TranslatedText;
  readonly waitingHeading: TranslatedText;
  readonly oldestFirst: TranslatedText;
  readonly allProjects: TranslatedText;
  readonly allLiveProjects: TranslatedText;
  readonly byStage: TranslatedText;
  readonly stopLine: (stop: Pick<StageStop, 'longestDays' | 'recent'>) => TranslatedText | null;
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
    > & {
      /** The part due and what it still owes, formatted — the money reason's line. */
      readonly money: {
        // biome-ignore lint/plugin/copy-prop-type: the company's own part name — a fact
        readonly part: string;
        // biome-ignore lint/plugin/copy-prop-type: a figure already formatted — a fact
        readonly amount: string;
      } | null;
    },
  ) => TranslatedText;
  readonly todoAct: (kind: TodoKind) => TranslatedText;
  /** The act with the project it acts on, as a screen reader says it. */
  readonly todoActSpoken: (kind: TodoKind, name: string) => TranslatedText;
  readonly allClearTitle: TranslatedText;
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
  readonly noName: TranslatedText;
  readonly close: TranslatedText;
}

/** The list top's own words on the board — `@heliogrid/i18n`'s `projectBoardTopWords`, by shape. */
export interface ProjectBoardTopWords {
  readonly name: TranslatedText;
  readonly live: TranslatedText;
  readonly liveSpoken: (count: number) => TranslatedText;
  readonly toDo: TranslatedText;
  readonly toDoSpoken: (count: number) => TranslatedText;
  readonly waiting: TranslatedText;
  readonly waitingSpoken: (count: number) => TranslatedText;
  readonly sortTitle: TranslatedText;
  readonly sortNamed: (order: TranslatedText) => TranslatedText;
  readonly order: Readonly<Record<ProjectBoardSort, TranslatedText>>;
  readonly close: TranslatedText;
  readonly stages: TranslatedText;
  readonly all: TranslatedText;
  readonly filters: TranslatedText;
  readonly filtersActive: (count: number) => TranslatedText;
  readonly panel: FilterPanelWords;
  readonly manager: TranslatedText;
  readonly anyManager: TranslatedText;
  /** A manager's name as written, to stand as a filter's choice. */
  readonly person: (name: string) => TranslatedText;
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
  readonly top: ProjectBoardTopWords;
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
  readonly onSortBy: (sort: ProjectBoardSort) => void;
  /** One manager's projects by user id, or everyone's. */
  readonly onRunBy: (manager: string | null) => void;
  /** The project open beside the board on the desktop, drawn as the chosen row. */
  readonly openId: string | null;
  readonly focusAfter: FocusAfter;
}
