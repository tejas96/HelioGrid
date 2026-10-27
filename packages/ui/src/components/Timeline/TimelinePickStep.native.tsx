/* One step of the pick (native) — the same parts as the web half: its place on the neutral rail
   with its own glyph in the node, what it says, and the check at the row's end. The step presses
   through `Pressable`, which owns the 44px floor, as a radio that says whether it is checked; its
   children are static text and marks, so no control is folded out of reach.

   react-native-svg has no currentColor, so the node cannot hand its ink to the caller's glyph: the
   caller draws the `icon` in the tone that suits the node (`inverse` on the chosen step). */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { TimelineDensity, TimelineItem } from './Timeline.types';

/** The node (the DS's 28 page node) and the end check's disc. */
const NODE = 28;
const CHECK = 22;
/** The space above and below a step's words — functional fits nine stages on a phone sheet. */
const PAD: Record<TimelineDensity, number> = { expressive: 10, functional: theme.spacing['sp-2'] };

export function TimelinePickStep({
  item,
  checked,
  density,
  isFirst,
  isLast,
  onChoose,
}: {
  item: TimelineItem;
  checked: boolean;
  density: TimelineDensity;
  isFirst: boolean;
  isLast: boolean;
  onChoose: () => void;
}) {
  const pad = PAD[density];
  const warning = item.tone === 'warning';
  return (
    <Pressable
      onPress={onChoose}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      style={[styles.step, checked ? styles.stepChecked : null]}
    >
      <View
        style={styles.railCell}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={[styles.rail, { height: pad }, isFirst ? styles.railBlank : null]} />
        <View
          style={[
            styles.node,
            warning ? styles.nodeWarning : null,
            checked ? styles.nodeChecked : null,
          ]}
        >
          {item.icon}
        </View>
        <View style={[styles.rail, styles.railAfter, isLast ? styles.railBlank : null]} />
      </View>
      <View style={[styles.body, { paddingVertical: pad }]}>
        <View style={styles.head}>
          <Text variant="body-sm" style={checked ? styles.labelChecked : styles.label}>
            {item.label}
          </Text>
          {item.marks}
        </View>
        {item.description ? (
          <Text variant="caption" color="secondary">
            {item.description}
          </Text>
        ) : null}
        {item.content ? <View style={styles.content}>{item.content}</View> : null}
      </View>
      <View
        style={styles.end}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={[styles.check, checked ? styles.checkChecked : null]}>
          {checked ? <ShellGlyph name="tick" size="sm" tone="inverse" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* Pressable centres its children by default; a step is a row that runs from the top. The tint
     reaches past the words by its padding, taken back as margin, as on the web. */
  step: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    columnGap: theme.spacing['sp-3'],
    marginHorizontal: -theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  stepChecked: { backgroundColor: theme.colors['accent-subtle'] },
  railCell: { width: NODE, alignItems: 'center', flexShrink: 0 },
  rail: { width: 2, flexShrink: 0, backgroundColor: theme.colors['line-soft'] },
  railAfter: { flex: 1 },
  railBlank: { backgroundColor: 'transparent' },
  node: {
    width: NODE,
    height: NODE,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['canvas-sunken'],
  },
  nodeWarning: { backgroundColor: theme.colors['warning-bg'] },
  nodeChecked: { backgroundColor: theme.colors.accent },
  body: { flex: 1, minWidth: 0, rowGap: 1 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  label: { fontWeight: '500' },
  labelChecked: { fontWeight: '700' },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing['sp-1'],
  },
  end: { justifyContent: 'center' },
  check: {
    width: CHECK,
    height: CHECK,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors['mark-subtle'],
  },
  checkChecked: { backgroundColor: theme.colors.accent, borderWidth: 0 },
});
