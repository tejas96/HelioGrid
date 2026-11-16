import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { StatusMark } from '../StatusMark/StatusMark.native';
import type { LeadSectionsProps, LeadTaskActs, LeadTaskRow } from './LeadSections.types';

interface LeadTaskListProps {
  readonly tasks: LeadSectionsProps['tasks'];
  readonly acts: LeadTaskActs;
  readonly words: LeadSectionsProps['words'];
}

/**
 * The Tasks section (`M07-05`): each open task with what it asks, when it is due and the overdue
 * mark, done or reopened in place by its icon, as the web's — every row's act inert while one is
 * out, its failure said under it as the shared returned line — and *Add a call-back* at the foot.
 */
export function LeadTaskList({ tasks, acts, words }: LeadTaskListProps) {
  return (
    <View style={styles.list}>
      {tasks.length === 0 ? <NamedGap gap={words.noTasks} /> : null}
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} acts={acts} words={words} />
      ))}
      <View style={styles.foot}>
        <Button
          variant="secondary"
          size="sm"
          icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
          onClick={acts.onAddCallBack}
        >
          {words.addCallBack}
        </Button>
      </View>
    </View>
  );
}

function TaskRow({ task, acts, words }: { task: LeadTaskRow } & Omit<LeadTaskListProps, 'tasks'>) {
  const failure = acts.failure?.taskId === task.id ? acts.failure.reason : null;
  /* Which task's act is out, on the circle the reader lands on — the web row's `aria-busy`. */
  const out = acts.pendingId === task.id;
  return (
    <View style={styles.row}>
      <View style={styles.line}>
        <ShellGlyph name={task.done ? 'circle-check' : 'clock'} size="md" />
        <View style={styles.words}>
          <Text variant="body" color={task.done ? 'secondary' : 'primary'}>
            {task.title}
          </Text>
          <View style={styles.meta}>
            <Text variant="body-sm" color="secondary">
              {task.due}
            </Text>
            {task.overdue ? <StatusMark tone="warning" label={words.overdue} /> : null}
            {task.done ? <StatusMark tone="success" label={words.doneMark} /> : null}
          </View>
        </View>
        {task.done ? (
          <IconButton
            label={words.reopen(task.title)}
            variant="ghost"
            busy={out}
            disabled={acts.pendingId !== null}
            onClick={() => acts.onReopen(task.id)}
          >
            <ShellGlyph name="undo" size="md" tone="secondary" />
          </IconButton>
        ) : (
          <IconButton
            label={words.markDone(task.title)}
            variant="ghost"
            busy={out}
            disabled={acts.pendingId !== null}
            onClick={() => acts.onDone(task.id)}
          >
            <ShellGlyph name="check" size="md" tone="primary" />
          </IconButton>
        )}
      </View>
      {failure === null ? null : <PendingAction state="returned" reason={failure} />}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-1'] },
  row: {
    gap: theme.spacing['sp-1'],
    paddingVertical: theme.spacing['sp-2'],
    borderBottomWidth: 1,
    borderBottomColor: colors['line-soft'],
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  foot: { flexDirection: 'row', paddingTop: theme.spacing['sp-2'] },
});
