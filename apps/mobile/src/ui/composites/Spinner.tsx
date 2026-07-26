import { theme } from '@heliogrid/tokens/theme';
import { ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';

/**
 * Standalone spinner matching Button's internal ActivityIndicator (Button itself is NOT
 * refactored — this mirrors its recipe). `onDark` = white for use on action-primary /
 * dark fills; `neutral` = text-secondary on light surfaces. RN's ActivityIndicator only
 * guarantees small/large cross-platform, so `sm` scales the 20pt small variant down.
 */
export interface SpinnerProps {
  size?: 'md' | 'sm';
  tone?: 'onDark' | 'neutral';
  style?: ViewStyle;
}

export function Spinner({ size = 'md', tone = 'neutral', style }: SpinnerProps) {
  return (
    <ActivityIndicator
      size="small"
      color={tone === 'onDark' ? theme.colors.surface : theme.colors['text-secondary']}
      style={[size === 'sm' && styles.sm, style]}
    />
  );
}

const styles = StyleSheet.create({
  // 0.8 × 20pt small ≈ web sm spinner; transform keeps both platforms consistent.
  sm: { transform: [{ scale: 0.8 }] },
});
