import type { ProjectBoardView } from '@heliogrid/domain';
import { useRef, useState } from 'react';
import { type FocusAfter, type FocusHandle, focusAfterFirst } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { EmptyState, FailedRead } from '../EmptyState';
import { IconButton } from '../IconButton';
import { LoadingBars } from '../LoadingBars';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { SearchField } from '../SearchField';
import { searchMissed } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardDesk, ProjectBoardRail } from './ProjectBoardDesk';
import { ProjectBoardHero } from './ProjectBoardHero';
import { ProjectBoardNeeds } from './ProjectBoardNeeds';
import { ProjectBoardNoMatch } from './ProjectBoardNoMatch';
import { ProjectBoardStages } from './ProjectBoardStages';
import './ProjectBoard.css';

/**
 * The board on the web (`SCR-M08-01`), sized from its own room (a container on its wrapper, never
 * the window). Narrow, the phone's page: the title with the search glyph, the hero, *To do*,
 * *Waiting* and every project by stage under one stage pill. Wide (the picked desktop frame): the
 * title with the search field, the rail of every stage across the top, then the day's work in a
 * column beside OneOhm's table of projects. A part the other room draws differently is drawn in
 * both and shown in its own (`data-room`).
 */
export function ProjectBoard(props: ProjectBoardProps) {
  const { read, head, searched, onSearch, words } = props;
  const narrowField = useRef<FocusHandle>(null);
  const wideField = useRef<FocusHandle>(null);
  const [searching, setSearching] = useState(searched !== '');
  const ready = read.kind === 'ready';
  const toggleSearch = () => {
    if (searching) onSearch('');
    setSearching(!searching);
  };
  const field = {
    value: searched,
    onChange: onSearch,
    placeholder: words.search.placeholder,
    onClear: () => onSearch(''),
    clearLabel: words.search.clear,
  };
  return (
    <div className="hg-project-board-room">
      <div className="hg-project-board">
        <div className="hg-project-board-top">
          <div className="hg-project-board-title">{head}</div>
          {ready ? (
            <>
              <div className="hg-project-board-search" data-room="wide">
                <SearchField ref={wideField} {...field} />
              </div>
              <span className="hg-project-board-search-glyph" data-room="narrow">
                <IconButton label={words.search.open} pressed={searching} onClick={toggleSearch}>
                  <ShellGlyph name="search" size="md" tone="primary" />
                </IconButton>
              </span>
            </>
          ) : null}
        </div>
        {ready && searching ? (
          <div data-room="narrow">
            <SearchField ref={narrowField} autoFocus {...field} />
          </div>
        ) : null}
        <BoardBody {...props} searchField={focusAfterFirst(narrowField, wideField)} />
      </div>
    </div>
  );
}

/** The board under its title: its read's loading, failure and first run, or the board itself. */
function BoardBody(props: ProjectBoardProps & { searchField: FocusAfter }) {
  const { read, words, focusAfter } = props;
  if (read.kind === 'loading') return <LoadingBars {...projectLoadingOf(words)} />;
  if (read.kind === 'failed') {
    return <FailedRead {...projectFailedOf(words, read.retry, focusAfter)} />;
  }
  if (read.kind === 'empty') {
    return <EmptyState scene="settle" title={words.emptyTitle} description={words.emptyBody} />;
  }
  return <Board view={read.value} {...props} />;
}

function Board(props: ProjectBoardProps & { view: ProjectBoardView; searchField: FocusAfter }) {
  const { view } = props;
  const missed = searchMissed(view);
  return (
    <>
      <div data-room="wide">
        <ProjectBoardRail {...props} />
      </div>
      <div className="hg-project-board-columns">
        <div className="hg-project-board-work">
          <ProjectBoardHero view={view} words={props.words} />
          <div className="hg-project-board-needs" data-room="narrow">
            <ProjectBoardNeeds room="narrow" {...props} />
          </div>
          <div className="hg-project-board-needs" data-room="wide">
            <ProjectBoardNeeds room="wide" {...props} />
          </div>
        </div>
        <div className="hg-project-board-all" data-room="narrow">
          {missed ? <ProjectBoardNoMatch {...props} /> : <ProjectBoardStages {...props} />}
        </div>
        <div className="hg-project-board-all" data-room="wide">
          <ProjectBoardDesk missed={missed} {...props} />
        </div>
      </div>
    </>
  );
}
