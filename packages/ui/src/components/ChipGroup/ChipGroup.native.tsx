import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { chipEntries } from './ChipGroup.entries';
import type { ChipGroupDensity, ChipGroupProps, MarkRowProps } from './ChipGroup.types';

/* The DS "+N" pill heights. No theme token carries either; 44 is MIN_TOUCH_TARGET. */
const PILL_H: Record<ChipGroupDensity, number> = { expressive: 28, functional: 24 };

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', minWidth: 0 },
  item: { flexDirection: 'row', minWidth: 0 },
  /* The floor and the centring are the primitive's; only the "never shrink me" is this row's. */
  target: { flexShrink: 0 },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['neutral-bg'],
  },
});

/* --fw-medium, the DS chip weight, which the type scale's roles do not carry. */
const medium: TextStyle = { fontWeight: '500', color: theme.colors['neutral-text'] };

function Count({ density, children }: { density: ChipGroupDensity; children: ReactNode }) {
  return (
    <View style={[styles.count, { height: PILL_H[density] }]}>
      <Text variant={density === 'expressive' ? 'body-sm' : 'caption'} style={medium}>
        {children}
      </Text>
    </View>
  );
}

interface NativeChipGroupProps extends ChipGroupProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeMarkRowProps extends MarkRowProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * **Several labels in one row, with one defined behaviour** — overflow by count behind one "+N",
 * which is a real 44px control announcing its expanded state and revealing the rest **in place**
 * (never a tooltip: a touch user never sees one). Expanded, the chips wrap; nothing scrolls.
 */
export function ChipGroup({
  children,
  max = 3,
  label,
  empty = null,
  expandable = true,
  defaultExpanded = false,
  density = 'expressive',
  gap = 6,
  style,
}: NativeChipGroupProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const all = chipEntries(children);
  if (all.length === 0) return empty;

  const capped = max > 0 && all.length > max;
  const shown = capped && !open ? all.slice(0, max) : all;
  const hidden = all.length - shown.length;
  const noun = label ?? 'items';

  return (
    /* `accessibilityRole="list"` is RN's answer to the web half's <ul>; the group keeps the name. */
    <View
      accessibilityRole="list"
      accessibilityLabel={label}
      style={[styles.group, { gap }, style]}
    >
      {shown.map((entry) => (
        <View key={entry.key} style={styles.item}>
          {entry.node}
        </View>
      ))}
      {capped ? (
        <View style={styles.item}>
          {expandable ? (
            /* The "+N" is a real control and its whole contract is announcing whether it is open,
               so the expanded state goes through the primitive — the same one declaration the web
               half spells `aria-expanded` — and the 44dp floor and the pressed treatment come with
               it. `MIN_TOUCH_TARGET` stays only to pull the target back to the pill's height. */
            <Pressable
              accessibilityState={{ expanded: open }}
              accessibilityLabel={
                open ? `Show fewer ${noun}` : `Show ${hidden} more ${noun} (${all.length} in total)`
              }
              onPress={() => setOpen((previous) => !previous)}
              style={[styles.target, { marginVertical: (PILL_H[density] - MIN_TOUCH_TARGET) / 2 }]}
            >
              <Count density={density}>{open ? 'Show fewer' : `+${hidden}`}</Count>
            </Pressable>
          ) : (
            <Count density={density}>{`+${hidden}`}</Count>
          )}
        </View>
      ) : null}
    </View>
  );
}

/**
 * **Two facts are two chips, never one merged badge** (`SCR-M06-19`). No collapse — a mark a row
 * needs is never hidden behind a "+N" — and no list semantics, because half its hosts are
 * controls and their marks must stay non-interactive.
 */
export function MarkRow({ children, gap = 6, style }: NativeMarkRowProps) {
  const all = chipEntries(children);
  if (all.length === 0) return null;
  return (
    <View style={[styles.group, { gap }, style]}>
      {all.map((entry) => (
        <View key={entry.key} style={styles.item}>
          {entry.node}
        </View>
      ))}
    </View>
  );
}

/** What every `marks` host prop runs through: a ready node, or an array of nodes in a `MarkRow`. */
export function renderMarks(
  marks?: ReactNode | ReactNode[],
  extra?: Partial<NativeMarkRowProps>,
): ReactNode {
  if (marks === undefined || marks === null || marks === false) return null;
  if (Array.isArray(marks)) return <MarkRow {...extra}>{marks}</MarkRow>;
  return marks;
}

ChipGroup.Marks = MarkRow;
ChipGroup.renderMarks = renderMarks;
