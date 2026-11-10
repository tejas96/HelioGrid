'use client';
import type { Task } from '@heliogrid/contracts';
import type { LeadActFailure } from '@heliogrid/domain';
import { useState } from 'react';
import { useAction } from './action';
import { useRepositories } from './context';
import { leadActFailureOf, useLeadDetailCache } from './lead-detail-cache';

/**
 * The Tasks section's acts (`M07-05`): done and reopen in place. A task done here keeps its row,
 * marked done with its Reopen, until the lead is read again — so a mistaken tap is one tap to undo.
 */
export interface LeadTasks {
  /** Tasks done on this screen, as the server answered them. */
  readonly doneHere: readonly Task[];
  done(taskId: string): void;
  reopen(taskId: string): void;
  /** The task whose act is out. */
  readonly pendingId: string | null;
  readonly failure: { readonly taskId: string; readonly failure: LeadActFailure } | null;
}

interface TaskAct {
  readonly taskId: string;
  readonly act: 'done' | 'reopen';
}

export function useLeadTasks(leadId: string): LeadTasks {
  const repositories = useRepositories();
  const cache = useLeadDetailCache(leadId);
  const [doneHere, setDoneHere] = useState<readonly Task[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const act = useAction(
    ({ taskId, act: which }: TaskAct) =>
      repositories.tasks[which](taskId, { capturedAt: new Date().toISOString() }),
    {
      onDone: (task, { act: which }) => {
        setDoneHere((was) =>
          which === 'done'
            ? [...was.filter((each) => each.id !== task.id), task]
            : was.filter((each) => each.id !== task.id),
        );
        cache.refresh();
      },
    },
  );
  const run = (taskId: string, which: TaskAct['act']) => {
    if (act.isOut()) return;
    setLast(taskId);
    void act.run({ taskId, act: which });
  };
  return {
    doneHere,
    done: (taskId) => run(taskId, 'done'),
    reopen: (taskId) => run(taskId, 'reopen'),
    pendingId: act.pending ? last : null,
    failure:
      act.failure === null || last === null
        ? null
        : { taskId: last, failure: leadActFailureOf(act.failure) },
  };
}
