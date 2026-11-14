import { type BoardCard, IN_FORMATS, projectBoardViewOf } from '@heliogrid/domain';
import { createTranslator, projectBoardTopWords, projectBoardWords } from '@heliogrid/i18n';
import { ProjectBoard } from '@heliogrid/ui';

const en = await createTranslator('en');

/** The board holding one project whose part is due, its words and acts bound in the browser. */
export function ProjectBoardOfOneDue({ card }: { card: BoardCard }) {
  const today = '2026-11-14';
  const view = projectBoardViewOf(
    {
      today,
      stages: [{ stage: card.stage, count: 1, oldestEnteredOn: card.enteredOn }],
      live: [card],
    },
    { stage: null, searched: '', canAct: true, handedOver: null, sort: 'longest', manager: null },
  );
  return (
    <ProjectBoard
      head={null}
      read={{ kind: 'ready', value: view }}
      words={projectBoardWords(en.t, IN_FORMATS, 'en')}
      top={projectBoardTopWords(en.t)}
      searched=""
      onSearch={() => undefined}
      onOpen={() => undefined}
      onTodo={() => undefined}
      onChooseStage={() => undefined}
      onSortBy={() => undefined}
      onRunBy={() => undefined}
      openId={null}
      focusAfter={{ current: null }}
    />
  );
}
