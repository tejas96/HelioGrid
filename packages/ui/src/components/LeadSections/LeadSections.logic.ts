import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadTaskView } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { FailedReadProps } from '../EmptyState/EmptyState.types';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';
import type {
  LeadDesignsWords,
  LeadFilesPanel,
  LeadSectionsWords,
  LeadTaskRow,
} from './LeadSections.types';

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

/**
 * The Files section's line for its pick, both halves: going up by its own name, or come back undone
 * with its retry — focus then lands on the add. `null` when no pick is out or undone.
 */
export function leadFilePendingOf(
  { pending, onRetry, onAdd }: LeadFilesPanel,
  words: LeadSectionsWords,
  focusAfter: FocusAfter,
): PendingActionSpec | null {
  if (pending === null) return null;
  if (pending.refused !== null) {
    // The same file would be refused again: the way on is another file.
    return {
      state: 'returned',
      label: words.addingFile(pending.name),
      reason: words.fileRefused[pending.refused](pending.name),
      onRetry: onAdd ?? onRetry,
      retryLabel: words.chooseAnother,
      focusAfter,
    };
  }
  return {
    state: pending.failed ? 'returned' : 'waiting',
    label: words.addingFile(pending.name),
    reason: words.fileNotAdded(pending.name),
    onRetry,
    retryLabel: words.retry,
    focusAfter,
  };
}

/** The Files section's read that failed, said with its retry; focus stays on the section's frame. */
export function leadFilesFailedOf(
  retry: () => void,
  words: LeadSectionsWords,
  focusAfter: FocusAfter,
): FailedReadProps {
  return {
    title: words.filesFailed,
    message: words.filesFailedLine,
    retryLabel: words.retry,
    onRetry: retry,
    focusAfter,
  };
}

/** The Designs section's read that failed, said with its retry; focus stays on the section's frame. */
export function leadDesignsFailedOf(
  retry: () => void,
  words: LeadDesignsWords,
  focusAfter: FocusAfter,
): FailedReadProps {
  return {
    title: words.failedTitle,
    message: words.failedLine,
    retryLabel: words.retry,
    onRetry: retry,
    focusAfter,
  };
}
