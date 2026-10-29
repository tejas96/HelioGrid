import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { ProgressBar } from '../ProgressBar/ProgressBar.native';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { buildChecklist, NO_PHASE } from './Checklist.groups';
import { checklistNameOf, countLineOf, rowKeyOf } from './Checklist.logic';
import type { ChecklistProps } from './Checklist.types';
import { ChecklistRow } from './ChecklistRow.native';
import { ChecklistStateBody } from './ChecklistState.native';

/* The list is a heading on the page (`F7-49`): no fill, no shadow, no ground of its own. Each step
   is the tile, apart from the next by space. */
const styles = StyleSheet.create({
  shell: { flexDirection: 'column', gap: 14, padding: 22 },
  head: { flexDirection: 'column', gap: 7 },
  group: { flexDirection: 'column', gap: theme.spacing['sp-1'] },
  phase: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-1'],
  },
  rows: { flexDirection: 'column', gap: theme.spacing['sp-2'] },
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
  noun,
  words,
  surface = 'screen',
  read,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  note,
  style,
}: NativeChecklistProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  const model = buildChecklist(items, phases);
  /* The list's frame outlives its states, so focus lands on it once the retry has left. */
  const frame = useRef<View>(null);

  if (state !== 'ready') {
    return (
      <View ref={frame} style={[styles.shell, style]}>
        {label === undefined ? null : (
          <Text variant="overline" color="tertiary">
            {label}
          </Text>
        )}
        <ChecklistStateBody
          state={state}
          loadingLabel={words.loading}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={frame}
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
      ref={frame}
      role="region"
      collapsable={false}
      accessibilityLabel={checklistNameOf(label, words)}
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
          {countLineOf(model, countWords, noun, words)}
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
                {words.phaseCount(group.doneCount, group.items.length)}
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
              <ChecklistRow
                key={rowKeyOf(item, group, model)}
                item={item}
                number={model.numberFor(item)}
                onToggle={onToggle}
                surface={surface}
                words={words}
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
