import type { ProjectBoardSort, ProjectBoardView, Read, TodoRow } from '@heliogrid/domain';
import type { ProjectBoardProps } from './ProjectBoard.types';

/** The board's screen — `useProjectBoardScreen`, by shape. */
export interface ProjectBoardScreen {
  readonly read: Read<ProjectBoardView>;
  readonly choose: (stage: ProjectBoardView['chosen']) => void;
  readonly searched: string;
  readonly search: (text: string) => void;
  readonly sortBy: (sort: ProjectBoardSort) => void;
  readonly runBy: (manager: string | null) => void;
  readonly todo: (row: TodoRow) => {
    readonly projectId: string;
    readonly ask: 'earlyProof' | null;
  };
}

/**
 * The board's read and acts, wired once for both platforms (Law 11): a row opens its project, and a
 * to-do act opens it with what the page asks first.
 */
export function projectBoardActsOf(
  screen: ProjectBoardScreen,
  open: (projectId: string, ask: 'earlyProof' | null) => void,
): Pick<
  ProjectBoardProps,
  'read' | 'searched' | 'onSearch' | 'onOpen' | 'onTodo' | 'onChooseStage' | 'onSortBy' | 'onRunBy'
> {
  return {
    read: screen.read,
    searched: screen.searched,
    onSearch: screen.search,
    onOpen: (projectId) => open(projectId, null),
    onTodo: (row) => {
      const answer = screen.todo(row);
      open(answer.projectId, answer.ask);
    },
    onChooseStage: screen.choose,
    onSortBy: screen.sortBy,
    onRunBy: screen.runBy,
  };
}
