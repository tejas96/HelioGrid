import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Circle, G, Svg } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame.native';
import { ChartLegend } from './ChartLegend.native';
import { chartLegendItems, donutCentre, donutDrawing } from './Charts.logic';
import type { DonutChartProps } from './Charts.types';
import { chartColor } from './ChartTokens.native';

interface NativeDonutChartProps extends DonutChartProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-6'], flexWrap: 'wrap' },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: {
    fontSize: theme.type.roles.h2.fontSize,
    lineHeight: theme.type.roles.h2.lineHeight,
    letterSpacing: theme.type.roles.h2.letterSpacing,
    fontWeight: '700',
  },
  legend: { flex: 1, minWidth: 160, flexDirection: 'column', flexWrap: 'nowrap', rowGap: 10 },
});

/** Composition donut with a centred total and a value legend. */
export function DonutChart({
  data,
  size = 168,
  thickness = 22,
  format,
  centerLabel,
  centerValue,
  minPoints = 1,
  ...frame
}: NativeDonutChartProps) {
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  const { total, insufficient, radius, circumference, segments } = donutDrawing(
    data,
    size,
    thickness,
    minPoints,
  );
  const label = frame.title ?? frame.words.donutChart;

  return (
    <ChartFrame
      {...frame}
      height={size}
      insufficient={insufficient}
      insufficientMessage={frame.insufficientMessage ?? frame.words.donutInsufficient}
    >
      <View style={styles.row}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} accessibilityRole="image" accessibilityLabel={label}>
            <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={theme.colors['canvas-sunken']}
                strokeWidth={thickness}
              />
              {segments.map((segment) => (
                <Circle
                  key={segment.datum.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.datum.color ?? chartColor(segment.index)}
                  strokeWidth={thickness}
                  strokeDasharray={[segment.length, circumference]}
                  strokeDashoffset={-segment.offset}
                  strokeLinecap="butt"
                />
              ))}
            </G>
          </Svg>
          <View style={styles.center} pointerEvents="none">
            <Text align="center" style={styles.total}>
              {donutCentre(centerValue, total, fmt)}
            </Text>
            {centerLabel ? (
              <Text variant="caption" color="tertiary" align="center">
                {centerLabel}
              </Text>
            ) : null}
          </View>
        </View>
        <ChartLegend style={styles.legend} items={chartLegendItems(data, fmt)} />
      </View>
    </ChartFrame>
  );
}
