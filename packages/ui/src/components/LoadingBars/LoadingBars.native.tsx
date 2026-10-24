import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { Animated, AppState, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import type { LoadingBarSize, LoadingBarsProps } from './LoadingBars.types';

type NativeLoadingBarsProps = LoadingBarsProps & {
  style?: StyleProp<ViewStyle>;
};

type BlockSize = Exclude<LoadingBarSize, 'line' | 'option' | 'count'>;

/** The web half's two heights: a closed section's header, and a section open with its fields. */
const BAR_HEIGHT: Record<BlockSize, number> = { row: 56, panel: 188 };
/** The web half's six line lengths, taken in turn. */
const LINE_LENGTHS: readonly DimensionValue[] = ['64%', '38%', '30%', '86%', '62%', '50%'];
/** Half of the web sweep's 1.4 s: the pulse dims, then returns. */
const HALF_PULSE_MS = 700;

const styles = StyleSheet.create({
  bars: { gap: theme.spacing['sp-2'] },
  lines: { gap: theme.spacing['sp-3'] },
  bar: {
    borderRadius: theme.radius['r-lg'],
    // biome-ignore lint/plugin/raw-white: shimmer — a loading bar's shimmer
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    height: theme.spacing['sp-5'],
  },
  lineMark: {
    width: theme.spacing['sp-5'],
    height: theme.spacing['sp-5'],
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors.canvas,
  },
  lineBar: {
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors.canvas,
  },
  /* The phone opens option cards in a sheet only, so its bar is the sheet's: three lines. */
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    backgroundColor: theme.colors.fill,
    borderRadius: theme.radius['r-tile'],
  },
  optionMark: {
    width: theme.spacing['sp-5'],
    height: theme.spacing['sp-5'],
    marginTop: theme.spacing['sp-0-5'],
    borderRadius: theme.radius['r-xs'],
    backgroundColor: theme.colors.canvas,
  },
  optionText: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  optionTitle: { height: theme.type.roles.body.lineHeight, justifyContent: 'center' },
  optionLine: { height: theme.type.roles.caption.lineHeight, justifyContent: 'center' },
  optionTitleBar: {
    width: '45%',
    height: theme.type.roles['body-sm'].fontSize,
    borderRadius: theme.radius['r-xs'],
    backgroundColor: theme.colors.canvas,
  },
  count: {
    height: theme.type.roles.caption.lineHeight,
    justifyContent: 'center',
  },
  countBar: {
    width: theme.spacing['sp-16'],
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: shimmer — a loading bar's shimmer
    backgroundColor: theme.colors.surface,
  },
  optionLineBar: {
    height: theme.type.roles.caption.fontSize,
    borderRadius: theme.radius['r-xs'],
    backgroundColor: theme.colors.canvas,
  },
});

/** The board's two description lengths, a wrapped sentence's (`SCR-M01-13`, `m-loading`). */
const OPTION_LINE_LENGTHS: readonly DimensionValue[] = ['85%', '55%'];

/**
 * The web half sweeps a gradient; React Native has no gradient loop, so the bars pulse opacity —
 * one loop for the whole list, on the UI thread. Reduced motion holds them still at full ink; the
 * loop stops while the app is in the background and starts again when it comes back.
 */
function usePulse() {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: HALF_PULSE_MS, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: HALF_PULSE_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') loop.start();
      else loop.stop();
    });
    return () => {
      app.remove();
      loop.stop();
    };
  }, [reduced, value]);
  return value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
}

function Bar({
  size,
  index,
  opacity,
}: {
  size: LoadingBarSize;
  index: number;
  opacity: Animated.AnimatedInterpolation<number>;
}) {
  if (size === 'count') {
    return (
      <Animated.View style={[styles.count, { opacity }]}>
        <View style={styles.countBar} />
      </Animated.View>
    );
  }
  if (size === 'option') {
    return (
      <Animated.View style={[styles.option, { opacity }]}>
        <View style={styles.optionMark} />
        <View style={styles.optionText}>
          <View style={styles.optionTitle}>
            <View style={styles.optionTitleBar} />
          </View>
          <View>
            {OPTION_LINE_LENGTHS.map((width) => (
              <View key={String(width)} style={styles.optionLine}>
                <View style={[styles.optionLineBar, { width }]} />
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  }
  if (size === 'line') {
    return (
      <Animated.View style={[styles.line, { opacity }]}>
        <View style={styles.lineMark} />
        <View style={[styles.lineBar, { width: LINE_LENGTHS[index % LINE_LENGTHS.length] }]} />
      </Animated.View>
    );
  }
  return <Animated.View style={[styles.bar, { height: BAR_HEIGHT[size], opacity }]} />;
}

/**
 * The bars a list shows in its own place while its record loads. React Native has no `status`
 * role: `accessible` makes the region one element so its name speaks, the polite live region
 * carries the web half's status fact, and `busy` its `aria-busy`. Inside a region the caller
 * already made busy, the bars are hidden from the reader.
 */
export function LoadingBars({ label, bars, style, inBusyRegion }: NativeLoadingBarsProps) {
  const opacity = usePulse();
  const lines = bars.every((size) => size === 'line');
  const frame = [lines ? styles.lines : styles.bars, style];
  const drawn = bars.map((size, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: bars of one size are alike and never reorder
    <Bar key={index} size={size} index={index} opacity={opacity} />
  ));
  if (inBusyRegion) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={frame}
      >
        {drawn}
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      style={frame}
    >
      {drawn}
    </View>
  );
}
