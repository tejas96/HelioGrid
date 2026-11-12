import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { useFormat } from '../MarketProvider';
import type { DashBar } from './OwnerDashboard.logic';

const { stepMs, maxItems } = theme.motion.stagger;

/**
 * A card's count bars on the phone: each row its words, its rail and its count — the progress
 * bar's 6 px pill, its fill grown once by a scale on the UI thread. The words and the count carry
 * the fact; the rail only shows its size.
 */
export function DashBars({ bars }: { bars: readonly DashBar[] }) {
  const format = useFormat();
  return (
    <View style={styles.bars}>
      {bars.map((bar, index) => (
        <View key={bar.key} style={styles.bar}>
          <View style={styles.label}>
            <Text variant="body-sm">{bar.label}</Text>
          </View>
          <View
            style={styles.rail}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Fill share={bar.share} tone={bar.tone} order={index} />
          </View>
          <View style={styles.count}>
            <Text variant="mono" color="secondary" oneLine align="end">
              {format.number(bar.count)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Fill({ share, tone, order }: { share: number; tone: DashBar['tone']; order: number }) {
  const reduced = useReducedMotion();
  const grow = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const run = Animated.timing(grow, {
      toValue: 1,
      delay: Math.min(order, maxItems) * stepMs,
      duration: theme.motion.durations.data,
      easing: Easing.bezier(...theme.motion.easings.enter),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [grow, order, reduced]);
  return (
    <Animated.View
      style={[
        styles.fill,
        TONE[tone],
        { width: `${Math.round(share * 1000) / 10}%`, transform: [{ scaleX: grow }] },
      ]}
    />
  );
}

const TONE = StyleSheet.create({
  accent: { backgroundColor: colors.accent },
  danger: { backgroundColor: colors.danger },
  neutral: { backgroundColor: colors['line-strong'] },
});

const styles = StyleSheet.create({
  bars: { gap: theme.spacing['sp-3'] },
  bar: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  /* The words take most of the row, so a reason reads on one line at 375; the rail gives way first,
     never below a readable length. */
  label: { flexBasis: '45%', flexGrow: 0, flexShrink: 1, minWidth: 0 },
  /* 6px is the rail's own dimension — the spacing scale has no 6px step (`ProgressBar`). */
  rail: {
    flex: 1,
    minWidth: theme.spacing['sp-12'],
    height: 6,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: theme.radius['r-pill'], transformOrigin: 'left center' },
  count: { minWidth: theme.spacing['sp-6'] },
});
