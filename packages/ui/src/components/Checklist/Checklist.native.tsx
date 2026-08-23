import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { ProgressBar } from '../ProgressBar/ProgressBar.native';
import { buildChecklist, NO_PHASE } from './Checklist.groups';
import type { ChecklistProps } from './Checklist.types';
import { ChecklistRow } from './ChecklistRow.native';
import { ChecklistStateBody } from './ChecklistState.native';

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'column',
    gap: 14,
    padding: 22,
    borderRadius: theme.radius['r-card-expressive'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  head: { flexDirection: 'column', gap: 7 },
  group: { flexDirection: 'column', gap: theme.spacing['sp-1'] },
  phase: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-1'],
  },
  rows: { flexDirection: 'column' },
});

const countWordsStyle = { fontWeight: '700' as const, letterSpacing: -0.34 };

interface NativeChecklistProps extends ChecklistProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * **The list a coordinator ticks off on a roof** — `M05-76` / `SCR-MS-17`, `MS11-30`, `MS11-35`,
 * `MS10-10`.
 *
 * **A tick is a server write, not a checkbox flip** (`F8-36`): the box holds its previous state,
 * `item.pending` names the act, the row stays operable, and only confirmed data flips it.
 * **A phase heading cannot repeat** — headings are drawn from groups, never from a change
 * detector. **Numbering is counted**, so no second count can disagree with it.
 */
export function Checklist({
  items,
  phases,
  onToggle,
  label,
  progressNote,
  countWords,
  noun = 'steps',
  surface = 'screen',
  state = 'ready',
  emptyTitle = 'No steps yet',
  emptyMessage = 'This checklist is built from the design. Generate one and the steps appear here.',
  errorTitle = "Couldn't load the checklist",
  errorMessage = 'Tap Try again — no tick is lost while this fails.',
  onRetry,
  unavailableTitle = 'No checklist for this job',
  unavailableMessage,
  note,
  style,
}: NativeChecklistProps) {
  const model = buildChecklist(items, phases);

  if (state !== 'ready') {
    return (
      <View style={[styles.shell, style]}>
        {label === undefined ? null : (
          <Text variant="overline" color="tertiary">
            {label}
          </Text>
        )}
        <ChecklistStateBody
          state={state}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
        />
      </View>
    );
  }

  return (
    /* The web half is a `<section aria-label>` — a named REGION. The role goes on, `accessible`
       does NOT: every tick row is a 44dp checkbox inside this shell, and folding would put the
       whole list behind one unreachable element. */
    <View
      role="region"
      accessibilityLabel={typeof label === 'string' ? label : 'Checklist'}
      style={[styles.shell, style]}
    >
      <View style={styles.head}>
        {label === undefined ? null : (
          <Text variant="overline" color="tertiary">
            {label}
          </Text>
        )}
        {/* The count in words, then its meaning. A percentage alone says how far, never what. */}
        <Text variant="h4" style={countWordsStyle}>
          {countWords ?? `${model.done} of ${model.list.length} ${noun} done`}
        </Text>
        <ProgressBar value={model.percent} />
        {progressNote === undefined ? null : (
          <Text variant="caption" color="tertiary">
            {progressNote}
          </Text>
        )}
      </View>

      {model.groups.map((group) => (
        <View key={group.key} style={styles.group}>
          {group.key === NO_PHASE ? null : (
            <View style={styles.phase}>
              <Text variant="overline" color="tertiary">
                {group.heading}
              </Text>
              <Text variant="caption" color="tertiary">
                {`${group.doneCount} of ${group.items.length}`}
              </Text>
            </View>
          )}
          {group.key === NO_PHASE || group.note === undefined ? null : (
            <Text variant="caption" color="tertiary">
              {group.note}
            </Text>
          )}
          {/* One `<ul>` per group on the web half, so one `list` per group here. */}
          <View role="list" style={styles.rows}>
            {group.items.map((item) => (
              /* The counted number is unique across the whole list, so it keys every group. */
              <ChecklistRow
                key={item.id ?? `${group.key}-${String(model.numberFor(item))}`}
                item={item}
                number={model.numberFor(item)}
                onToggle={onToggle}
                surface={surface}
              />
            ))}
          </View>
        </View>
      ))}

      {note === undefined ? null : (
        <Text variant="caption" color="tertiary">
          {note}
        </Text>
      )}
    </View>
  );
}
