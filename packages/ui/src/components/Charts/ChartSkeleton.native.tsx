import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { Animated, StyleSheet } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { usePulse } from '../../primitives/use-pulse.native';

interface ChartSkeletonProps {
  height: number;
  label: TranslatedText;
}

const styles = StyleSheet.create({
  block: {
    borderRadius: theme.radius['r-md'],
    backgroundColor: colors['canvas-sunken'],
  },
});

/** The loading placeholder: a well pulsing as every phone skeleton does (`usePulse`). */
export function ChartSkeleton({ height, label }: ChartSkeletonProps) {
  const opacity = usePulse();

  return (
    /* The web half is `role="status"`. RN has no `status`, and `progressbar` would promise a
       plotted position the block has none of, so the truthful form is an accessibility element
       carrying the same name web's `aria-label` carries, announced politely. */
    <Animated.View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.block, { height, opacity }]}
    />
  );
}
