import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { segmentsOf } from './SegmentBar.logic';
import type { SegmentBarProps } from './SegmentBar.types';

const HEIGHT = { sm: theme.spacing['sp-1'], md: theme.spacing['sp-2'], lg: theme.spacing['sp-3'] };

/** The one share bar (`SegmentBar.types.ts`), on the phone. */
export function SegmentBar({
  parts,
  size = 'md',
  keepEmpty = false,
  fade = false,
  label,
}: SegmentBarProps) {
  const named = label !== undefined;
  return (
    <View
      style={styles.bar}
      accessible={named}
      accessibilityRole={named ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={named ? undefined : 'no-hide-descendants'}
    >
      {segmentsOf(parts, keepEmpty, fade).map((segment) => (
        <View
          key={segment.key}
          style={[
            styles.part,
            { height: HEIGHT[size], flexGrow: segment.share, opacity: segment.opacity },
            segment.thin ? styles.thin : undefined,
            segment.ink === undefined ? undefined : { backgroundColor: segment.ink },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: theme.spacing['sp-0-5'] },
  part: {
    flexBasis: 0,
    minWidth: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors.accent,
  },
  thin: { minWidth: theme.spacing['sp-2'] },
});
