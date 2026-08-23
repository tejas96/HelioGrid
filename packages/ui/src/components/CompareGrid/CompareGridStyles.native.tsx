import { theme } from '@heliogrid/theme';
import { type StyleProp, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import type { CompareGridProps } from './CompareGrid.types';

export const compareStyles = StyleSheet.create({
  table: { flexDirection: 'column' },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  /* THE FIXED THING. RN has no `position: sticky`, so the pinned cell rides a translateX equal to
     the scroll offset — the same result, and it keeps the ONE-TABLE structure the alignment law
     depends on (a row is still a row, so no value can drift between variants). */
  pin: { zIndex: 2, backgroundColor: theme.colors.surface },
  cell: { justifyContent: 'flex-start' },
  zebra: { backgroundColor: theme.colors['surface-alt'] },
  selected: { backgroundColor: theme.colors['accent-subtle'] },
  plain: { backgroundColor: theme.colors.surface },
  /* 4dp under the label's unit line — the DS's own sub-step, no token carries it. */
  provenance: { marginTop: theme.spacing['sp-1'] },
  optionStack: { gap: 6, minWidth: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  choose: {
    width: '100%',
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['action-primary'],
  },
  chooseSelected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
});

/* Figures line up digit under digit, which is what makes a column of them comparable at a glance
   — the same `font-variant-numeric: tabular-nums` the web half sets on every value cell. */
export const figureStyle: TextStyle = { fontVariant: ['tabular-nums'] };
export const strongFigureStyle: TextStyle = { ...figureStyle, fontWeight: '700' };

const PAD = {
  expressive: { vertical: 14, horizontal: theme.spacing['sp-4'] },
  functional: { vertical: 10, horizontal: 14 },
} as const;

export type Density = NonNullable<CompareGridProps['density']>;

/**
 * **Which ground a cell stands on.** Selection outranks the row's zebra, everywhere — one rule in
 * one place, so the pinned label, the value cells and the option heads cannot disagree about it.
 */
export function cellGround(selected: boolean, zebra: boolean): StyleProp<ViewStyle> {
  if (selected) return compareStyles.selected;
  return zebra ? compareStyles.zebra : compareStyles.plain;
}

/** The fixed-width box a cell occupies at this density — the source of the structural alignment. */
export function cellBoxes(density: Density, labelWidth: number, columnWidth: number) {
  const pad = PAD[density];
  const box = { paddingVertical: pad.vertical, paddingHorizontal: pad.horizontal };
  return { pin: { width: labelWidth, ...box }, cell: { width: columnWidth, ...box } };
}
