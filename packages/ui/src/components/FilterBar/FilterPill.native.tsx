import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import { PILL_HEIGHT } from './FilterBar.types';

/* THE TOUCH TARGET AND THE VISIBLE PILL ARE TWO DIFFERENT RECTANGLES (N2 / F7-29 / F7-32).
   The target is MIN_TOUCH_TARGET; every pill inside keeps its own height, and the extra is
   transparent padding owned by the target. The look is OneOhm's: the scope switch is its segmented
   control (a white raised thumb on a sunken track), a chip is `Chip`, a sort option a radius-12
   control. The 18dp option glyph is the design system's own and
   sits off the token scales. */
const GLYPH = 18;
/* The pill's hairline: a real border on the phone, the same width at rest and chosen, so choosing
   never changes a pill's size. */
const EDGE = 1;

/** The pills; the filter circle is drawn by `FiltersButton` itself. */
/* A kind, stage or facet chip is `Chip`'s `filter` density; the pills here are scope and sort. */
export type PillKind = Exclude<keyof typeof PILL_HEIGHT, 'filters' | 'chip'>;

/** A chip's glyph and tick take its words' ink: RN has no `currentColor` to inherit. */
export const CHIP_INK: ThemeColor = colors['text-primary'];

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
  glyph: { width: GLYPH, height: GLYPH, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});

const RADIUS: Record<PillKind, number> = {
  scope: theme.radius['rf-sm'],
  sort: theme.radius['r-control'],
};

const pillWords: TextStyle = { fontWeight: '500', letterSpacing: -0.01 };

/* What a chosen pill is raised in: the scope's thumb is the raised step on its well (lighter than
   the well in dark), a sort the card colour on the page. */
const CHOSEN_FILL: Record<PillKind, ThemeColor> = {
  scope: colors['surface-raised'],
  // biome-ignore lint/plugin/raw-white: control — the chosen sort is the raised card colour
  sort: colors.surface,
};

/** Scope and sort, chosen: the raised thumb. */
function pillEdge(kind: PillKind, active: boolean) {
  if (!active) return { borderWidth: EDGE, borderColor: 'transparent' };
  return {
    borderWidth: EDGE,
    borderColor: colors['line-soft'],
    backgroundColor: CHOSEN_FILL[kind],
    ...theme.elevation.e1,
  };
}

export function FilterPill({
  kind,
  active = false,
  children,
}: {
  kind: PillKind;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        filterStyles.pill,
        {
          height: PILL_HEIGHT[kind],
          paddingHorizontal: theme.spacing['sp-3'],
          borderRadius: RADIUS[kind],
          backgroundColor: 'transparent',
        },
        pillEdge(kind, active),
      ]}
    >
      {children}
    </View>
  );
}

/**
 * The ink a pill's words, glyph and tick are drawn in — ink on the chosen pill, as every chosen
 * option is. A colour, since RN has no `currentColor` to inherit.
 */
export function pillInkColor(active: boolean): ThemeColor {
  if (active) return colors['text-primary'];
  return colors['text-secondary'];
}

/** The pill's words, in the one weight and colour pair the whole vocabulary uses. */
export function PillLabel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <Text variant="body-sm" style={[pillWords, { color: pillInkColor(active) }]}>
      {children}
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
