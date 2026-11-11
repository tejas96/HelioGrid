import type { ProjectBoardView } from '@heliogrid/domain';
import { type RefObject, useRef } from 'react';
import type { FocusAfter, FocusHandle } from '../../primitives/FocusAfter';
import { useOwnWidth } from '../../primitives/use-own-width';
import { EmptyState, FailedRead } from '../EmptyState';
import { ListTop } from '../ListTop';
import type { ListRoom } from '../ListTop/ListTop.types';
import { LoadingBars } from '../LoadingBars';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { searchMissed } from './ProjectBoard.logic';
import { projectBoardTopOf } from './ProjectBoard.top';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardDesk } from './ProjectBoardDesk';
import { ProjectBoardNeeds } from './ProjectBoardNeeds';
import { ProjectBoardNoMatch } from './ProjectBoardNoMatch';
import { ProjectBoardStages } from './ProjectBoardStages';
import './ProjectBoard.css';

/** The room at which the board lays the day's work beside the table — the container's own rule. */
const BOARD_WIDE_FROM = 960;

/**
 * The board on the web (`SCR-M08-01`), sized from its own room (its wrapper, never the window):
 * the large title, the list top every list page shares — the summary, the search with the order
 * and the manager filter, the stage chips — then *To do*, *Waiting* and every project by stage.
 * Narrow, one column as the phone draws it; wide, the day's work in a column beside OneOhm's table.
 * A part the other room draws differently is drawn in both and shown in its own (`data-room`).
 */
export function ProjectBoard(props: ProjectBoardProps) {
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const field = useRef<FocusHandle>(null);
  const listRoom: ListRoom = width !== null && width >= BOARD_WIDE_FROM ? 'wide' : 'narrow';
  return (
    <div ref={room} className="hg-project-board-room">
      <div className="hg-project-board">
        <div className="hg-project-board-title">{props.head}</div>
        <BoardBody {...props} listRoom={listRoom} field={field} searchField={field} />
      </div>
    </div>
  );
}

type BodyProps = ProjectBoardProps & {
  listRoom: ListRoom;
  field: RefObject<FocusHandle | null>;
  searchField: FocusAfter;
};

/** The board under its title: its read's loading, failure and first run, or the board itself. */
function BoardBody(props: BodyProps) {
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

function Board(props: BodyProps & { view: ProjectBoardView }) {
  const { view, listRoom } = props;
  const missed = searchMissed(view);
  return (
    <>
      <ListTop {...projectBoardTopOf(props, view, listRoom, props.field)} />
      <div className="hg-project-board-columns">
        <div className="hg-project-board-work">
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
