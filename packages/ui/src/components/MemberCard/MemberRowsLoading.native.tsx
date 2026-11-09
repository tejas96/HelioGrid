import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { DimensionValue } from 'react-native';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import type { MemberRowsLoadingProps } from './MemberCard.types';

/** Each placeholder's bar widths, so three rows do not read as one shape repeated. */
const PLACEHOLDERS = [
  { key: 'a', name: '46%', line: '68%', roles: '40%' },
  { key: 'b', name: '52%', line: '60%', roles: '34%' },
  { key: 'c', name: '40%', line: '72%', roles: '46%' },
] as const;
/** Half of the web sweep's 1.4 s: the pulse dims, then returns. */
const HALF_PULSE_MS = 700;

function Bar({ style, width }: { style: object; width?: DimensionValue }) {
  return <View style={[styles.bar, style, width === undefined ? null : { width }]} />;
}

/**
 * Three team rows' shapes in the list's one card while the read is out (`SCR-M01-12`, `m-loading`).
 * React Native has no gradient loop, so the rows pulse opacity; under reduced motion they rest at
 * full ink. React Native has no `status` role: `accessible` makes the region one element so its
 * name speaks.
 */
export function MemberRowsLoading({ label }: MemberRowsLoadingProps) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: HALF_PULSE_MS, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: HALF_PULSE_MS, useNativeDriver: true }),
      ]),
    );
    let unmounted = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!reduced && !unmounted) loop.start();
    });
    return () => {
      unmounted = true;
      loop.stop();
    };
  }, [value]);
  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
    >
      <Animated.View style={[tileSurface, styles.card, { opacity }]}>
        {PLACEHOLDERS.map((row, index) => (
          <View key={row.key} style={[styles.row, index === 0 ? undefined : styles.hairline]}>
            <Bar style={styles.face} />
            <View style={styles.words}>
              <Bar style={styles.word} width={row.name} />
              <Bar style={styles.word} width={row.line} />
              <Bar style={styles.roles} width={row.roles} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-1'], borderRadius: theme.radius['r-card-expressive'] },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-4'],
    paddingHorizontal: theme.spacing['sp-3'],
  },
  hairline: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  words: { flex: 1, gap: theme.spacing['sp-2'] },
  bar: { borderRadius: theme.radius['r-pill'], backgroundColor: colors['canvas-sunken'] },
  face: { width: 40, height: 40 },
  word: { height: theme.spacing['sp-3'] },
  roles: { height: theme.spacing['sp-6'] },
});
