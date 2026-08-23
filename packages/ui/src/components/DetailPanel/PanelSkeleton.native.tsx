import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShimmerBar } from '../Sheet/SheetSkeleton.native';

const ROWS = ['row-1', 'row-2', 'row-3', 'row-4'] as const;

interface PanelSkeletonProps {
  /** The status region's accessible name. The reference hardcodes it; no prop carries it. */
  label?: string;
}

/**
 * `loading` — content is coming, and never a placeholder value presented as a real one. The bars
 * carry no numbers for exactly that reason, and the node carries no `progressbar` for the same one:
 * web's `role="status"` has no RN spelling, so this is an accessibility element (folding nothing
 * but shimmer) named by `label` and announced politely.
 */
export function PanelSkeleton({ label = 'Loading' }: PanelSkeletonProps) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={styles.root}
    >
      <View style={styles.pair}>
        <ShimmerBar width="50%" height={72} />
        <ShimmerBar width="50%" height={72} />
      </View>
      <ShimmerBar width="40%" height={12} />
      {ROWS.map((row) => (
        <ShimmerBar height={40} key={row} width="100%" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /* 14 has no spacing token — it is the reference's own panel skeleton gap. */
  root: { gap: 14 },
  pair: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
});
