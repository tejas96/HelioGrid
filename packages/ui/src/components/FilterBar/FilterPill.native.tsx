import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import { PILL_HEIGHT } from './FilterBar.types';

/* THE TOUCH TARGET AND THE VISIBLE PILL ARE TWO DIFFERENT RECTANGLES (N2 / F7-29 / F7-32).
   The target is MIN_TOUCH_TARGET; the pill inside keeps its own height, and the extra is
   transparent padding owned by the target. Pill heights and the 14px pill inset are the design
   system's own and sit off the 4px scale, so no theme token carries them. */
const INSET = 14;
const GAP = 6;

export type PillKind = keyof typeof PILL_HEIGHT;

export const filterStyles = StyleSheet.create({
  target: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    borderRadius: theme.radius['r-pill'],
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
});

/** Scope is near-black when active (the primary-action marker); chips and sort are accent. */
const ACTIVE_FILL: Record<PillKind, string> = {
  scope: theme.colors['action-primary'],
  chip: theme.colors.accent,
  sort: theme.colors.accent,
  filters: theme.colors.surface,
};

/** Chips and the Filters pill are white pills separated by shadow; scope and sort are bare. */
const RESTING: Record<PillKind, ViewStyle> = {
  scope: { backgroundColor: 'transparent' },
  chip: { backgroundColor: theme.colors.surface, ...theme.elevation.e2 },
  sort: { backgroundColor: 'transparent' },
  filters: { backgroundColor: theme.colors.surface, ...theme.elevation.e2 },
};

const PADDING: Record<PillKind, number> = {
  scope: theme.spacing['sp-4'],
  chip: INSET,
  sort: INSET,
  filters: INSET,
};

export const pillWords: TextStyle = { fontWeight: '500', letterSpacing: -0.01 };

export function pillVariant(kind: PillKind) {
  return kind === 'scope' || kind === 'filters' ? ('body' as const) : ('body-sm' as const);
}

export function FilterPill({
  kind,
  active = false,
  children,
  style,
}: {
  kind: PillKind;
  active?: boolean;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        filterStyles.pill,
        { height: PILL_HEIGHT[kind], paddingHorizontal: PADDING[kind] },
        active ? { backgroundColor: ACTIVE_FILL[kind] } : RESTING[kind],
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** The pill's words, in the one weight and colour pair the whole vocabulary uses. */
export function PillLabel({
  kind,
  active,
  children,
}: {
  kind: PillKind;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Text
      variant={pillVariant(kind)}
      color={active ? 'inverse' : kind === 'filters' ? 'primary' : 'secondary'}
      style={pillWords}
    >
      {children}
    </Text>
  );
}

/** The optional per-option count, in tabular figures inside the pill. */
export function PillCount({
  kind,
  active,
  count,
}: {
  kind: PillKind;
  active: boolean;
  count: number;
}) {
  return (
    <Text variant={pillVariant(kind)} color={active ? 'inverse' : 'tertiary'} style={pillWords}>
      {String(count)}
    </Text>
  );
}
