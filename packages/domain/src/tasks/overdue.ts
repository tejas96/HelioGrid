import type { TaskStatus } from '../crm/vocabulary';

/** What overdue reads off a task: its status and the instant it falls due. */
export interface TaskDue {
  readonly status: TaskStatus;
  /** Epoch milliseconds. */
  readonly dueAt: number;
}

/**
 * Overdue is derived, never stored (`M07-05`): an open task whose due moment has passed. Moving the
 * due date later makes it not overdue at once, with no flag to clear; a done or cancelled task is
 * never overdue.
 */
export function isOverdue(task: TaskDue, nowEpoch: number): boolean {
  return task.status === 'open' && task.dueAt < nowEpoch;
}
