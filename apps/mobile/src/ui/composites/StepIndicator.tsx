import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet, View, type ViewStyle } from 'react-native';

/**
 * Onboarding step bars (whatyousell.md §2): `steps` bars, filled up to `current`
 * (1-based) in accent, remainder canvas-sunken. Purely visual — the a11y story is the
 * required `label` ("Step 1 of 2") plus progressbar value semantics. Bar geometry
 * 26×4 r2 gap 5 is mockup-ref component-internal (spec §4 conflict 8).
 */
export interface StepIndicatorProps {
  steps: number;
  current: number;
  label: string;
  style?: ViewStyle;
}

const BAR = { width: 26, height: 4, radius: 2, gap: 5 } as const;

export function StepIndicator({ steps, current, label, style }: StepIndicatorProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: steps, now: current }}
      style={[styles.row, style]}
    >
      {Array.from({ length: steps }, (_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional by nature
          key={i}
          style={[styles.bar, i < current ? styles.barActive : styles.barInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: BAR.gap,
  },
  bar: { width: BAR.width, height: BAR.height, borderRadius: BAR.radius },
  barActive: { backgroundColor: theme.colors.accent },
  barInactive: { backgroundColor: theme.colors['canvas-sunken'] },
});
