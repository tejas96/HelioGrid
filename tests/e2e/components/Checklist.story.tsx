import { checklistWords, createTranslator } from '@heliogrid/i18n';
import { Checklist, type ChecklistProps } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = checklistWords(en.t);

/**
 * `Checklist` with its words bound in the browser: `count`, `phaseCount` and `tick` are functions
 * the list calls while it renders, so they cannot be handed to `mount`.
 */
export function WordedChecklist(props: Pick<ChecklistProps, 'read' | 'label' | 'items'>) {
  return <Checklist {...props} words={words} />;
}
