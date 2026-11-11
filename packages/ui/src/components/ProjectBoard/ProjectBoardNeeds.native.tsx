import type { ProjectBoardView } from '@heliogrid/domain';
import { Text } from '../../primitives/Text/Text.native';
import { ProjectRowList } from '../ProjectRows/ProjectRows.native';
import { BOARD_CAPS, todoItemsOf, waitItemsOf } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardSection } from './ProjectBoardSection.native';
import { useHeld } from './use-held';

type NeedsProps = ProjectBoardProps & { view: ProjectBoardView };

/** What needs the person on the phone: *To do*, then *Waiting* by party — each its first few. */
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
  const { view, words } = props;
  const held = useHeld();
  return (
    <ProjectBoardSection
      title={words.toDoHeading}
      end={
        <Text variant="mono" color="secondary">
          {String(view.todo.length)}
        </Text>
      }
    >
      <ProjectRowList items={todoItemsOf(view.todo, BOARD_CAPS.narrow.todo, held, props)} />
    </ProjectBoardSection>
  );
}

function Waiting(props: NeedsProps) {
  const { view, words } = props;
  const held = useHeld();
  return (
    <ProjectBoardSection
      title={words.waitingHeading}
      end={
        <Text variant="caption" color="secondary">
          {words.oldestFirst}
        </Text>
      }
    >
      <ProjectRowList items={waitItemsOf(view.waits, BOARD_CAPS.narrow.perParty, held, props)} />
    </ProjectBoardSection>
  );
}
