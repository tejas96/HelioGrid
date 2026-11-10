import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { NamedGap } from '../NamedGap';
import { PendingAction } from '../PendingAction';
import type { LeadSectionsProps, LeadTaskActs, LeadTaskRow } from './LeadSections.types';

interface LeadTaskListProps {
  tasks: readonly LeadTaskRow[];
  acts: LeadTaskActs;
  words: LeadSectionsProps['words'];
}

/**
 * The open tasks (`M07-05`), soonest first: what each asks, when it is due and an overdue mark —
 * glyph, word and tint — each done or reopened in place; and a call-back to add.
 */
export function LeadTaskList({ tasks, acts, words }: LeadTaskListProps) {
  const addCallBack = (
    <Button
      variant="secondary"
      size="sm"
      icon={<ShellGlyph name="plus" size="sm" tone="secondary" />}
      onClick={acts.onAddCallBack}
    >
      {words.addCallBack}
    </Button>
  );
  return (
    <div className="hg-lead-tasks">
      {tasks.length === 0 ? <NamedGap gap={words.noTasks} /> : null}
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} acts={acts} words={words} />
      ))}
      <div className="hg-lead-section-acts">{addCallBack}</div>
    </div>
  );
}

function TaskRow({ task, acts, words }: { task: LeadTaskRow } & Omit<LeadTaskListProps, 'tasks'>) {
  const pending = acts.pendingId === task.id;
  const failure = acts.failure?.taskId === task.id ? acts.failure.reason : null;
  return (
    <div className="hg-lead-task" data-done={task.done ? 'true' : undefined} aria-busy={pending}>
      <ShellGlyph name="clipboard" size="sm" tone="secondary" />
      <div className="hg-lead-task-words">
        <span className="hg-lead-task-title">{task.title}</span>
        <span className="hg-lead-task-line">
          <span>{task.due}</span>
          {task.overdue ? <StatusMark tone="warning" label={words.overdue} /> : null}
          {task.done ? <StatusMark tone="success" label={words.doneMark} /> : null}
        </span>
        {failure === null ? null : <PendingAction state="returned" reason={failure} />}
      </div>
      {task.done ? (
        <IconButton
          label={words.reopen(task.title)}
          variant="ghost"
          disabled={acts.pendingId !== null}
          onClick={() => acts.onReopen(task.id)}
        >
          <ShellGlyph name="undo" size="md" tone="secondary" />
        </IconButton>
      ) : (
        <IconButton
          label={words.markDone(task.title)}
          variant="ghost"
          disabled={acts.pendingId !== null}
          onClick={() => acts.onDone(task.id)}
        >
          <ShellGlyph name="tick" size="md" tone="primary" />
        </IconButton>
      )}
    </div>
  );
}
