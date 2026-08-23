import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';

/* THE TICK IS THE SYSTEM `Checkbox` (see `DataTableHead`, `DataTableBodyRow`, `DataTableCard`).
   A private `SelectBox` lived here — its own 20px box, its own `rf-xs` radius, its own 1.5px
   border and no disabled state at all — because the system Checkbox printed its `label` beside
   the box and a row tick has no room for a visible one. `CheckboxProps.ariaLabel` is the name-only
   route `Select` already had, so the second checkbox has no reason to exist. */

const styles = StyleSheet.create({
  selection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-5'],
    backgroundColor: theme.colors['accent-subtle'],
    minHeight: 60,
  },
  clear: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    marginLeft: 'auto',
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingVertical: 10,
    paddingLeft: theme.spacing['sp-6'],
    paddingRight: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
  },
  step: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
});

/**
 * **The pull-back every selection tick sits under.** The 44px target overhangs its 20px box by
 * 10px on every side — the two-rectangles rule — so this keeps the visible box flush with the
 * edge and the selection column at its declared width. The web half's `.hg-dt-tick` is the same
 * number, in the same one place.
 */
export const tickPullback: ViewStyle = { margin: -10 };

/** Selection sits at the TOP of the table, pushing the rows down — never a floating overlay. */
export function SelectionBar({
  count,
  actions,
  onClear,
}: {
  count: number;
  actions: ReactNode;
  onClear: () => void;
}) {
  return (
    /* The band is a named region, as it is on the web (`role="region" aria-label`): a bare `View`
       carrying only `accessibilityLabel` is not an accessibility element, so the count and the bulk
       actions it introduces had no name to arrive under. */
    <View role="region" accessibilityLabel={`${count} selected`} style={styles.selection}>
      <Pressable accessibilityLabel="Clear selection" onPress={onClear} style={styles.clear}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 6 6 18M6 6l12 12"
            stroke={theme.colors['text-secondary']}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
      <Text variant="body-sm" style={{ fontWeight: '500' }}>
        {`${count} selected`}
      </Text>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

export function Pagination({
  page,
  pageSize,
  rowCount,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  rowCount: number;
  onPageChange?: (page: number) => void;
}) {
  const from = rowCount === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(rowCount, (page + 1) * pageSize);
  const last = Math.max(0, Math.ceil(rowCount / pageSize) - 1);
  const step = (direction: number, label: string, disabled: boolean) => (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onPageChange?.(page + direction)}
      style={styles.step}
    >
      <View style={direction < 0 ? { transform: [{ rotate: '180deg' }] } : undefined}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="m9 18 6-6-6-6"
            stroke={disabled ? theme.colors['text-disabled'] : theme.colors['text-primary']}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
  return (
    <View style={styles.pager}>
      <Text variant="body-sm" color="secondary">
        {`${from}–${to} of ${rowCount}`}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {step(-1, 'Previous page', page <= 0)}
        {step(1, 'Next page', page >= last)}
      </View>
    </View>
  );
}
