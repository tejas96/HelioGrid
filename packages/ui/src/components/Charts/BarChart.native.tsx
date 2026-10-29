import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { ChartFrame } from './ChartFrame.native';
import { barPercent, barScale } from './Charts.logic';
import type { BarChartProps } from './Charts.types';
import { CHART_GRIDLINE, chartColor } from './ChartTokens.native';
import { datumReading } from './chart-series';

interface NativeBarChartProps extends BarChartProps {
  style?: StyleProp<ViewStyle>;
}

const AXIS_H = 22;
const TRACK_H = 10;

const styles = StyleSheet.create({
  rows: { gap: theme.spacing['sp-2'] + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  rowLabel: { width: '26%' },
  track: {
    flex: 1,
    height: TRACK_H,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: theme.radius['r-pill'] },
  rowValue: { fontWeight: '700' },
  plot: { position: 'relative' },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: AXIS_H,
    flexDirection: 'column-reverse',
    justifyContent: 'space-between',
  },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: CHART_GRIDLINE },
  columns: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: AXIS_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: {
    borderTopLeftRadius: theme.radius['rf-sm'],
    borderTopRightRadius: theme.radius['rf-sm'],
    borderBottomLeftRadius: theme.radius['rf-xs'],
    borderBottomRightRadius: theme.radius['rf-xs'],
  },
  axis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: theme.spacing['sp-2'],
  },
  tick: { flex: 1 },
});

/** Vertical or horizontal bars on --chart-gridline rules. */
export function BarChart({
  data,
  height = 200,
  format,
  minPoints = 1,
  color,
  gridlines = 4,
  horizontal = false,
  ...frame
}: NativeBarChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const mkt = useFormat();
  const fmt = format ?? mkt.number;
  const { insufficient, max, ticks, gap } = barScale(data, minPoints, gridlines, width);

  return (
    <View onLayout={onLayout}>
      <ChartFrame {...frame} height={height} insufficient={insufficient}>
        {horizontal ? (
          <View style={styles.rows}>
            {data.map((d, i) => (
              <View key={d.label} style={styles.row}>
                <Text variant="caption" color="secondary" style={styles.rowLabel}>
                  {d.label}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${barPercent(d, max)}%`,
                        backgroundColor: d.color ?? color ?? chartColor(i),
                      },
                    ]}
                  />
                </View>
                <Text variant="mono" style={styles.rowValue}>
                  {fmt(d.value)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.plot, { height }]}>
            <View style={styles.grid} pointerEvents="none">
              {ticks.map((tick) => (
                <View key={tick} style={styles.rule} />
              ))}
            </View>
            <View style={[styles.columns, { gap }]}>
              {data.map((d, i) => (
                /* Web shows the value in a `title` tooltip on hover; touch has no hover, so
                   the same fact is the bar's accessible name instead. */
                <View
                  key={d.label}
                  accessible
                  accessibilityLabel={datumReading(d.label, fmt(d.value))}
                  style={styles.column}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${barPercent(d, max)}%`,
                        backgroundColor: d.color ?? color ?? chartColor(i),
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.axis}>
              {data.map((d) => (
                <Text
                  key={d.label}
                  variant="caption"
                  color="tertiary"
                  align="center"
                  style={styles.tick}
                >
                  {d.label}
                </Text>
              ))}
            </View>
          </View>
        )}
      </ChartFrame>
    </View>
  );
}
