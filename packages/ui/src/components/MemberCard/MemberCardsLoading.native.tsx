import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { DimensionValue } from 'react-native';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import type { MemberCardsLoadingProps } from './MemberCard.types';

/** Each placeholder's two name bars, so three cards do not read as one shape repeated. */
const PLACEHOLDERS = [
  { key: 'a', name: '46%', line: '68%', roles: '40%' },
  { key: 'b', name: '52%', line: '60%', roles: '34%' },
  { key: 'c', name: '40%', line: '72%', roles: '46%' },
] as const;
/** Half of the web sweep's 1.4 s: the pulse dims, then returns. */
const HALF_PULSE_MS = 700;

const styles = StyleSheet.create({
  list: { gap: theme.layout['tile-gap'] },
  card: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-tile'],
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  words: { flex: 1, gap: theme.spacing['sp-2'] },
  bar: { borderRadius: theme.radius['r-pill'], backgroundColor: theme.colors['canvas-sunken'] },
  face: { width: 48, height: 48 },
  word: { height: theme.spacing['sp-3'] },
  roles: { height: theme.spacing['sp-6'] },
  act: { width: '100%', height: 44 },
});

function Bar({ style, width }: { style: object; width?: DimensionValue }) {
  return <View style={[styles.bar, style, width === undefined ? null : { width }]} />;
}

/**
 * Three member cards' shapes while the read is out (`SCR-M01-12`, `m-loading`). React Native has no
 * gradient loop, so the cards pulse opacity; under reduced motion they rest at full ink. React
 * Native has no `status` role: `accessible` makes the region one element so its name speaks.
 */
export function MemberCardsLoading({ label }: MemberCardsLoadingProps) {
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
      <Animated.View style={[styles.list, { opacity }]}>
        {PLACEHOLDERS.map((card) => (
          <View key={card.key} style={[tileSurface, styles.card]}>
            <View style={styles.head}>
              <Bar style={styles.face} />
              <View style={styles.words}>
                <Bar style={styles.word} width={card.name} />
                <Bar style={styles.word} width={card.line} />
              </View>
            </View>
            <Bar style={styles.roles} width={card.roles} />
            <Bar style={styles.act} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
