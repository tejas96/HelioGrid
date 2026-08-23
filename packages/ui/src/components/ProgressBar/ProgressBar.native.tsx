import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { BrandGradientFill } from './BrandGradientFill.native';
import type { ProgressBarProps } from './ProgressBar.types';

interface NativeProgressBarProps extends ProgressBarProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Linear progress. 6px pill track; fill accent, or brand gradient for AI work.
 *
 * IT IS A DRAWING, NOT AN OPERATION — same law as the web half. `--gradient-brand` is a CSS
 * gradient string RN cannot use, so the gradient fill is drawn as a real SVG gradient with the
 * same three stops (BrandGradientFill.native).
 */
export function ProgressBar({ value = 0, gradient = false, style }: NativeProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: pct, min: 0, max: 100 }}
      style={[styles.track, style]}
    >
      <View style={[styles.fill, { width: `${pct}%` }, gradient ? styles.gradient : null]}>
        {gradient ? <BrandGradientFill /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* 6px is the rail's own dimension — the spacing scale has no 6px step. */
  track: {
    height: 6,
    width: '100%',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  gradient: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});
