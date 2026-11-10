import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import { PILL_HEIGHT } from './FilterBar.types';

/* THE TOUCH TARGET AND THE VISIBLE PILL ARE TWO DIFFERENT RECTANGLES (N2 / F7-29 / F7-32).
   The target is MIN_TOUCH_TARGET; a scope or sort pill inside keeps its own height, and the extra
   is transparent padding owned by the target. A chip is 44 — the pill IS the target. The pill
   heights, the 14dp insets, the 18dp option glyph and the chip's 14dp words are the design
   system's own and sit off the token scales, so no theme token carries them. */
const INSET = 14;
const GLYPH = 18;
const CHIP_FONT = 14;

/** The pills; the filter circle is drawn by `FiltersButton` itself. */
export type PillKind = Exclude<keyof typeof PILL_HEIGHT, 'filters'>;

export const filterStyles = StyleSheet.create({
  /* The pill's shape on the target too: Android draws no square ripple under a round pill. */
  target: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  /* A glyph or a tick before the label takes two of the leading edge back. */
  lead: { paddingLeft: INSET },
  glyph: { width: GLYPH, height: GLYPH, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});

/** Chips take the control fill, flat (`F7-15`); scope and sort are bare. */
const TAKES_CONTROL_FILL: Record<PillKind, boolean> = {
  scope: false,
  chip: true,
  sort: false,
};

const PADDING: Record<PillKind, number> = {
  scope: theme.spacing['sp-4'],
  chip: theme.spacing['sp-4'],
  sort: INSET,
};

const pillWords: TextStyle = { fontWeight: '500', letterSpacing: -0.01 };

/* The chip's 14dp words sit on the body role's line box, which is taller than they need, so the
   box `Text` raises for Devanagari is measured for a larger face and never clips the marks. */
const chipWords: TextStyle = { ...pillWords, fontSize: CHIP_FONT };

function pillVariant(kind: PillKind) {
  return kind === 'sort' ? ('body-sm' as const) : ('body' as const);
}

function wordsStyle(kind: PillKind): TextStyle {
  return kind === 'chip' ? chipWords : pillWords;
}

export function FilterPill({
  kind,
  active = false,
  lead = false,
  children,
}: {
  kind: PillKind;
  active?: boolean;
  /** A glyph or a tick comes before the label. */
  lead?: boolean;
  children: ReactNode;
}) {
  const { controlFill } = useGround();
  const resting = TAKES_CONTROL_FILL[kind] ? controlFill : 'transparent';
  return (
    <View
      style={[
        filterStyles.pill,
        {
          height: PILL_HEIGHT[kind],
          paddingHorizontal: PADDING[kind],
          backgroundColor: active ? colors['accent-subtle'] : resting,
        },
        lead ? filterStyles.lead : undefined,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * The ink a pill's words, glyph and tick are drawn in — the accent words on the chosen pill's
 * accent wash, as every chosen filter is. A colour, since RN has no `currentColor` to inherit.
 */
export function pillInkColor(kind: PillKind, active: boolean): ThemeColor {
  if (active) return colors['accent-text'];
  return kind === 'chip' ? colors['text-primary'] : colors['text-secondary'];
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
      style={[wordsStyle(kind), { color: pillInkColor(kind, active) }]}
    >
      {children}
    </Text>
  );
}

/** The optional per-option count, in tabular figures inside the pill — information, so secondary. */
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
    <Text
      variant={pillVariant(kind)}
      style={[
        wordsStyle(kind),
        { color: active ? colors['accent-text'] : colors['text-secondary'] },
      ]}
    >
      {String(count)}
    </Text>
  );
}

/**
 * An option's 18dp glyph before its label, hidden from the screen reader (the label names the
 * chip). RN has no inherited colour, so a `react-native-svg` element is handed the ink as `color`,
 * which its `currentColor` strokes read; drawn only when there is one.
 */
export function OptionGlyph({ icon, color }: { icon: ReactNode; color: ThemeColor }) {
  if (!icon) return null;
  const glyph = isValidElement<SvgProps>(icon)
    ? cloneElement(icon, { width: GLYPH, height: GLYPH, color })
    : icon;
  return (
    <View
      style={filterStyles.glyph}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {glyph}
    </View>
  );
}
