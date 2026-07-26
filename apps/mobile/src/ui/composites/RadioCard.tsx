import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';
import { IconCircle } from '../data/Card';

/**
 * Selectable card group (whatyousell.md §4 composition — not one of the 21): Card-recipe
 * surface + IconCircle + 24dp check indicator with radiogroup/radio semantics. Selected
 * = e3 + 2dp accent ring; a constant transparent border reserves the ring so selecting
 * never shifts layout (same trick as Card). Mockup's off-scale radius 20 / padding 18
 * snap to tokens per spec §4; the check is the Checkbox border-drawn glyph (no icon dep).
 */
export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface RadioCardProps {
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessibility label for the radiogroup (the question the cards answer). */
  label: string;
  style?: ViewStyle;
}

const RING = theme.spacing['sp-0-5'];
const INDICATOR = 24;

export function RadioCard({ options, value, onChange, label, style }: RadioCardProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, style]}>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            onPress={() => {
              if (!checked) onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.card,
              checked && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            {option.icon != null && <IconCircle icon={option.icon} />}
            <View style={styles.body}>
              <AppText weight="600">{option.label}</AppText>
              {option.description != null && (
                // biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role (TypeRole), not ARIA — RN has no DOM roles
                <AppText role="body-sm" color={theme.colors['text-secondary']}>
                  {option.description}
                </AppText>
              )}
            </View>
            <View style={[styles.indicator, checked && styles.indicatorChecked]}>
              {checked && <View style={styles.check} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.spacing['sp-3'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    padding: theme.spacing['sp-4'] - RING,
    borderWidth: RING,
    borderColor: 'transparent',
    ...theme.elevation.e2,
  },
  cardSelected: { borderColor: theme.colors.accent, ...theme.elevation.e3 },
  cardPressed: { transform: [{ scale: theme.motion.pressScale.button }] },
  body: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  indicator: {
    width: INDICATOR,
    height: INDICATOR,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['canvas-sunken'],
  },
  indicatorChecked: { backgroundColor: theme.colors.accent },
  // Border-drawn check (Checkbox glyph): 10×6 L rotated −45°, white on accent.
  check: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors.surface,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
});
