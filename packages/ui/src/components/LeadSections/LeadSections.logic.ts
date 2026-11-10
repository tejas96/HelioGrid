import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadTaskView } from '@heliogrid/domain';
import type { LeadTaskRow } from './LeadSections.types';

/** The words a task row is drawn with: what it asks, and when it is due on the tenant's clock. */
export interface LeadTaskRowWords {
  readonly title: (task: LeadTaskView) => TranslatedText;
  readonly due: (dueAtEpoch: number) => TranslatedText;
}

/** The Tasks section's rows from domain's tasks, soonest first, overdue derived. */
export function leadTaskRowsOf(
  tasks: readonly LeadTaskView[],
  words: LeadTaskRowWords,
): LeadTaskRow[] {
  return tasks.map((task) => ({
    id: task.id,
    title: words.title(task),
    due: words.due(Date.parse(task.dueAt)),
    overdue: task.overdue,
    done: task.status === 'done',
  }));
}
