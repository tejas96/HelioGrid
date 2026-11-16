import type { TranslatedText } from '@heliogrid/contracts';
import { Animated, StyleSheet } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { usePulse } from '../../primitives/use-pulse.native';

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors['canvas-sunken'],
  },
});

/** The loading placeholder: a well pulsing as every phone skeleton does (`usePulse`). */
export function MapSkeleton({ label }: { label: TranslatedText }) {
  const opacity = usePulse();

  return (
    /* Web's skeleton is `role="status"`. RN has no `status`, and `progressbar` would promise a
       measurable position this pulse does not have, so the honest form is an accessibility element
       (`accessible`, folding nothing but the block itself) named by its label, announced politely. */
    <Animated.View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.block, { opacity }]}
    />
  );
}
