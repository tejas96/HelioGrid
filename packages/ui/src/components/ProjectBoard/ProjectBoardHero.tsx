import type { ProjectBoardView } from '@heliogrid/domain';
import { HeroPanel } from '../HeroPanel';
import { HueTile } from '../HueTile';
import { KIND_TILE } from '../ProjectRows/ProjectRows.logic';
import type { ProjectBoardWords } from './ProjectBoard.types';

/**
 * The day's hero: the company's day over how many acts are the person's and how many wait on others
 * — the whole board, whatever the search — or, with neither, that nothing needs them.
 */
export function ProjectBoardHero({
  view,
  words,
}: {
  view: ProjectBoardView;
  words: ProjectBoardWords;
}) {
  return (
    <HeroPanel label={words.today(view.today)}>
      {view.allClear ? (
        <div className="hg-project-board-clear">
          <HueTile glyph="tick" hue="success" {...KIND_TILE.hero} />
          <div className="hg-project-board-clear-words">
            <p className="hg-project-board-clear-title">{words.allClearTitle}</p>
            <p className="hg-project-board-clear-line">{words.allClearBody(view.liveCount)}</p>
          </div>
        </div>
      ) : (
        <div className="hg-project-board-figures">
          <span className="hg-project-board-figure">
            <span className="hg-project-board-number">{view.todoCount}</span>
            <span className="hg-project-board-figure-word">{words.toDo}</span>
          </span>
          <span className="hg-project-board-rule" aria-hidden="true" />
          <span className="hg-project-board-figure" data-quiet="true">
            <span className="hg-project-board-number">{view.waitCount}</span>
            <span className="hg-project-board-figure-word">{words.waiting}</span>
          </span>
        </div>
      )}
    </HeroPanel>
  );
}
