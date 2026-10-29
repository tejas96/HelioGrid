import { createTranslator, kanbanWords } from '@heliogrid/i18n';
import { Kanban, type KanbanProps } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = kanbanWords(en.t);

/**
 * `Kanban` with its words bound in the browser: `moveBack` and `moveOn` are functions the board
 * calls while it renders, so they cannot be handed to `mount`.
 */
export function WordedKanban(props: Omit<KanbanProps, 'words'>) {
  return <Kanban {...props} words={words} />;
}
