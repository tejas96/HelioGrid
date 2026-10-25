import { theme } from '@heliogrid/theme';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import type { LoadingBarSize, LoadingBarsProps } from './LoadingBars.types';
import { useLoadingPulse } from './use-loading-pulse.native';

type NativeLoadingBarsProps = LoadingBarsProps & {
  style?: StyleProp<ViewStyle>;
};

type BlockSize = Exclude<LoadingBarSize, 'line' | 'option' | 'count'>;

/** The web half's heights: a closed section's header, an open section, one control row. */
const BAR_HEIGHT: Record<BlockSize, number> = { row: 56, panel: 188, control: 40 };
/** The web half's six line lengths, taken in turn. */
const LINE_LENGTHS: readonly DimensionValue[] = ['64%', '38%', '30%', '86%', '62%', '50%'];

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
  const opacity = useLoadingPulse();
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
