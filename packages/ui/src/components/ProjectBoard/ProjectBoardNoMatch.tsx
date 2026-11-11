import { type FocusAfter, useFocusAfter } from '../../primitives/FocusAfter';
import { Button } from '../Button';
import type { ProjectBoardProps } from './ProjectBoard.types';

/**
 * A search that finds no project: it says what was searched, and clears it. The clear takes this
 * part away, so focus lands on the search field the person goes back to.
 */
export function ProjectBoardNoMatch({
  words,
  searched,
  onSearch,
  searchField,
}: Pick<ProjectBoardProps, 'words' | 'searched' | 'onSearch'> & { searchField: FocusAfter }) {
  const leaving = useFocusAfter(searchField);
  return (
    <div className="hg-project-board-no-match">
      <p className="hg-project-board-no-match-line">{words.search.noMatch(searched)}</p>
      <Button variant="secondary" size="sm" onClick={leaving(() => onSearch(''))}>
        {words.search.clear}
      </Button>
    </div>
  );
}
