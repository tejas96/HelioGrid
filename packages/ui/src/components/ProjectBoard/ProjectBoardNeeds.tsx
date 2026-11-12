import type { ProjectBoardView } from '@heliogrid/domain';
import { useId } from 'react';
import { useFormat } from '../MarketProvider';
import { ProjectRowList } from '../ProjectRows';
import { BOARD_CAPS, type BoardRoom, todoItemsOf, waitItemsOf } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { useHeld } from './use-held';

type NeedsProps = ProjectBoardProps & { view: ProjectBoardView; room: BoardRoom };

/**
 * What needs the person, as the search finds it: *To do* — the acts only they can do, each with its
 * one act — then *Waiting*, by who is waited on, oldest first. Each card shows its room's first few.
 */
export function ProjectBoardNeeds(props: NeedsProps) {
  const { view } = props;
  return (
    <>
      {view.todo.length === 0 ? null : <Todo {...props} />}
      {view.waits.length === 0 ? null : <Waiting {...props} />}
    </>
  );
}

function Todo(props: NeedsProps) {
  const { view, words, room } = props;
  const held = useHeld();
  const format = useFormat();
  const heading = useId();
  return (
    <section className="hg-project-board-section" aria-labelledby={heading}>
      <div className="hg-project-board-head">
        <h2 id={heading} className="hg-project-board-heading">
          {words.toDoHeading}
        </h2>
        <span className="hg-project-board-count">{view.todo.length}</span>
      </div>
      <ProjectRowList
        items={todoItemsOf(view.todo, BOARD_CAPS[room].todo, held, props, format, view.today)}
      />
    </section>
  );
}

function Waiting(props: NeedsProps) {
  const { view, words, room } = props;
  const held = useHeld();
  const heading = useId();
  return (
    <section className="hg-project-board-section" aria-labelledby={heading}>
      <div className="hg-project-board-head">
        <h2 id={heading} className="hg-project-board-heading">
          {words.waitingHeading}
        </h2>
        <span className="hg-project-board-quiet">{words.oldestFirst}</span>
      </div>
      <ProjectRowList items={waitItemsOf(view.waits, BOARD_CAPS[room].perParty, held, props)} />
    </section>
  );
}
