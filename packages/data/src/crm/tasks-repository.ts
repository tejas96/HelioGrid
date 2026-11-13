import type { CreateTask, MoveTask, Task, TaskAct } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/**
 * Follow-up tasks (`M07-05`): add one to a lead, mark it done, reopen it.
 * Overdue is derived from `dueAt` on the screen, never asked for.
 */
export interface TasksRepository {
  /** One key per lead and body: a retried send adds one task. */
  create(leadId: string, body: CreateTask): Promise<Task>;
  /** A cancelled task is history: refused `CONFLICT` (409). */
  done(taskId: string, body: TaskAct): Promise<Task>;
  reopen(taskId: string, body: TaskAct): Promise<Task>;
  /** Another moment for an open task; a done or cancelled one is refused `CONFLICT` (409). */
  move(taskId: string, body: MoveTask): Promise<Task>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createTasksRepository(api: ApiClient): TasksRepository {
  const taskKeys = createCreationKeys();
  return {
    async create(leadId, body) {
      const headers = taskKeys.headersFor({ leadId, body });
      const task = await bodyAt(
        () => api.tasks.create({ params: { id: leadId }, body, headers }),
        201,
      );
      taskKeys.settle();
      return task;
    },
    done: (taskId, body) => bodyAt(() => api.tasks.done({ params: { id: taskId }, body }), 200),
    reopen: (taskId, body) => bodyAt(() => api.tasks.reopen({ params: { id: taskId }, body }), 200),
    move: (taskId, body) => bodyAt(() => api.tasks.move({ params: { id: taskId }, body }), 200),
  };
}
