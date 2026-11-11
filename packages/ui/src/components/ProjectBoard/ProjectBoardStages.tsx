import type { ProjectBoardView, StageGroup } from '@heliogrid/domain';
import { useId } from 'react';
import { CardRows } from '../CardRows';
import { ProjectRowList } from '../ProjectRows';
import { groupLineOf, stageItemsOf } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { useHeld } from './use-held';

type StagesProps = ProjectBoardProps & { view: ProjectBoardView };

/**
 * *All projects* on the narrow board: every stage holding a project — or the one the chips chose —
 * as its own heading over its cards.
 */
export function ProjectBoardStages(props: StagesProps) {
  const { view, words } = props;
  const heading = useId();
  return (
    <section className="hg-project-board-section" aria-labelledby={heading}>
      <div className="hg-project-board-head">
        <h2 id={heading} className="hg-project-board-heading">
          {words.allProjects}
        </h2>
      </div>
      {view.groups.map((group) => (
        <Group key={group.stage} group={group} {...props} />
      ))}
    </section>
  );
}

/** One stage's projects as a card of rows: its overline, count and longest stay over them. */
function Group(props: StagesProps & { group: StageGroup }) {
  const { group, view, words } = props;
  const held = useHeld();
  const heading = useId();
  const line = groupLineOf(view, group, words);
  return (
    <section className="hg-project-board-group" aria-labelledby={heading}>
      <div className="hg-project-board-group-head">
        <h3 id={heading} className="hg-project-board-overline">
          {words.stage(group.stage)}
        </h3>
        <span className="hg-project-board-count">{group.rows.length}</span>
        {line === null ? null : <span className="hg-project-board-quiet">{line}</span>}
      </div>
      {group.rows.length === 0 ? (
        <CardRows form="joined">
          <li className="hg-project-board-none">{words.noneInStage(group.stage)}</li>
        </CardRows>
      ) : (
        <ProjectRowList items={stageItemsOf(group.rows, held, props)} />
      )}
    </section>
  );
}
